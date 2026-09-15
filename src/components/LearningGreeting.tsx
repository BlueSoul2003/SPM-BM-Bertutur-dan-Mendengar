import { Sparkles } from 'lucide-react';
import type { ActiveTab } from '../types';

export function LearningGreeting({ activeTab }: { activeTab: ActiveTab }) {
  const titles: Record<ActiveTab, string> = { guide: 'Kenali langkah belajar anda.', speaking: 'Satu idea, satu langkah lebih yakin.', listening: 'Pasang telinga. Temui cerita baharu.', tutor: 'Banyak soalan? Jom berbual.', leaderboard: 'Raikan setiap langkah kecil.' };
  return <section className="learning-greeting"><div><span className="eyebrow"><Sparkles size={14}/> RUANG BELAJAR ANDA</span><h1>{titles[activeTab]}</h1><p>Tak perlu sempurna. Teruskan mencuba, ikut rentak anda.</p></div><img src="/bm-bear.svg" width="112" height="91" alt=""/></section>;
}
