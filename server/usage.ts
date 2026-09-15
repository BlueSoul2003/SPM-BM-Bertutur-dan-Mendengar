import { randomUUID } from 'node:crypto';
import type { Database } from './database.js';
import { digest, malaysiaDay } from './accounts.js';

export type AiFeature = 'speaking' | 'chat' | 'dictionary' | 'feedback' | 'audio';
const defaults = { speaking: 3, chat: 10, dictionary: 10, feedback: 10, audio: 10 };
const failure = (code: string, message: string) => Object.assign(new Error(message), { status: 429, code });
function setting(name: string, fallback: number) {
  const n = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid usage configuration');
  return n;
}
export async function usageStatus(db: Database, userId: string) {
  const premium = Boolean((await db.query('SELECT 1 FROM entitlements WHERE user_id=$1 AND valid_until>now()', [userId])).rows.length);
  const features = {} as Record<AiFeature, { limit: number; used: number; pending: number; remaining: number }>;
  for (const feature of Object.keys(defaults) as AiFeature[]) {
    const limit = setting(`${premium ? 'PREMIUM' : 'FREE'}_${feature.toUpperCase()}_DAILY_LIMIT`, defaults[feature] * (premium ? 10 : 1));
    const rows = (await db.query(`SELECT status, count(*)::integer AS count FROM ai_usage WHERE user_id=$1 AND feature=$2 AND day=$3 AND (status='done' OR lease_until>now()) GROUP BY status`, [userId, feature, malaysiaDay()])).rows;
    const used = rows.find(r => r.status === 'done')?.count || 0;
    const pending = rows.find(r => r.status === 'pending')?.count || 0;
    features[feature] = { limit, used, pending, remaining: Math.max(0, limit - used - pending) };
  }
  return { day: malaysiaDay(), timezone: 'Asia/Kuala_Lumpur', features };
}

/** Reserve capacity atomically; persist successful responses so retries never call the provider twice. */
export async function metered<T>(db: Database, userId: string, feature: AiFeature, input: string, work: () => Promise<T>): Promise<T> {
  const key = digest(input), owner = randomUUID(), day = malaysiaDay();
  const reserved = await db.transaction(async tx => {
    // One short database lock serializes reservations across processes, never provider calls.
    await tx.query(`INSERT INTO rate_buckets VALUES('usage-reservations',0,'9999-01-01') ON CONFLICT DO NOTHING`);
    await tx.query(`SELECT bucket FROM rate_buckets WHERE bucket='usage-reservations' FOR UPDATE`);
    const existing = (await tx.query('SELECT *, lease_until>now() AS live FROM ai_usage WHERE user_id=$1 AND feature=$2 AND input_hash=$3', [userId, feature, key])).rows[0];
    if (existing?.status === 'done') return { cached: true, value: existing.result };
    if ((await tx.query(`SELECT 1 FROM ai_usage WHERE user_id=$1 AND status='pending' AND lease_until>now()`, [userId])).rows.length) throw failure('AI_IN_PROGRESS', 'Permintaan AI masih diproses. Sila tunggu.');
    const premium = Boolean((await tx.query('SELECT 1 FROM entitlements WHERE user_id=$1 AND valid_until>now()', [userId])).rows.length);
    const limit = setting(`${premium ? 'PREMIUM' : 'FREE'}_${feature.toUpperCase()}_DAILY_LIMIT`, defaults[feature] * (premium ? 10 : 1));
    const count = (await tx.query(`SELECT count(*)::integer AS total FROM ai_usage WHERE user_id=$1 AND feature=$2 AND day=$3 AND (status='done' OR lease_until>now())`, [userId, feature, day])).rows[0].total;
    if (count >= limit) throw failure('DAILY_QUOTA_EXCEEDED', 'Had harian untuk fungsi ini telah dicapai. Cuba lagi esok.');
    const total = (await tx.query(`SELECT count(*)::integer AS total FROM ai_usage WHERE day=$1 AND (status='done' OR lease_until>now())`, [day])).rows[0].total;
    if (total >= setting('GLOBAL_AI_DAILY_LIMIT', 500)) throw failure('GLOBAL_QUOTA_EXCEEDED', 'Had AI platform hari ini telah dicapai. Latihan biasa masih tersedia.');
    await tx.query(`INSERT INTO ai_usage(user_id,feature,input_hash,day,status,owner,lease_until) VALUES($1,$2,$3,$4,'pending',$5,now()+interval '2 minutes') ON CONFLICT(user_id,feature,input_hash) DO UPDATE SET day=EXCLUDED.day,status='pending',owner=EXCLUDED.owner,lease_until=EXCLUDED.lease_until,result=NULL`, [userId, feature, key, day, owner]);
    return { cached: false, value: null };
  });
  if (reserved.cached) return reserved.value as T;
  try {
    const value = await work();
    const saved = await db.query(`UPDATE ai_usage SET status='done',result=$1 WHERE user_id=$2 AND feature=$3 AND input_hash=$4 AND owner=$5 AND status='pending' AND lease_until>now() RETURNING owner`, [JSON.stringify(value), userId, feature, key, owner]);
    if (!saved.rows.length) throw new Error('AI reservation expired. Please retry.');
    return value;
  } catch (error) {
    await db.query(`DELETE FROM ai_usage WHERE user_id=$1 AND feature=$2 AND input_hash=$3 AND owner=$4 AND status='pending'`, [userId, feature, key, owner]);
    throw error;
  }
}
