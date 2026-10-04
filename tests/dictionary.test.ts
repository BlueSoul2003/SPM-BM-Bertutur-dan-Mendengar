import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookupDictionaryWord } from '../src/services/geminiService.js';
import { isDictionaryData, validDictionaryInput, normalizeDictionaryData } from '../src/utils/dictionaryValidation.js';

test('browser dictionary isolates context and late responses and rejects unsafe payloads', async () => {
  let token = 'account-a', calls = 0;
  let release: ((response: Response) => void) | undefined;
  const original = { fetch: globalThis.fetch, window: globalThis.window, localStorage: globalThis.localStorage };
  const entry = (sentence: string) => ({ word: 'zzfixtureword', definitions: { ms: 'Maksud', en: 'Meaning', zh: '意思', ta: 'பொருள்' }, synonyms: [], antonyms: [], spmSampleSentence: sentence });
  Object.assign(globalThis, {
    window: { dispatchEvent() {} }, localStorage: { getItem: () => token },
    fetch: async (_url: unknown, init: RequestInit) => {
      calls++;
      const input = JSON.parse(init.body as string);
      if (input.contextSentence === 'late-a') return new Promise<Response>(resolve => { release = resolve; });
      if (input.contextSentence === 'malformed') return Response.json({ ...entry('bad'), spmSampleSentence: { secret: 'object' } });
      return Response.json(entry(input.contextSentence));
    }
  });
  try {
    assert.equal((await lookupDictionaryWord('zzfixtureword', 'a-private')).spmSampleSentence, 'a-private');
    token = 'account-b';
    assert.equal((await lookupDictionaryWord('zzfixtureword', 'b-private')).spmSampleSentence, 'b-private');
    token = 'account-a';
    const late = lookupDictionaryWord('zzfixtureword', 'late-a');
    while (!release) await new Promise(resolve => setTimeout(resolve, 1));
    token = 'account-b';
    await lookupDictionaryWord('zzfixtureword', 'b-before');
    release(Response.json(entry('late-a'))); await late;
    assert.equal((await lookupDictionaryWord('zzfixtureword', 'b-after')).spmSampleSentence, 'b-after');
    assert.ok(isDictionaryData(await lookupDictionaryWord('zzfixtureword', 'malformed')));
    const before = calls;
    assert.ok(isDictionaryData(await lookupDictionaryWord('alam')));
    assert.equal(calls, before, 'curated lookup stays local');
    for (const word of ['constructor', 'constructorlah']) assert.ok(isDictionaryData(await lookupDictionaryWord(word, 'ordinary context')));
    await assert.rejects(lookupDictionaryWord('a'.repeat(121)), /tidak sah/);
  } finally { Object.assign(globalThis, original); }
});

test('dictionary schema bounds inputs and every field used by the renderer', () => {
  const safe = { word: 'alam', definitions: { ms: 'alam', en: 'world', zh: '世界', ta: 'உலகம்' }, synonyms: [], antonyms: [], spmSampleSentence: 'Alam kita.' };
  assert.ok(isDictionaryData(safe));
  for (const key of ['rootWord', 'partOfSpeech', 'spmSampleSentence', 'spmTips']) assert.equal(isDictionaryData({ ...safe, [key]: {} }), false);
  for (const key of ['ms', 'en', 'zh', 'ta']) assert.equal(isDictionaryData({ ...safe, definitions: { ...safe.definitions, [key]: {} } }), false);
  assert.equal(isDictionaryData({ ...safe, synonyms: [{}] }), false);
  assert.equal(isDictionaryData({ ...safe, antonyms: Array(31).fill('x') }), false);
  assert.equal(isDictionaryData({ ...safe, spmSampleSentence: 'x'.repeat(6001) }), false);
  assert.ok(validDictionaryInput('alam', 'x'.repeat(5000)));
  assert.equal(validDictionaryInput('a' + '!'.repeat(120)), false);
  assert.equal(validDictionaryInput('alam', {}), false);
  const partial = { definitions: { ms: 'A distinctive valid definition' } };
  assert.ok(normalizeDictionaryData(partial, 'perkataan'), 'partial fresh response can be persisted');
  const replay = JSON.parse(JSON.stringify(partial));
  assert.equal(normalizeDictionaryData(replay, 'perkataan', 'New context')?.definitions.en, partial.definitions.ms);
  assert.equal(normalizeDictionaryData(replay, 'perkataan', 'New context')?.spmSampleSentence, 'Contoh dalam wacana: "New context"');
  assert.equal(normalizeDictionaryData({ ...partial, spmSampleSentence: {} }, 'perkataan'), null);
});
