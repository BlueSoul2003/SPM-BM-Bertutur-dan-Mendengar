import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isUiLanguage, languageStorageKey, languageTags, translate, type UiLanguage } from './core';

type Translate = (source: string, values?: Record<string, string | number>) => string;
const LanguageContext = createContext<{ language: UiLanguage; setLanguage: (language: UiLanguage) => void; t: Translate } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<UiLanguage>(() => {
    try { const saved = localStorage.getItem(languageStorageKey); if (isUiLanguage(saved)) return saved; } catch { /* Storage is optional. */ }
    return 'ms';
  });
  const setLanguage = useCallback((next: UiLanguage) => {
    if (!isUiLanguage(next)) return;
    updateLanguage(next);
    try { localStorage.setItem(languageStorageKey, next); } catch { /* Keep the in-memory choice. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = languageTags[language]; }, [language]);
  const t = useCallback<Translate>((source, values) => translate(language, source, values), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('LanguageProvider is required');
  return value;
}
