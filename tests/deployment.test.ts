import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import serverless from 'serverless-http';
import { createApplication } from '../server/app.js';
import type { Database } from '../server/database.js';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createVercelHandler } from '../api/index.js';

test('deployment migration and serverless transport preserve authentication and progress',async()=>{
  const local=new PGlite();await local.waitReady;
  const db:Database={query:(sql,args)=>local.query(sql,args),transaction:fn=>local.transaction(fn),close:()=>local.close()};
  process.env.IMPORT_LEGACY_JSON='false';process.env.STUDENT_DIRECT_MODE='true';process.env.STRIPE_SECRET_KEY='';process.env.SMTP_URL='';
  try {
    await local.exec(await readFile('scripts/deploy-schema.sql','utf8'));
    const app=await createApplication({serverless:true,database:db});const run=serverless(app);
    const request=async(path:string,body?:object,token?:string)=>{
      const response:any=await run({version:'2.0',rawPath:path,rawQueryString:'',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},requestContext:{http:{method:body?'POST':'GET',sourceIp:'192.0.2.1'}},body:body?Buffer.from(JSON.stringify(body)).toString('base64'):'',isBase64Encoded:true},{});
      return {status:response.statusCode,data:JSON.parse(response.body)};
    };
    assert.equal((await request('/api/health')).status,200);
    assert.equal((await request('/api/auth/me')).status,401);
    const registered=await request('/api/auth/register',{email:'deployment@example.test',password:'deployment-test-password'});
    assert.equal(registered.status,200);const {token}=registered.data;
    assert.equal((await request('/api/progress/check-in',{},token)).data.awarded,20);
    assert.equal((await request('/api/progress/check-in',{},token)).data.awarded,0);
    assert.equal((await request('/api/auth/me',undefined,token)).data.progress.points,20);
    assert.equal((await request('/api/missing')).status,404);
    assert.equal((await request('/api/auth/logout',{},token)).status,200);
    assert.equal((await request('/api/auth/me',undefined,token)).status,401);
    // Exercise the Vercel Node transport with real HTTP bodies and the same persisted account.
    const server=createServer(createVercelHandler(async()=>app));
    server.listen(0,'127.0.0.1');await once(server,'listening');
    const address=server.address();assert.ok(address && typeof address!=='string');
    const base=`http://127.0.0.1:${address.port}`;
    try {
      const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.2'},body:JSON.stringify({email:'deployment@example.test',password:'deployment-test-password'})});
      assert.equal(login.status,200);const session=await login.json();
      const me=await fetch(base+'/api/auth/me',{headers:{authorization:`Bearer ${session.token}`}});
      assert.equal(me.status,200);assert.equal((await me.json()).progress.points,20);
      const logout=await fetch(base+'/api/auth/logout',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.token}`},body:'{}'});
      assert.equal(logout.status,200);
      assert.equal((await fetch(base+'/api/auth/me',{headers:{authorization:`Bearer ${session.token}`}})).status,401);
      assert.equal((await fetch(base+'/api/missing')).status,404);
    } finally {server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
  } finally {await db.close();}
});
