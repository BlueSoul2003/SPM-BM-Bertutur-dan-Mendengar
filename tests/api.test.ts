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
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 120_000);
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
    const bob = await (await request('/api/auth/register', { email: 'bob@example.test', password: 'long-password', studentName: 'Bob' })).json();
    await request('/api/auth/update-profile', { schoolName: 'Private School', state: 'Private State' }, bob.token);
    const dictionary = async (word: unknown, contextSentence: unknown, authToken = token) => {
      const response = await request('/api/gemini/dictionary', { word, contextSentence }, authToken);
      return { status: response.status, data: await response.json() };
    };
    // Same process, same word, distinct accounts and contexts: no shared examples.
    for (const word of ['zzfixtureword', 'beralamkan']) {
      const first = await dictionary(word, 'Alice private example');
      const second = await dictionary(word, 'Bob private example', bob.token);
      assert.equal(first.status, 200);
      assert.equal(second.status, 200);
      assert.match(first.data.spmSampleSentence, /Alice private example/);
      assert.match(second.data.spmSampleSentence, /Bob private example/);
      assert.doesNotMatch(second.data.spmSampleSentence, /Alice/);
      assert.match((await dictionary(word, 'Updated context')).data.spmSampleSentence, /Updated context/);
    }
    for (const [word, context] of [[{}, 'text'], ['perkataan', {}], ['a'.repeat(121), 'text'], ['a' + '!'.repeat(121), ''], ['alam', 'x'.repeat(5001)], ['', '']]) {
      assert.equal((await dictionary(word, context)).status, 400);
    }
    assert.equal(typeof (await dictionary('constructor', 'Safe example')).data.definitions.ms, 'string');
    assert.equal((await dictionary('alam', undefined)).status, 200);
    for (const credential of [undefined, 'invalid']) assert.equal((await request('/api/leaderboard?limit=100', undefined, credential)).status, 401);
    const ranking = await request('/api/leaderboard', undefined, token);
    assert.equal(ranking.status, 200);
    const rankingData = await ranking.json();
    assert.ok(rankingData.entries.some((entry: any) => entry.id === user.id));
    assert.doesNotMatch(JSON.stringify(rankingData), /Private School|Private State|password_hash|portalEmail/);
    assert.equal(user.passwordHash, undefined);
    assert.equal((await request('/api/auth/me', undefined, token)).status, 200);
    assert.equal((await request('/api/auth/update-profile', { userId: user.id, studentName: 'Changed' })).status, 401);
    assert.equal((await request('/api/auth/update-profile', { userId: 'legacy', studentName: 'Changed' }, token)).status, 403);
    assert.equal((await request('/api/auth/update-profile', { userId: user.id, studentName: 'Alice B' }, token)).status, 200);
    assert.equal((await request('/api/gemini/evaluate-speaking', { studentResponse: 'Saya suka membaca.', stimulusTopic: 'Membaca' })).status, 401);
    const usageBefore=await (await request('/api/usage',undefined,token)).json();
    const unavailable = await request('/api/gemini/evaluate-speaking', { studentResponse: 'Saya suka membaca.', stimulusTopic: 'Membaca' }, token);
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.json()).totalScore, undefined);
    assert.deepEqual(await (await request('/api/usage',undefined,token)).json(),usageBefore);
    assert.equal((await request('/api/usage')).status,401);
    assert.equal((await request('/api/auth/logout', {}, token)).status, 200);
    assert.equal((await request('/api/auth/me', undefined, token)).status, 401);
    assert.equal((await request('/api/leaderboard', undefined, token)).status, 401);
    const login = await request('/api/auth/login', { email: 'alice@example.test', password: 'long-password' });
    assert.equal(login.status, 200);
    const fresh = await login.json();
    assert.notEqual(fresh.token, token);
    assert.equal((await request('/api/auth/update-profile', { studentName: [] }, fresh.token)).status, 400);
  } finally { child.kill(); }
});
