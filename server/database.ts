import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

export interface Queryable { query(sql: string, values?: any[]): Promise<{ rows: any[] }> }
export interface Database extends Queryable {
  transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export async function openDatabase(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000, statement_timeout: 10_000 });
    pool.on('error', () => console.error('Database connection error'));
    return {
      query: (sql, values) => pool.query(sql, values),
      transaction: async work => {
        const client = await pool.connect();
        try { await client.query('BEGIN'); const value = await work(client); await client.query('COMMIT'); return value; }
        catch (error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
      },
      close: () => pool.end(),
    };
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_DATABASE !== 'true') {
    throw new Error('Production requires DATABASE_URL. ALLOW_LOCAL_DATABASE=true is only for a single-process local preview.');
  }
  const localRoot = path.resolve(process.env.DATA_DIR || 'data');
  await mkdir(localRoot, { recursive: true });
  const local = new PGlite(path.join(localRoot, 'postgres'));
  await local.waitReady;
  return { query: (sql, values) => local.query(sql, values), transaction: work => local.transaction(tx => work(tx)), close: () => local.close() };
}

export async function migrate(db: Database) {
  await db.transaction(async tx => {
    await tx.query(`CREATE TABLE IF NOT EXISTS schema_versions (version integer PRIMARY KEY)`);
    await tx.query(`CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY, email text NOT NULL UNIQUE, username text NOT NULL UNIQUE,
      password_hash text, salt text, profile jsonb NOT NULL DEFAULT '{}',
      points integer NOT NULL DEFAULT 0 CHECK(points >= 0), streak integer NOT NULL DEFAULT 0,
      last_checkin text NOT NULL DEFAULT '', last_grade jsonb,
      speaking_done integer NOT NULL DEFAULT 0, listening_done integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await tx.query(`CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL)`);
    await tx.query(`CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at)`);
    await tx.query(`CREATE TABLE IF NOT EXISTS attempts (
      id text NOT NULL, user_id text NOT NULL REFERENCES accounts(id), kind text NOT NULL,
      topic text NOT NULL, input_hash text NOT NULL, result jsonb NOT NULL,
      awarded integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,id))`);
    await tx.query(`CREATE TABLE IF NOT EXISTS rewards (
      user_id text NOT NULL REFERENCES accounts(id), reward_key text NOT NULL,
      points integer NOT NULL CHECK(points >= 0), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,reward_key))`);
    await tx.query(`CREATE TABLE IF NOT EXISTS rate_buckets (
      bucket text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL)`);
    await tx.query(`CREATE INDEX IF NOT EXISTS rate_expiry ON rate_buckets(expires_at)`);
    await tx.query(`CREATE TABLE IF NOT EXISTS entitlements (
      user_id text PRIMARY KEY REFERENCES accounts(id), provider text NOT NULL,
      subscription_id text UNIQUE, valid_until timestamptz NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
    await tx.query(`CREATE TABLE IF NOT EXISTS payment_events (
      id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now())`);
    await tx.query(`CREATE TABLE IF NOT EXISTS reset_tokens (
      token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES accounts(id), expires_at timestamptz NOT NULL)`);
    await tx.query(`CREATE TABLE IF NOT EXISTS imports (source_hash text PRIMARY KEY, imported_at timestamptz NOT NULL DEFAULT now(), count integer NOT NULL)`);
    await tx.query(`INSERT INTO schema_versions(version) VALUES (1) ON CONFLICT DO NOTHING`);
  });
}
