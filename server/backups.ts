import { readFile, writeFile } from 'node:fs/promises';
import type { Database } from './database.js';
import { digest } from './accounts.js';

const columns:Record<string,string[]>={
  accounts:['id','email','username','password_hash','salt','profile','points','streak','last_checkin','last_grade','speaking_done','listening_done','created_at'],
  attempts:['id','user_id','kind','topic','input_hash','result','awarded','created_at'],
  rewards:['user_id','reward_key','points','created_at'],
  entitlements:['user_id','provider','subscription_id','valid_until','updated_at'],
  payment_events:['id','processed_at'],imports:['source_hash','imported_at','count'],
};
export async function backup(db: Database,filename: string){
  const tables=await db.transaction(async tx=>{
    await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    const data:Record<string,any[]>={};
    for(const table of Object.keys(columns))data[table]=(await tx.query(`SELECT * FROM ${table}`)).rows;
    return data;
  });
  const payload=JSON.stringify({version:1,createdAt:new Date().toISOString(),tables});
  const envelope=JSON.stringify({checksum:digest(payload),payload});
  await writeFile(filename,envelope,{encoding:'utf8',flag:'wx',mode:0o600});
  return {accounts:tables.accounts.length,attempts:tables.attempts.length};
}
export async function restore(db: Database,filename: string){
  const envelope=JSON.parse(await readFile(filename,'utf8'));
  if(typeof envelope.payload!=='string'||digest(envelope.payload)!==envelope.checksum)throw new Error('Backup checksum mismatch');
  const data=JSON.parse(envelope.payload);
  if(data.version!==1||!data.tables||Object.keys(data.tables).some(t=>!columns[t]))throw new Error('Unsupported backup schema');
  await db.transaction(async tx=>{
    for(const table of [...Object.keys(columns),'sessions','reset_tokens'])if((await tx.query(`SELECT 1 FROM ${table} LIMIT 1`)).rows.length)throw new Error('Restore requires an empty target database');
    for(const [table,keys] of Object.entries(columns)){
      if(!Array.isArray(data.tables[table]))throw new Error('Invalid backup table');
      for(const row of data.tables[table]){
        const values=keys.map(k=>['profile','last_grade','result'].includes(k)&&row[k]!==null?JSON.stringify(row[k]):row[k]);
        await tx.query(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map((_,i)=>`$${i+1}`).join(',')})`,values);
      }
    }
  });
  return {accounts:data.tables.accounts.length,attempts:data.tables.attempts.length};
}
