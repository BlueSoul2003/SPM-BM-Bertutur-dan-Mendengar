import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { PGlite } from '@electric-sql/pglite';
import express from 'express';
import { migrate, type Database } from '../server/database.js';
import { accountRoutes, PersistentSessions, digest } from '../server/accounts.js';
import { courseRoutes, challengeFor, verifyCourseIdentity } from '../server/course-auth.js';

test('course bridge preserves legacy ownership and rejects forged, replayed and competing claims', async () => {
  const local = new PGlite(); await local.waitReady;
  const db: Database = { query: (sql,args) => local.query(sql,args), transaction: fn => local.transaction(fn), close: () => local.close() };
  await migrate(db);
  const sessions = new PersistentSessions(db);
  const app = express(); app.use(express.json());
  app.use('/api', accountRoutes(db, sessions).router);
  const expiry = Date.now() + 1800_000;
  app.use('/api/course', courseRoutes(db, async token => {
    if (!['student-a','student-b','student-c'].includes(token)) throw Object.assign(new Error('Invalid token'), {status:401});
    return { subject: token, email: 'same@example.test', expires: expiry };
  }));
  app.use((error: any, _req: any, res: any, _next: any) => res.status(error.status || 500).json({ error: error.message }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (path: string, body?: object, token?: string, origin='https://bluesoul2003.github.io') => {
    const response = await fetch(base+'/api'+path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type':'application/json', Origin:origin, ...(token ? {Authorization:`Bearer ${token}`} : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status:response.status, data:await response.json() };
  };
  const login = async (subject: string) => {
    const verifier = randomBytes(32).toString('base64url');
    const auth = await request('/course/authorize', {challenge:challengeFor(verifier)}, subject);
    assert.equal(auth.status,200);
    return {verifier,code:auth.data.code};
  };
  try {
    process.env.COURSE_SSO_ENABLED='false';
    const legacy=await request('/auth/register',{email:'same@example.test',password:'original-password',studentName:'Original student'});
    assert.equal(legacy.status,200);
    await request('/progress/check-in',{},legacy.data.token);
    process.env.COURSE_SSO_ENABLED='true';
    assert.equal((await request('/auth/me',undefined,legacy.data.token)).status,401);
    const proof = challengeFor(randomBytes(32).toString('base64url'));
    assert.equal((await request('/course/authorize',{challenge:proof},'forged')).status,401);
    assert.equal((await request('/course/authorize',{challenge:proof},'student-a','https://attacker.example')).status,403);
    const grant=await login('student-a');
    assert.equal((await request('/course/exchange',{...grant,verifier:randomBytes(32).toString('base64url')})).status,400);
    const setup=await request('/course/exchange',grant);
    assert.equal(setup.data.setupRequired,true); // identical email must NOT auto-link
    assert.equal((await request('/course/exchange',grant)).status,400);
    const bad=await request('/course/complete',{ticket:setup.data.ticket,mode:'link',identifier:'same@example.test',password:'wrong'});
    assert.equal(bad.status,400);
    assert.equal((await db.query('SELECT * FROM course_links')).rows.length,0);
    const linked=await request('/course/complete',{ticket:setup.data.ticket,mode:'link',identifier:'same@example.test',password:'original-password'});
    assert.equal(linked.status,200); assert.equal(linked.data.user.id,legacy.data.user.id);
    assert.equal(linked.data.progress.points,20);
    assert.equal((await request('/course/complete',{ticket:setup.data.ticket,mode:'new'})).status,400);
    assert.equal((await request('/auth/me',undefined,linked.data.token)).status,200);
    const stored=(await db.query('SELECT * FROM sessions WHERE token_hash=$1',[digest(linked.data.token)])).rows[0];
    assert.ok(new Date(stored.expires_at).getTime()<=expiry);
    const other=await request('/course/exchange',await login('student-b'));
    assert.equal((await request('/course/complete',{ticket:other.data.ticket,mode:'link',identifier:'same@example.test',password:'original-password'})).status,409);
    const fresh=await request('/course/complete',{ticket:other.data.ticket,mode:'new'});
    assert.equal(fresh.status,200); assert.notEqual(fresh.data.user.id,legacy.data.user.id); assert.equal(fresh.data.progress.points,0);
    const existing=await request('/course/exchange',await login('student-a'));
    assert.equal(existing.data.user.id,legacy.data.user.id); assert.equal(existing.data.progress.points,20);
    assert.equal((await request('/auth/me',undefined,linked.data.token)).status,401); // replaced session
    await request('/auth/logout',{},existing.data.token);
    assert.equal((await request('/auth/me',undefined,existing.data.token)).status,401);
    const expired=await login('student-c');
    await db.query('UPDATE course_login_codes SET expires_at=now()-interval \'1 second\' WHERE code_hash=$1',[digest(expired.code)]);
    assert.equal((await request('/course/exchange',expired)).status,400);
    await db.query('DELETE FROM rate_buckets');
    const racing=await request('/course/exchange',await login('student-c'));
    const attempts=await Promise.all([1,2].map(()=>request('/course/complete',{ticket:racing.data.ticket,mode:'new'})));
    assert.deepEqual(attempts.map(x=>x.status).sort(),[200,400]);
    assert.equal((await db.query('SELECT * FROM course_links WHERE subject=$1',['student-c'])).rows.length,1);
    assert.equal((await db.query('SELECT points FROM accounts WHERE id=$1',[legacy.data.user.id])).rows[0].points,20);
  } finally { delete process.env.COURSE_SSO_ENABLED; await new Promise<void>(resolve=>server.close(()=>resolve())); await local.close(); }
});

test('course issuer verification does not trust forged claims or anonymous identities', async () => {
  const originalFetch=globalThis.fetch;
  process.env.COURSE_AUTH_PUBLIC_KEY='public-test-key';
  const token=(claims:object)=>'header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';
  const claims={sub:'real-id',iss:'https://ycsixsyssbdovpmmhefz.supabase.co/auth/v1',exp:Math.floor(Date.now()/1000)+300};
  try {
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://ycsixsyssbdovpmmhefz.supabase.co/auth/v1/user');
      assert.ok((options?.headers as any).Authorization.startsWith('Bearer '));
      return Response.json({id:'real-id',email:'student@example.test',user_metadata:{role:'admin'}});
    };
    assert.equal((await verifyCourseIdentity(token(claims))).subject,'real-id');
    await assert.rejects(verifyCourseIdentity(token({...claims,sub:'other-id'})));
    await assert.rejects(verifyCourseIdentity(token({...claims,iss:'https://attacker.example/auth/v1'})));
    await assert.rejects(verifyCourseIdentity(token({...claims,exp:1})));
    globalThis.fetch=async()=>Response.json({id:'real-id',email:'student@example.test',is_anonymous:true});
    await assert.rejects(verifyCourseIdentity(token(claims)));
    globalThis.fetch=async()=>Response.json({error:'invalid'},{status:401});
    await assert.rejects(verifyCourseIdentity(token(claims)));
  } finally {globalThis.fetch=originalFetch;delete process.env.COURSE_AUTH_PUBLIC_KEY;}
});
