import { GoogleAuth } from 'google-auth-library';

const cache = new Map<string, Buffer>();
const pending = new Map<string, Promise<Buffer>>();
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
let bytes = 0;

export function getMalayAudioBuffer(text: string): Promise<Buffer> {
  if (process.env.TTS_PROVIDER !== 'google-cloud') return Promise.reject(new Error('TTS provider is not configured'));
  const cleaned = text.replace(/[*#_~`]/g, '').replace(/\[JEDA\]/gi, ', ').replace(/\s+/g, ' ').trim();
  const voice = process.env.GOOGLE_TTS_VOICE || '';
  const key = voice + ':' + cleaned;
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  if (pending.has(key)) return pending.get(key)!;
  const work = synthesize(cleaned, voice).then(buffer => {
    while (cache.size && (cache.size >= 100 || bytes + buffer.length > 16 * 1024 * 1024)) {
      const oldest = cache.keys().next().value!;
      bytes -= cache.get(oldest)!.length; cache.delete(oldest);
    }
    if (buffer.length <= 16 * 1024 * 1024) { cache.set(key, buffer); bytes += buffer.length; }
    return buffer;
  }).finally(() => pending.delete(key));
  pending.set(key, work);
  return work;
}

async function synthesize(text: string, voice: string): Promise<Buffer> {
  // Google limits each input to 5,000 UTF-8 bytes. Keep chunk order with four workers.
  const chunks: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    if (Buffer.byteLength(word) > 4500) throw new Error('TTS word exceeds provider limit');
    if (Buffer.byteLength(current + ' ' + word) > 4500) { chunks.push(current); current = word; }
    else current = (current + ' ' + word).trim();
  }
  if (current) chunks.push(current);
  const parts: Buffer[] = [];
  // One wall-clock deadline includes credential discovery and every chunk.
  const signal = AbortSignal.timeout(20_000);
  const credentials = await Promise.race([
    auth.getRequestHeaders(),
    new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(new Error('TTS timeout')), { once: true })),
  ]);
  for (let index = 0; index < chunks.length; index += 4) {
    parts.push(...await Promise.all(chunks.slice(index, index + 4).map(async chunk => {
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST', signal,
        headers: { ...Object.fromEntries(credentials.entries()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text: chunk }, voice: { languageCode: 'ms-MY', ...(voice ? { name: voice } : {}) }, audioConfig: { audioEncoding: 'MP3' } }),
      });
      if (!response.ok) throw new Error('Cloud TTS unavailable');
      const data = await response.json();
      if (typeof data.audioContent !== 'string' || data.audioContent.length > 8 * 1024 * 1024) throw new Error('Invalid TTS response');
      return Buffer.from(data.audioContent, 'base64');
    })));
  }
  return Buffer.concat(parts);
}
