import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

test('API account boundaries, unavailable AI and revocation against isolated data', async () => {
  const base = path.resolve('.codex-tmp/tests');
  await mkdir(base, { recursive: true });
  const dataDir = await mkdtemp(path.join(base, 'api-'));
  await writeFile(path.join(dataDir, 'users.json'), JSON.stringify([{ id: 'legacy', username: 'legacy', email: 'legacy@example.test', studentName: 'Legacy', authProvider: 'google' }]));
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    env: { ...process.env, DATABASE_URL: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', TTS_PROVIDER: '', PORT: '4321', HOST: '127.0.0.1', NODE_ENV: 'production', DATA_DIR: dataDir, GEMINI_API_KEY: '', ALLOW_LOCAL_DATABASE: 'true', IMPORT_LEGACY_JSON:'true' },
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 45_000);
      child.stdout.on('data', data => { if (String(data).includes('running on port')) { clearTimeout(timeout); resolve(); } });
      child.once('error', reject);
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}`)); });
    });
    const request = (route: string, body?: object, token?: string) => fetch(`http://127.0.0.1:4321${route}`, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal((await request('/api/auth/me?userId=legacy')).status, 401);
    for (const route of ['/api/admin/clear-all', '/api/leaderboard/reset', '/api/auth/google']) assert.equal((await request(route, {})).status, 403);
    assert.equal((await request('/api/auth/login', { email: 'legacy@example.test', password: 'anything' })).status, 401);
    assert.equal((await request('/api/auth/register', { email: 'legacy@example.test', password: 'anything' })).status, 400);
    assert.equal((await request('/api/auth/register', { email: 'bad@example.test', password: 'tiny' })).status, 400);
    const registered = await request('/api/auth/register', { email: 'alice@example.test', password: 'long-password', studentName: 'Alice' });
    assert.equal(registered.status, 200);
    const { token, user } = await registered.json();
    assert.equal(user.passwordHash, undefined);
    assert.equal((await request('/api/auth/me', undefined, token)).status, 200);
    assert.equal((await request('/api/auth/update-profile', { userId: user.id, studentName: 'Changed' })).status, 401);
    assert.equal((await request('/api/auth/update-profile', { userId: 'legacy', studentName: 'Changed' }, token)).status, 403);
    assert.equal((await request('/api/auth/update-profile', { userId: user.id, studentName: 'Alice B' }, token)).status, 200);
    assert.equal((await request('/api/gemini/evaluate-speaking', { studentResponse: 'Saya suka membaca.', stimulusTopic: 'Membaca' })).status, 401);
    const unavailable = await request('/api/gemini/evaluate-speaking', { studentResponse: 'Saya suka membaca.', stimulusTopic: 'Membaca' }, token);
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.json()).totalScore, undefined);
    assert.equal((await request('/api/auth/logout', {}, token)).status, 200);
    assert.equal((await request('/api/auth/me', undefined, token)).status, 401);
    const login = await request('/api/auth/login', { email: 'alice@example.test', password: 'long-password' });
    assert.equal(login.status, 200);
    const fresh = await login.json();
    assert.notEqual(fresh.token, token);
    assert.equal((await request('/api/auth/update-profile', { studentName: [] }, fresh.token)).status, 400);
  } finally { child.kill(); }
});
