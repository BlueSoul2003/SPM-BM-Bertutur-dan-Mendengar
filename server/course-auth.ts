import { Router } from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Database, Queryable } from './database.js';
import { account, digest, progress, publicUser, route, sharedRateLimit } from './accounts.js';
import { bearer, verifyPassword } from './security.js';
import { courseAuthUrl, courseConfig, courseEnabled } from './course-config.js';

export interface CourseIdentity { subject: string; email: string; expires: number }
export type VerifyCourseIdentity = (token: string) => Promise<CourseIdentity>;
const fail = (status: number, message: string): never => { throw Object.assign(new Error(message), { status }); };
const validProof = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export const challengeFor = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');

// The fixed issuer verifies the token remotely. No user-supplied issuer, decoded
// identity or editable user_metadata is ever trusted for account ownership.
export const verifyCourseIdentity: VerifyCourseIdentity = async token => {
  if (!token || token.length > 8192) fail(401, 'Sila log masuk ke interactive-course semula.');
  const key = process.env.COURSE_AUTH_PUBLIC_KEY;
  if (!key) fail(503, 'Sambungan akaun sedang disediakan.');
  let response: Response;
  try {
    response = await fetch(`${courseAuthUrl()}/auth/v1/user`, {
      headers: { apikey: key!, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000), redirect: 'error',
    });
  } catch { return fail(503, 'Sambungan akaun terganggu. Cuba lagi.'); }
  if (!response.ok) fail(response.status === 401 || response.status === 403 ? 401 : 503, 'Sila log masuk ke interactive-course semula.');
  const user = await response.json();
  let claims: any;
  try { claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()); } catch { return fail(401, 'Sesi tidak sah.'); }
  if (!user.id || user.is_anonymous || !user.email || claims.sub !== user.id || claims.iss !== `${courseAuthUrl()}/auth/v1` || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) fail(401, 'Sesi tidak sah.');
  return { subject: user.id, email: user.email, expires: Math.min(claims.exp * 1000, Date.now() + 3600_000) };
};

async function issueSession(tx: Queryable, userId: string, expires: Date) {
  const row = await account(tx, userId, true);
  const token = `ic.${randomBytes(32).toString('hex')}`;
  await tx.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
  await tx.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [digest(token), userId, expires]);
  return { success: true, token, user: publicUser(row), progress: progress(row) };
}

export function courseRoutes(db: Database, verify: VerifyCourseIdentity = verifyCourseIdentity) {
  const router = Router();
  router.get('/config', (_req, res) => res.json(courseConfig()));
  // Only the portal needs CORS. Bual exchange/setup are same-origin JSON POSTs.
  router.use('/authorize', (req, res, next) => {
    const allowed = new URL(courseConfig().portalUrl).origin;
    if (req.headers.origin !== allowed) return res.status(403).json({ error: 'Asal permintaan tidak dibenarkan.' });
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  router.use((_req, res, next) => courseEnabled() ? next() : res.status(503).json({ error: 'Sambungan belum dibuka.' }));
  router.use(sharedRateLimit(db, 'course-auth', 120, 900));
  router.post('/authorize', route(async (req, res) => {
    if (!validProof(req.body.challenge)) fail(400, 'Permintaan tidak sah.');
    const identity = await verify(bearer(req));
    const code = randomBytes(32).toString('base64url');
    await db.query('DELETE FROM course_login_codes WHERE expires_at <= now()');
    await db.query(`INSERT INTO course_login_codes(code_hash,kind,challenge,subject,email,expires_at,session_expires_at)
      VALUES($1,'login',$2,$3,$4,$5,$6)`, [digest(code), req.body.challenge, identity.subject, identity.email,
      new Date(Math.min(Date.now() + 120_000, identity.expires)), new Date(identity.expires)]);
    res.json({ code });
  }));
  router.post('/exchange', route(async (req, res) => {
    if (!validProof(req.body.code) || !validProof(req.body.verifier)) fail(400, 'Permintaan tidak sah.');
    const result = await db.transaction(async tx => {
      const grant = (await tx.query(`DELETE FROM course_login_codes WHERE code_hash=$1 AND challenge=$2
        AND kind='login' AND expires_at>now() RETURNING *`, [digest(req.body.code), challengeFor(req.body.verifier)])).rows[0];
      if (!grant) fail(400, 'Pautan log masuk telah tamat atau digunakan. Sila cuba lagi.');
      const link = (await tx.query('SELECT user_id FROM course_links WHERE subject=$1', [grant.subject])).rows[0];
      if (link) return issueSession(tx, link.user_id, grant.session_expires_at);
      const ticket = randomBytes(32).toString('base64url');
      await tx.query(`INSERT INTO course_login_codes(code_hash,kind,challenge,subject,email,expires_at,session_expires_at)
        VALUES($1,'setup','',$2,$3,$4,$5)`, [digest(ticket), grant.subject, grant.email,
        new Date(Math.min(Date.now() + 600_000, new Date(grant.session_expires_at).getTime())), grant.session_expires_at]);
      return { setupRequired: true, ticket, email: grant.email };
    });
    res.json(result);
  }));
  router.post('/complete', route(async (req, res, next) => {
    // Limit password guesses by verified portal identity, not by a school's
    // shared IP. An arbitrary/expired ticket never reaches password verification.
    if (!validProof(req.body?.ticket)) fail(400, 'Permintaan tidak sah.');
    const grant = (await db.query("SELECT subject FROM course_login_codes WHERE code_hash=$1 AND kind='setup' AND expires_at>now()", [digest(req.body.ticket)])).rows[0];
    if (!grant) fail(400, 'Sesi penyambungan telah tamat. Sila log masuk semula.');
    res.locals.userId = `course:${grant.subject}`; next();
  }), sharedRateLimit(db, 'course-link', 5, 900), route(async (req, res) => {
    const { ticket, mode, identifier, password } = req.body;
    if (!validProof(ticket) || !['new', 'link'].includes(mode)) fail(400, 'Permintaan tidak sah.');
    // Locking the setup grant and unique constraints make duplicate requests and
    // competing claims fail atomically. Nothing is moved or deleted from accounts.
    const result = await db.transaction(async tx => {
      const grant = (await tx.query(`SELECT * FROM course_login_codes WHERE code_hash=$1 AND kind='setup'
        AND expires_at>now() FOR UPDATE`, [digest(ticket)])).rows[0];
      if (!grant) fail(400, 'Sesi penyambungan telah tamat. Sila log masuk semula.');
      if ((await tx.query('SELECT 1 FROM course_links WHERE subject=$1', [grant.subject])).rows.length) fail(409, 'Akaun platform ini sudah disambungkan. Sila log masuk semula.');
      let userId: string;
      if (mode === 'link') {
        if (typeof identifier !== 'string' || identifier.length > 254 || typeof password !== 'string' || password.length > 256) fail(400, 'Masukkan e-mel dan kata laluan Bual lama.');
        const old = (await tx.query('SELECT * FROM accounts WHERE email=$1 OR username=$1 FOR UPDATE', [identifier.trim().toLowerCase()])).rows[0];
        if (!old?.salt || !old.password_hash || !await verifyPassword(password, old.salt, old.password_hash)) fail(400, 'E-mel atau kata laluan Bual lama tidak sah.');
        if ((await tx.query('SELECT 1 FROM course_links WHERE user_id=$1', [old.id])).rows.length) fail(409, 'Akaun Bual ini sudah disambungkan.');
        userId = old.id;
      } else {
        userId = randomUUID();
        // A separate internal identifier avoids matching or taking over an old
        // account with the same email. The portal email is display-only.
        await tx.query('INSERT INTO accounts(id,email,username,profile) VALUES($1,$2,$3,$4)', [userId,
          `${userId}@accounts.bual.invalid`, `calon_${randomBytes(8).toString('hex')}`,
          JSON.stringify({ studentName: 'Calon SPM', schoolName: '', state: 'Malaysia', avatar: '⭐' })]);
      }
      await tx.query('INSERT INTO course_links(subject,user_id) VALUES($1,$2)', [grant.subject, userId]);
      await tx.query('UPDATE accounts SET profile=profile || $1::jsonb WHERE id=$2', [JSON.stringify({ authProvider: 'interactive-course', portalEmail: grant.email }), userId]);
      await tx.query('DELETE FROM course_login_codes WHERE code_hash=$1', [digest(ticket)]);
      return issueSession(tx, userId, grant.session_expires_at);
    }).catch(error => { if (error.code === '23505') fail(409, 'Akaun sudah disambungkan. Sila log masuk semula.'); throw error; });
    res.json(result);
  }));
  return router;
}
