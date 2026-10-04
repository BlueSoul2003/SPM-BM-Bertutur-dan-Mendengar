import { useTranslation } from '../i18n/LanguageProvider';
import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { Welcome } from './Welcome';
import { acceptCourseSession, consumeCourseCallback, courseRequest, startCourseLogin, type CourseConfig } from '../services/courseAuth';
import { clearAuthSession, fetchCurrentSession, getStoredAuthToken } from '../services/authService';

const button = 'w-full rounded-2xl bg-[#b84c70] text-white px-5 py-3 font-semibold disabled:opacity-50';
export function CourseEntry({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<CourseConfig>();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [setup, setSetup] = useState<{ ticket: string; email: string }>();
  const [linking, setLinking] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const settings: CourseConfig = await courseRequest('config');
        if (!active) return;
        setConfig(settings);
        if (!settings.enabled) { setReady(true); return; }
        const result = await consumeCourseCallback();
        if (!active) return;
        if (result?.setupRequired) { setSetup(result); return; }
        if (result?.token) { acceptCourseSession(result); setReady(true); return; }
        if (new URLSearchParams(window.location.search).get('course') === '1') {
          window.history.replaceState({}, '', window.location.pathname);
          await startCourseLogin(settings); return;
        }
        if (getStoredAuthToken()?.startsWith('ic.')) {
          const session = await fetchCurrentSession();
          if (active && session.user) setReady(true);
        } else clearAuthSession();
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Sambungan gagal. Cuba lagi.'); }
      finally { if (active) setLoading(false); }
    }
    void initialize();
    const expired = () => { setReady(false); setSetup(undefined); setPassword(''); };
    window.addEventListener('session-expired', expired);
    return () => { active = false; window.removeEventListener('session-expired', expired); };
  }, []);
  async function login() {
    setBusy(true); setError('');
    try { if (config) await startCourseLogin(config); else window.location.reload(); }
    catch { setError('Benarkan storan pelayar untuk log masuk, kemudian cuba lagi.'); setBusy(false); }
  }
  async function complete(mode: 'new' | 'link', event?: FormEvent) {
    event?.preventDefault();
    if (!setup) return;
    setBusy(true); setError('');
    try {
      const result = await courseRequest('complete', { ticket: setup.ticket, mode, ...(mode === 'link' ? { identifier, password } : {}) });
      acceptCourseSession(result); setPassword(''); setSetup(undefined); setReady(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Sambungan gagal.'); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="loading-card" role="status">{t("Menyediakan akaun anda…")}</div>;
  if (ready) return <>{config?.enabled && <div className="bg-[#fff8f2] px-4 py-2 text-sm flex flex-wrap justify-between gap-2 border-b border-stone-200"><a className="underline" href={config.returnUrl}>{t("← Kembali ke interactive-course")}</a><span>{t("Latihan, rekod & XP anda kekal di Bual.")}</span></div>}{children}</>;
  return <div className="bm-app min-h-screen"><Welcome>
    <div className="space-y-4 mt-5">
      {error && <p role="alert" className="rounded-xl bg-rose-50 text-rose-800 p-3 text-sm">{t(error)}</p>}
      {setup ? <>
        <p className="text-sm text-stone-700">{t("Anda masuk sebagai")} <strong className="break-all">{setup.email}</strong>.</p>
        <p className="text-sm">{t("Pernah menggunakan Bual? Sambungkan akaun lama dahulu supaya rekod dan XP anda diteruskan. Satu akaun platform hanya boleh disambungkan kepada satu akaun Bual.")}</p>
        {linking ? <form onSubmit={event => void complete('link', event)} className="space-y-3">
          <label className="block text-sm">{t("E-mel atau nama pengguna Bual lama")}<input required autoComplete="username" maxLength={254} className="mt-1 w-full border border-stone-300 rounded-xl p-3" value={identifier} onChange={e => setIdentifier(e.target.value)}/></label>
          <label className="block text-sm">{t("Kata laluan Bual lama")}<input required type="password" autoComplete="current-password" maxLength={256} className="mt-1 w-full border border-stone-300 rounded-xl p-3" value={password} onChange={e => setPassword(e.target.value)}/></label>
          <p className="text-xs text-stone-600">{t("Kata laluan ini hanya mengesahkan pemilikan akaun lama. Jika terlupa, jangan mulakan rekod baharu untuk menggantikannya; hubungi pengendali Bual.")}</p>
          <button className={button} disabled={busy}>{busy ? t("Menyambungkan…") : t("Sambungkan & teruskan rekod saya")}</button>
          <button type="button" disabled={busy} className="underline text-sm" onClick={() => { setLinking(false); setPassword(''); }}>{t("Kembali ke pilihan")}</button>
        </form> : <>
          <button className={button} disabled={busy} onClick={() => setLinking(true)}>{t("Saya ada akaun Bual lama")}</button>
          <button className="w-full rounded-2xl border border-stone-300 p-3 font-semibold disabled:opacity-50" disabled={busy} onClick={() => void complete('new')}>{busy ? t("Menyediakan…") : t("Saya pengguna baharu — mula latihan")}</button>
          <p className="text-xs text-stone-600">{t("Pilihan pengguna baharu bermula dengan 0 XP. Rekod lama tidak dipadam atau digabungkan secara automatik.")}</p>
        </>}
        <button disabled={busy} className="text-sm underline" onClick={() => void login()}>{t("Mulakan log masuk semula")}</button>
        <p className="text-xs text-stone-600">{t("Untuk menukar akaun, kembali ke platform dan log keluar dahulu.")}</p>
      </> : <>
        <p className="text-stone-700 text-sm">{t("Gunakan akaun interactive-course anda. Latihan ini percuma untuk semua pelajar yang telah log masuk.")}</p>
        <button className={button} disabled={busy} onClick={() => void login()}>{busy ? t("Membuka platform…") : config ? t("Teruskan dengan interactive-course") : t("Cuba sambung semula")}</button>
        <p className="text-xs text-stone-600">{t("Akaun Bual lama boleh disambungkan selepas log masuk. Tidak perlu mendaftar akaun Bual baharu.")}</p>
      </>}
      {config && <a className="block text-sm underline text-stone-600" href={config.returnUrl}>{t("← Kembali ke senarai kursus")}</a>}
    </div>
  </Welcome></div>;
}
