import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { migrate, type Database } from '../server/database.js';
import { metered, usageStatus } from '../server/usage.js';

test('usage reserves globally, refunds failures, deduplicates retries and separates features', async()=>{
  const local=new PGlite();await local.waitReady;
  const db:Database={query:(sql,args)=>local.query(sql,args),transaction:fn=>local.transaction(fn),close:()=>local.close()};
  process.env.FREE_CHAT_DAILY_LIMIT='2';process.env.FREE_SPEAKING_DAILY_LIMIT='1';process.env.GLOBAL_AI_DAILY_LIMIT='3';
  try {
    await migrate(db);
    for(const id of ['a','b'])await db.query('INSERT INTO accounts(id,email,username) VALUES($1,$1,$1)',[id]);
    let calls=0;
    const work=async()=>{calls++;return {text:'valid'};};
    await assert.rejects(metered(db,'a','chat','failed',async()=>{throw new Error('provider offline');}),/offline/);
    assert.equal((await usageStatus(db,'a')).features.chat.remaining,2);
    await metered(db,'a','chat','first',work);
    await Promise.all(Array.from({length:5},()=>metered(db,'a','chat','first',work)));
    assert.equal(calls,1);
    let release!:(value:any)=>void, entered!:()=>void;
    const ready=new Promise<void>(r=>entered=r);
    const running=metered(db,'a','chat','second',async()=>{entered();return new Promise(r=>release=r);});
    await ready;
    assert.equal((await usageStatus(db,'a')).features.chat.pending,1);
    await assert.rejects(metered(db,'a','speaking','speech',work),(e:any)=>e.code==='AI_IN_PROGRESS');
    release({text:'done'});await running;
    await assert.rejects(metered(db,'a','chat','third',work),(e:any)=>e.code==='DAILY_QUOTA_EXCEEDED');
    // A different feature still has its own quota; global capacity is atomic across accounts.
    const results=await Promise.allSettled([metered(db,'a','speaking','speech',work),metered(db,'b','chat','other',work)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(results.filter(r=>r.status==='rejected'&&(r.reason as any).code==='GLOBAL_QUOTA_EXCEEDED').length,1);
    assert.deepEqual(await metered(db,'a','chat','first',work),{text:'valid'}); // cached results work after limits
    // A new day restores capacity while old successful retries stay free.
    await db.query("UPDATE ai_usage SET day='2000-01-01'");
    assert.equal((await usageStatus(db,'a')).features.chat.remaining,2);
    await metered(db,'a','chat','new-day',work);
    // Crashed requests expire and can be retried without permanent quota loss.
    await db.query("UPDATE ai_usage SET status='pending',lease_until=now()-interval '1 second' WHERE input_hash IN (SELECT input_hash FROM ai_usage WHERE user_id='a' AND day='2000-01-01')");
    await metered(db,'a','chat','first',work);
    assert.equal((await usageStatus(db,'a')).features.chat.used,2);
  } finally {await db.close();}
});
