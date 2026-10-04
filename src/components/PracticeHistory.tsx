import { useTranslation } from '../i18n/LanguageProvider';
import { useState } from 'react';
import { apiFetch } from '../services/api';
interface Attempt { id: string; kind: string; topic: string; totalScore: number; maxScore: number; awarded: number; createdAt: string }
export function PracticeHistory() {
  const { t, language } = useTranslation();
  const [attempts, setAttempts] = useState<Attempt[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function refresh() { setBusy(true); setError(''); try { const response = await apiFetch('/api/attempts', {}, 10000); if (!response.ok) throw new Error(); setAttempts((await response.json()).attempts); } catch { setError('Sejarah tidak dapat dimuatkan. Cuba lagi.'); } finally { setBusy(false); } }
  return <details className="bg-white border border-stone-200 rounded-2xl p-4 mb-5" onToggle={event => { if (event.currentTarget.open) void refresh(); }}>
    <summary className="font-bold cursor-pointer">{t("Sejarah latihan saya")}</summary><p className="text-xs text-stone-500 my-3">{t("20 penilaian tersimpan yang terkini. Semakan kendiri tanpa markah tidak termasuk.")}</p>
    {busy ? <p role="status">{t("Memuatkan…")}</p> : error ? <p role="alert">{t(error)} <button className="underline" onClick={refresh}>{t("Cuba lagi")}</button></p> : attempts.length ? <ul className="space-y-3">{attempts.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 text-sm border-t pt-3"><span>{item.kind === 'listening' ? t("Mendengar") : t("Bertutur")} · Set {item.topic.split('-').pop()}<small className="block text-stone-500">{new Date(item.createdAt).toLocaleString(language === 'zh' ? 'zh-MY' : language === 'ta' ? 'ta-MY' : language === 'en' ? 'en-MY' : 'ms-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</small></span><span>{item.totalScore}/{item.maxScore} · +{item.awarded} XP</span></li>)}</ul> : <p>{t("Belum ada penilaian tersimpan. Mulakan latihan mendengar pertama anda.")}</p>}
  </details>;
}
