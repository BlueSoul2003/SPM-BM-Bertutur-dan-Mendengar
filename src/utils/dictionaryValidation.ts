import type { DictionaryData } from '../types';

// Bound raw input before normalization, including punctuation-only aliases.
export function validDictionaryInput(word: unknown, context?: unknown): word is string {
  return typeof word === 'string' && word.length > 0 && word.length <= 120 &&
    (context === undefined || (typeof context === 'string' && context.length <= 5000));
}

export function isDictionaryData(value: unknown): value is DictionaryData {
  if (!value || typeof value !== 'object') return false;
  const data = value as DictionaryData;
  const text = (v: unknown, max = 6000) => typeof v === 'string' && v.length <= max;
  const optionalText = (v: unknown) => v === undefined || text(v);
  const words = (v: unknown) => Array.isArray(v) && v.length <= 30 && v.every(item => text(item, 256));
  return text(data.word, 120) && Boolean(data.word) &&
    Boolean(data.definitions) && ['ms', 'en', 'zh', 'ta'].every(key => text(data.definitions[key])) &&
    Boolean(data.definitions.ms) && optionalText(data.rootWord) && optionalText(data.partOfSpeech) &&
    words(data.synonyms) && words(data.antonyms) && text(data.spmSampleSentence) && optionalText(data.spmTips);
}

/** Preserve useful partial provider answers; validate every field before UI use. */
export function normalizeDictionaryData(value: unknown, word: string, context?: string): DictionaryData | null {
  if (!value || typeof value !== 'object') return null;
  const parsed = value as Partial<DictionaryData>;
  if (typeof parsed.definitions?.ms !== 'string' || !parsed.definitions.ms.trim()) return null;
  const normalized = {
    word, rootWord: parsed.rootWord || word,
    partOfSpeech: parsed.partOfSpeech || 'Kosa Kata SPM',
    definitions: {
      ms: parsed.definitions.ms,
      en: parsed.definitions.en || parsed.definitions.ms,
      zh: parsed.definitions.zh || parsed.definitions.en || parsed.definitions.ms,
      ta: parsed.definitions.ta || parsed.definitions.en || parsed.definitions.ms,
    },
    synonyms: parsed.synonyms ?? [], antonyms: parsed.antonyms ?? [],
    spmSampleSentence: parsed.spmSampleSentence || (context ? `Contoh dalam wacana: "${context}"` : `Amalan '${word}' wajar dibudayakan dalam masyarakat.`),
    spmTips: parsed.spmTips || 'Gunakan kosa kata ini secara tepat mengikut laras bahasa formal SPM.'
  };
  return isDictionaryData(normalized) ? normalized : null;
}
