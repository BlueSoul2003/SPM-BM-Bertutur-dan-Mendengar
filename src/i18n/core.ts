import { messages } from './messages';

export const languages = ['ms', 'en', 'zh', 'ta'] as const;
export type UiLanguage = typeof languages[number];
export const languageNames: Record<UiLanguage, string> = { ms: 'Bahasa Melayu', en: 'English', zh: '中文', ta: 'தமிழ்' };
export const languageTags: Record<UiLanguage, string> = { ms: 'ms-MY', en: 'en-MY', zh: 'zh-Hans', ta: 'ta-MY' };
export const languageStorageKey = 'bual.ui-language.v1';
export function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === 'string' && languages.includes(value as UiLanguage);
}
export function translate(language: UiLanguage, source: string, values: Record<string, string | number> = {}): string {
  const translated = language === 'ms' ? source : messages[source]?.[language] ?? source;
  return translated.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}
