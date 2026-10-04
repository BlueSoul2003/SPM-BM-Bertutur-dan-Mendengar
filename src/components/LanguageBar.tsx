import { useTranslation } from '../i18n/LanguageProvider';
import { languages, languageNames, languageTags, type UiLanguage } from '../i18n/core';

export function LanguageBar() {
  const { language, setLanguage, t } = useTranslation();
  return <aside className="language-bar">
    <label htmlFor="interface-language">{t('Bahasa paparan')}
      <select id="interface-language" value={language} onChange={event => setLanguage(event.target.value as UiLanguage)}>
        {languages.map(code => <option key={code} value={code} lang={languageTags[code]}>{languageNames[code]}</option>)}
      </select>
    </label>
    <p>{t('Soalan, audio dan jawapan latihan kekal dalam Bahasa Melayu.')}</p>
  </aside>;
}
