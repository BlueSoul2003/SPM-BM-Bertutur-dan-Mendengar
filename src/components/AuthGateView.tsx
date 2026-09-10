import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  BookOpenCheck
} from 'lucide-react';
import { AuthUser, UserProgress } from '../types';
import {
  loginAccount,
  registerAccount
} from '../services/authService';

interface AuthGateViewProps {
  currentUserProgress: UserProgress;
  onAuthSuccess: (user: AuthUser, progress?: UserProgress) => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  currentUserProgress,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email & Password columns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleModeSwitch = (newMode: 'register' | 'login') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Sila masukkan alamat e-mel yang sah.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Sila masukkan kata laluan sekurang-kurangnya 4 aksara.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const payload = {
          email: cleanEmail,
          password,
          studentName: 'Calon SPM',
          schoolName: 'Calon SPM',
          state: 'Kuala Lumpur',
          avatar: '👨‍🎓',
          initialPoints: currentUserProgress.points > 0 ? currentUserProgress.points : 0,
          initialStreak: currentUserProgress.streak > 0 ? currentUserProgress.streak : 1,
          totalSpeakingDone: currentUserProgress.totalSpeakingDone,
          totalListeningDone: currentUserProgress.totalListeningDone,
        };

        const result = await registerAccount(payload);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'Pendaftaran akaun gagal.');
          setLoading(false);
          return;
        }

        setSuccessMessage('Pendaftaran berjaya! Membuka aplikasi...');
        setTimeout(() => {
          onAuthSuccess(result.user!, result.progress);
        }, 500);
      } else {
        const result = await loginAccount(cleanEmail, password);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'Log masuk gagal. Sila semak e-mel dan kata laluan anda.');
          setLoading(false);
          return;
        }

        setSuccessMessage(`Selamat kembali, ${result.user.studentName}! Membuka aplikasi...`);
        setTimeout(() => {
          onAuthSuccess(result.user!, result.progress);
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ralat sambungan pelayan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-gate-portal" className="w-full max-w-md mx-auto py-8 sm:py-16 px-4 animate-in fade-in duration-200">
      {/* Centered App Logo / Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-white shadow-md border border-emerald-500/30 mb-3">
          <BookOpenCheck className="w-7 h-7 text-amber-300" />
        </div>
        <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
          SPM Bahasa Melayu
        </h1>
      </div>

      {/* Clean Auth Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Toggle Tabs: Daftar Akaun / Log Masuk */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5">
          <button
            id="gate-tab-register"
            type="button"
            onClick={() => handleModeSwitch('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Daftar Akaun</span>
          </button>

          <button
            id="gate-tab-login"
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>Log Masuk</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alamat E-mel</span>
              </label>
              <input
                id="gate-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contoh: calon@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kata Laluan</span>
              </label>
              <input
                id="gate-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                placeholder="Masukkan kata laluan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                id="gate-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sila tunggu...</span>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar Akaun</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log Masuk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toggle mode link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleModeSwitch(mode === 'register' ? 'login' : 'register')}
              className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              {mode === 'register'
                ? 'Sudah mempunyai akaun? Klik untuk Log Masuk'
                : 'Belum mempunyai akaun? Klik untuk Daftar Akaun'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
