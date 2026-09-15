import { randomBytes, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, RequestHandler } from 'express';

const derive = promisify(scrypt);
export async function hashPassword(password: string, salt: string): Promise<string> {
  return `scrypt:${((await derive(password, salt, 64)) as Buffer).toString('hex')}`;
}
export async function verifyPassword(password: string, salt: string, stored: string): Promise<boolean> {
  const candidate = stored.startsWith('scrypt:')
    ? await hashPassword(password, salt)
    : createHash('sha256').update(`${salt}:${password}`).digest('hex');
  const a = Buffer.from(candidate), b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

export class Sessions {
  private records = new Map<string, { userId: string; expires: number }>();
  constructor(private ttl = 7 * 86400_000) {}
  create(userId: string) {
    const now = Date.now();
    for (const [key, value] of this.records) if (value.expires <= now) this.records.delete(key);
    // Bound memory and keep only the latest session per account.
    for (const [key, value] of this.records) if (value.userId === userId) this.records.delete(key);
    if (this.records.size >= 10_000) this.records.delete(this.records.keys().next().value!);
    const token = randomBytes(32).toString('hex');
    this.records.set(token, { userId, expires: now + this.ttl });
    return token;
  }
  get(token: string) {
    const session = this.records.get(token);
    if (!session || session.expires <= Date.now()) { this.records.delete(token); return undefined; }
    return session.userId;
  }
  delete(token: string) { this.records.delete(token); }
}
export const bearer = (req: Request) => req.headers.authorization?.startsWith('Bearer ')
  ? req.headers.authorization.slice(7) : '';

export function requireSession(sessions: Sessions): RequestHandler {
  return (req, res, next) => {
    const userId = sessions.get(bearer(req));
    if (!userId) { res.status(401).json({ error: 'Sesi telah tamat. Sila log masuk semula.' }); return; }
    if (req.body?.userId && req.body.userId !== userId) {
      res.status(403).json({ error: 'Akses akaun tidak dibenarkan.' }); return;
    }
    res.locals.userId = userId;
    next();
  };
}

export function rateLimit(max: number, windowMs: number): RequestHandler {
  const buckets = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.reset <= now) buckets.delete(key);
    const key = res.locals.userId || req.ip || 'unknown';
    if (!buckets.has(key)) {
      if (buckets.size >= 10_000) { res.status(503).json({ error: 'Pelayan sibuk. Cuba lagi sebentar.' }); return; }
      buckets.set(key, { count: 0, reset: now + windowMs });
    }
    const bucket = buckets.get(key)!;
    if (++bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.reset - now) / 1000));
      res.status(429).json({ error: 'Terlalu banyak permintaan. Cuba lagi sebentar.' }); return;
    }
    next();
  };
}

export function concurrencyLimit(max: number): RequestHandler {
  let active = 0;
  return (_req, res, next) => {
    if (active >= max) { res.status(503).json({ error: 'Pelayan sibuk. Cuba lagi sebentar.' }); return; }
    active++;
    let released = false;
    const release = () => { if (!released) { released = true; active--; } };
    res.once('finish', release); res.once('close', release);
    next();
  };
}
