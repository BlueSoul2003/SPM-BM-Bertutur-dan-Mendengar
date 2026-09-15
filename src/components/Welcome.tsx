import type { ReactNode } from 'react';
import { Mic, Headphones, MessageCircle, ArrowUpRight, Sparkles } from 'lucide-react';

export function Welcome({ children }: { children: ReactNode }) {
  return <div className="welcome">
    <header className="welcome-nav">
      <a className="wordmark" href="#main-content" aria-label="Bual, SPM Bahasa Melayu">bual<span>.</span><small>SPM Bahasa Melayu</small></a>
      <a className="nav-note" href="#cara-belajar">Kenali ruang belajar <ArrowUpRight size={16}/></a>
    </header>
    <section className="welcome-hero" id="main-content">
      <div className="welcome-story">
        <span className="eyebrow"><span/> Sedikit latihan, banyak keyakinan</span>
        <h1>BM lebih mesra.<br/>Bertutur lebih <em>yakin.</em></h1>
        <p>Ruang kecil untuk impian besar. Latih pertuturan, asah pendengaran dan belajar bersama cikgu AI.</p>
        <div className="companion-scene">
          <img src="/bm-bear.svg" alt="Beruang kecil membaca buku, teman belajar anda" width="320" height="260"/>
          <div className="companion-note"><Sparkles size={18}/><span>Tak perlu sempurna.<br/><strong>Kita cuba sama-sama!</strong></span></div>
        </div>
      </div>
      <div className="welcome-account"><span className="card-kicker">LANGKAH PERTAMA ANDA</span><h2>Jom mula belajar.</h2><p>Satu akaun, ruang untuk terus berkembang.</p>{children}<p className="account-footnote">Latihan kendiri untuk persediaan SPM 1103/3 &amp; 1103/4.</p></div>
    </section>
    <section className="learning-paths" id="cara-belajar" aria-label="Cara belajar">
      {[
        { Icon: Mic, title: 'Berani bertutur', text: 'Latihan individu dan kumpulan, ikut rentak anda.', color: 'pink', tag: '01 / BERTUTUR' },
        { Icon: Headphones, title: 'Dengar & faham', text: 'Dengar petikan, tangkap idea dan uji kefahaman.', color: 'mint', tag: '02 / MENDENGAR' },
        { Icon: MessageCircle, title: 'Ada teman belajar', text: 'Berbual, bina kosa kata dan terokai idea dengan AI.', color: 'yellow', tag: '03 / CIKGU AI' },
      ].map(({ Icon, title, text, color, tag }) => <article className={`path-card ${color}`} key={tag}><div className="path-top"><Icon size={23}/><span>{tag}</span></div><h2>{title}</h2><p>{text}</p></article>)}
    </section>
    <footer className="welcome-footer"><span>Belajar sedikit. Yakin setiap hari.</span><span>Dibina untuk perjalanan BM anda ♡</span></footer>
  </div>;
}
