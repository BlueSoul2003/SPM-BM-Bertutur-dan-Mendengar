import { test } from 'node:test';
import assert from 'node:assert/strict';

test('device speech completes, reports failures, and ignores cancelled callbacks without a cloud request', async () => {
  let utterance: any; let requests = 0;
  const priorWindow = (globalThis as any).window, priorUtterance = (globalThis as any).SpeechSynthesisUtterance;
  const priorFetch = globalThis.fetch;
  (globalThis as any).window = { speechSynthesis: { getVoices: () => [], addEventListener() {}, cancel() {}, speak(value: any) { utterance = value; } } };
  (globalThis as any).SpeechSynthesisUtterance = class { constructor(public text: string) {} };
  globalThis.fetch = (async () => { requests++; throw new Error('Unexpected network'); }) as typeof fetch;
  try {
    const { speakMalayText, stopSpeaking } = await import('../src/utils/speechUtils.js');
    let completed = 0, failed = '';
    speakMalayText('Selamat pagi', () => completed++);
    const cancelled = utterance; stopSpeaking(); cancelled.onend(); assert.equal(completed,0);
    speakMalayText('Terima kasih', () => completed++); utterance.onend(); utterance.onend(); assert.equal(completed,1);
    speakMalayText('Audio', () => completed++, 1, 1, message => { failed = message; }); utterance.onerror();
    assert.ok(failed); assert.equal(completed,1); assert.equal(requests,0);
  } finally { (globalThis as any).window = priorWindow; (globalThis as any).SpeechSynthesisUtterance = priorUtterance; globalThis.fetch = priorFetch; }
});
