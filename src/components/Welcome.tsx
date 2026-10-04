import { useTranslation } from '../i18n/LanguageProvider';
import type { ReactNode } from 'react';
import { Mic, Headphones, MessageCircle, ArrowUpRight, Sparkles } from 'lucide-react';

export function Welcome({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return <div className="welcome">
    <header className="welcome-nav">
      <a className="wordmark" href="#main-content" aria-label="Bual, SPM Bahasa Melayu">bual<span>.</span><small>SPM Bahasa Melayu</small></a>
      <a className="nav-note" href="#cara-belajar">{t("Kenali ruang belajar")} <ArrowUpRight size={16}/></a>
    </header>
    <section className="welcome-hero" id="main-content">
      <div className="welcome-story">
        <span className="eyebrow"><span/> {t("Sedikit latihan, banyak keyakinan")}</span>
        <h1>{t("BM lebih mesra.")}<br/>{t("Bertutur lebih")} <em>{t("yakin.")}</em></h1>
        <p>{t("Ruang kecil untuk impian besar. Latih pertuturan, asah pendengaran dan bina keyakinan dengan latihan kendiri.")}</p>
        <div className="companion-scene">
          <img src="/bm-bear.svg" alt={t("Beruang kecil membaca buku, teman belajar anda")} width="320" height="260"/>
          <div className="companion-note"><Sparkles size={18}/><span>{t("Tak perlu sempurna.")}<br/><strong>{t("Kita cuba sama-sama!")}</strong></span></div>
        </div>
      </div>
      <div className="welcome-account"><span className="card-kicker">{t("LANGKAH PERTAMA ANDA")}</span><h2>{t("Jom mula belajar.")}</h2><p>{t("Satu akaun, ruang untuk terus berkembang.")}</p>{children}<details className="text-xs text-stone-600 mt-4 leading-relaxed"><summary className="cursor-pointer underline">{t("Data yang disimpan")}</summary><p>{t("E-mel, kata laluan dalam bentuk hash, profil dan kemajuan latihan disimpan untuk akaun anda. Nama paparan dan mata boleh muncul pada papan kedudukan. Jangan masukkan maklumat sensitif dalam jawapan latihan. Versi ini masih dalam percubaan.")}</p></details><p className="account-footnote">{t("Latihan kendiri untuk persediaan SPM 1103/3 & 1103/4.")}</p></div>
    </section>
    <section className="learning-paths" id="cara-belajar" aria-label={t("Cara belajar")}>
      {[
        { Icon: Mic, title: t("Berani bertutur"), text: t("Latihan individu dan kumpulan, ikut rentak anda."), color: 'pink', tag: t("01 / BERTUTUR") },
        { Icon: Headphones, title: t("Dengar & faham"), text: t("Dengar petikan, tangkap idea dan uji kefahaman."), color: 'mint', tag: t("02 / MENDENGAR") },
        { Icon: MessageCircle, title: t("Ada teman belajar"), text: t("Cikgu AI sedang disediakan. Terokai kosa kata dan latihan kendiri dahulu."), color: 'yellow', tag: t("03 / CIKGU AI") },
      ].map(({ Icon, title, text, color, tag }) => <article className={`path-card ${color}`} key={tag}><div className="path-top"><Icon size={23}/><span>{t(tag)}</span></div><h2>{t(title)}</h2><p>{t(text)}</p></article>)}
    </section>
    <footer className="welcome-footer"><span>{t("Belajar sedikit. Yakin setiap hari.")}</span><span>{t("Dibina untuk perjalanan BM anda ♡")}</span></footer>
  </div>;
}
