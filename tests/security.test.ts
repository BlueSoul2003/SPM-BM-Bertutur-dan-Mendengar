import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Sessions, hashPassword, verifyPassword } from '../server/security.js';

test('password hashing is salted, rejects wrong passwords and supports legacy verification', async () => {
  const hash = await hashPassword('correct-password', 'test-salt');
  assert.ok(hash.startsWith('scrypt:'));
  assert.equal(await verifyPassword('correct-password', 'test-salt', hash), true);
  assert.equal(await verifyPassword('wrong-password', 'test-salt', hash), false);
  assert.notEqual(hash, await hashPassword('correct-password', 'another-salt'));
  const legacy = createHash('sha256').update('test-salt:correct-password').digest('hex');
  assert.equal(await verifyPassword('correct-password', 'test-salt', legacy), true);
});

test('sessions expire, revoke and rotate without exposing user IDs', () => {
  const sessions = new Sessions();
  const first = sessions.create('alice');
  assert.equal(sessions.get(first), 'alice');
  const second = sessions.create('alice');
  assert.equal(sessions.get(first), undefined);
  assert.equal(sessions.get(second), 'alice');
  assert.equal(second.includes('alice'), false);
  sessions.delete(second);
  assert.equal(sessions.get(second), undefined);
  const expired = new Sessions(-1);
  assert.equal(expired.get(expired.create('alice')), undefined);
});
