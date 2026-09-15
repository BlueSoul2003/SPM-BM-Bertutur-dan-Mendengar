import { Router, type RequestHandler } from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Database, Queryable } from './database.js';
import { hashPassword, verifyPassword, bearer } from './security.js';

export const digest = (s: string) => createHash('sha256').update(s).digest('hex');
export const route = (fn: (...args: any[]) => Promise<any>): RequestHandler => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
export const malaysiaDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function progress(row: any) {
  const thresholds = [0,150,400,800,1400,2200];
  const names = ['Pemula Bahasa','Penutur Asas','Penutur Mahir','Cemerlang SPM','Wira Debat SPM','Juara Kebangsaan SPM'];
  const level = thresholds.filter(n => row.points >= n).length;
  return { ...row.profile, userId: row.id, email: row.email, username: row.username, points: row.points, streak: row.streak,
    lastCheckInDate: row.last_checkin, claimedStreakDays: Array.from({length: row.streak ? ((row.streak - 1) % 7) + 1 : 0}, (_,i) => i+1),
    level, levelName: names[level-1], totalSpeakingDone: row.speaking_done, totalListeningDone: row.listening_done,
    totalExercisesDone: row.speaking_done + row.listening_done, lastSpmGrade: row.last_grade, isRegistered: true };
}
export function publicUser(row: any) { return { ...row.profile, id: row.id, email: row.email, username: row.username, createdAt: row.created_at, isRegistered: true }; }
export async function account(db: Queryable, id: string, lock = false) {
  return (await db.query(`SELECT * FROM accounts WHERE id=$1${lock ? ' FOR UPDATE' : ''}`, [id])).rows[0];
}
export class PersistentSessions {
  constructor(private db: Database) {}
  async create(userId: string) {
    const token = randomBytes(32).toString('hex');
    await this.db.transaction(async tx => {
      await account(tx, userId, true);
      await tx.query('DELETE FROM sessions WHERE user_id=$1 OR expires_at <= now()', [userId]);
      await tx.query("INSERT INTO sessions VALUES ($1,$2,now()+interval '7 days')", [digest(token), userId]);
    });
    return token;
  }
  async get(token: string) { if (!token) return undefined; return (await this.db.query('SELECT user_id FROM sessions WHERE token_hash=$1 AND expires_at>now()', [digest(token)])).rows[0]?.user_id; }
  async delete(token: string) { await this.db.query('DELETE FROM sessions WHERE token_hash=$1', [digest(token)]); }
}

/** Explicit, repeatable import; never modifies or deletes legacy files. */
export async function importLegacy(db: Database, filename: string) {
  const raw = await readFile(filename, 'utf8');
  const sourceHash = digest(raw);
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error('Legacy source must be an array');
  return db.transaction(async tx => {
    if ((await tx.query('SELECT 1 FROM imports WHERE source_hash=$1', [sourceHash])).rows.length) return 0;
    for (const u of rows) {
      if (typeof u.id !== 'string' || typeof u.email !== 'string' || typeof u.username !== 'string') throw new Error('Invalid legacy identity; import rolled back');
      const profile = { studentName: u.studentName || 'Calon SPM', schoolName: u.schoolName || '', state: u.state || 'Malaysia', avatar: u.avatar || '⭐', authProvider: u.authProvider || 'email' };
      // Preserve historical counters as a migration baseline; new writes are server-authoritative.
      const count=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=2147483647?Number(n):0;
      await tx.query('INSERT INTO accounts(id,email,username,password_hash,salt,profile,points,streak,last_checkin,last_grade,speaking_done,listening_done) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING',
        [u.id,u.email.toLowerCase(),u.username.toLowerCase(),u.passwordHash || null,u.salt || null,JSON.stringify(profile),count(u.points),count(u.streak),/^\d{4}-\d{2}-\d{2}$/.test(u.lastCheckInDate||'')?u.lastCheckInDate:'',u.lastSpmGrade?JSON.stringify(u.lastSpmGrade):null,count(u.totalSpeakingDone),count(u.totalListeningDone)]);
    }
    await tx.query('INSERT INTO imports(source_hash,count) VALUES($1,$2)', [sourceHash,rows.length]);
    return rows.length;
  });
}

export function sharedRateLimit(db: Database, scope: string, max: number, seconds: number): RequestHandler {
  return route(async (req,res,next) => {
    const window = Math.floor(Date.now()/1000/seconds);
    const key = `${scope}:${digest(res.locals.userId || req.ip || 'unknown')}:${window}`;
    const row = (await db.query(`INSERT INTO rate_buckets(bucket,hits,expires_at) VALUES ($1,1,to_timestamp($2))
      ON CONFLICT(bucket) DO UPDATE SET hits=rate_buckets.hits+1 RETURNING hits`, [key,(window+1)*seconds])).rows[0];
    if (row.hits > max) { res.setHeader('Retry-After', Math.max(1,(window+1)*seconds-Math.floor(Date.now()/1000))); return res.status(429).json({error:'Terlalu banyak permintaan. Cuba lagi sebentar.'}); }
    next();
  });
}

export function accountRoutes(db: Database, sessions: PersistentSessions) {
  const router = Router();
  const auth: RequestHandler = route(async(req,res,next) => {
    const id = await sessions.get(bearer(req));
    if (!id) return res.status(401).json({error:'Sesi telah tamat. Sila log masuk semula.'});
    if(req.body?.userId && req.body.userId!==id) return res.status(403).json({error:'Akses akaun tidak dibenarkan.'});
    res.locals.userId=id; next();
  });
  router.post('/auth/register', route(async(req,res)=>{
    const {email,password}=req.body;
    if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||typeof password!=='string'||password.length<8||password.length>256) return res.status(400).json({error:'E-mel sah dan kata laluan 8–256 aksara diperlukan.'});
    const id=randomUUID(), salt=randomBytes(16).toString('hex');
    const passwordHash=await hashPassword(password,salt);
    const profile={studentName:'Calon SPM',schoolName:'',state:'Malaysia',avatar:'⭐',authProvider:'email'};
    if(typeof req.body.studentName==='string') profile.studentName=req.body.studentName.trim().slice(0,100);
    let row;
    try { row=(await db.query('INSERT INTO accounts(id,email,username,password_hash,salt,profile) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [id,email.trim().toLowerCase(),`calon_${randomBytes(8).toString('hex')}`,passwordHash,salt,JSON.stringify(profile)])).rows[0]; }
    catch(e:any) { if(e.code==='23505') return res.status(400).json({error:'E-mel ini telah didaftarkan. Sila log masuk.'}); throw e; }
    res.json({success:true,token:await sessions.create(id),user:publicUser(row),progress:progress(row)});
  }));
  router.post('/auth/login', route(async(req,res)=>{
    const key=req.body.identifier||req.body.email||req.body.username, password=req.body.password;
    if(typeof key!=='string'||typeof password!=='string'||password.length>256) return res.status(400).json({error:'Permintaan tidak sah.'});
    const row=(await db.query('SELECT * FROM accounts WHERE email=$1 OR username=$1',[key.trim().toLowerCase()])).rows[0];
    if(!row?.password_hash||!row.salt||!await verifyPassword(password,row.salt,row.password_hash)) return res.status(401).json({error:'E-mel atau kata laluan tidak sah.'});
    if(!row.password_hash.startsWith('scrypt:')) await db.query('UPDATE accounts SET password_hash=$1 WHERE id=$2 AND password_hash=$3',[await hashPassword(password,row.salt),row.id,row.password_hash]);
    // Lock and recheck prevents a password reset racing a successful login.
    const token = await db.transaction(async tx => {
      const current = await account(tx,row.id,true);
      if(current.password_hash!==row.password_hash && !await verifyPassword(password,current.salt,current.password_hash)) return null;
      const token=randomBytes(32).toString('hex');
      await tx.query('DELETE FROM sessions WHERE user_id=$1',[row.id]);
      await tx.query("INSERT INTO sessions VALUES($1,$2,now()+interval '7 days')",[digest(token),row.id]);return token;
    });
    if(!token)return res.status(401).json({error:'Sila log masuk semula.'});
    res.json({success:true,token,user:publicUser(row),progress:progress(row)});
  }));
  router.get('/auth/me',auth,route(async(_req,res)=>{const row=await account(db,res.locals.userId);res.json({success:true,user:publicUser(row),progress:progress(row)});}));
  router.post('/auth/logout',route(async(req,res)=>{await sessions.delete(bearer(req));res.json({success:true});}));
  router.post('/auth/update-profile',auth,route(async(req,res)=>{
    const patch:Record<string,string>={};
    for(const key of ['studentName','schoolName','state','avatar'])if(req.body[key]!==undefined){if(typeof req.body[key]!=='string'||req.body[key].length>100)return res.status(400).json({error:'Medan tidak sah.'});patch[key]=req.body[key].trim();}
    const row=(await db.query('UPDATE accounts SET profile=profile || $1::jsonb WHERE id=$2 RETURNING *',[JSON.stringify(patch),res.locals.userId])).rows[0];
    res.json({success:true,user:publicUser(row),progress:progress(row)});
  }));
  router.post(['/auth/sync-progress','/leaderboard/sync'],auth,route(async(_req,res)=>{
    // Compatibility endpoint is deliberately read-only: no client points/grades are accepted.
    res.json({success:true,progress:progress(await account(db,res.locals.userId))});
  }));
  router.post('/progress/check-in',auth,route(async(_req,res)=>{
    const result=await db.transaction(async tx=>{
      const row=await account(tx,res.locals.userId,true), today=malaysiaDay();
      if(row.last_checkin===today)return {progress:progress(row),awarded:0};
      const yesterday=new Date(Date.parse(today+'T00:00:00Z')-86400_000).toISOString().slice(0,10);
      const streak=row.last_checkin===yesterday?row.streak+1:1;
      const reward=[20,30,40,50,65,80,120][(streak-1)%7];
      await tx.query('INSERT INTO rewards(user_id,reward_key,points) VALUES($1,$2,$3)',[row.id,`checkin:${today}`,reward]);
      const updated=(await tx.query('UPDATE accounts SET points=points+$1,streak=$2,last_checkin=$3 WHERE id=$4 RETURNING *',[reward,streak,today,row.id])).rows[0];
      return {progress:progress(updated),awarded:reward};
    });res.json(result);
  }));
  router.get('/leaderboard',route(async(_req,res)=>{
    const rows=(await db.query('SELECT * FROM accounts ORDER BY points DESC,id LIMIT 100')).rows;
    const entries=rows.map((r,i)=>({id:r.id,rank:i+1,name:r.profile.studentName||'Calon SPM',school:r.profile.schoolName||'',state:r.profile.state||'Malaysia',avatar:r.profile.avatar||'⭐',points:r.points,streak:r.streak,predictedGrade:r.last_grade?.grade||'—',username:'',isRegistered:true,isCurrentUser:false,trend:'same',league:i<3?'diamond':i<8?'gold':i<14?'silver':'bronze'}));
    const total=Number((await db.query('SELECT count(*) AS n FROM accounts')).rows[0].n);
    res.json({entries,totalRealUsers:total,registeredCount:total});
  }));
  return {router,auth};
}
