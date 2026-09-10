import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AuthUser, UserProgress } from '../types';
import {
  loginAccount,
  registerAccount
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProgress: UserProgress;
  onAuthSuccess: (user: AuthUser, progress?: UserProgress) => void;
  initialMode?: 'login' | 'register';
  allowClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserProgress,
  onAuthSuccess,
  initialMode = 'register',
  allowClose = true
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email & Password columns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: 'login' | 'register') => {
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
          studentName: currentUserProgress.studentName && currentUserProgress.studentName !== 'Saya (Calon SPM)' 
            ? currentUserProgress.studentName 
            : 'Calon SPM',
          schoolName: currentUserProgress.schoolName || 'Calon SPM',
          state: currentUserProgress.state || 'Kuala Lumpur',
          avatar: currentUserProgress.avatar || '👨‍🎓',
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

        setSuccessMessage('Pendaftaran akaun berjaya! Membuka portal...');
        setTimeout(() => {
          onAuthSuccess(result.user!, result.progress);
          onClose();
        }, 500);
      } else {
        const result = await loginAccount(cleanEmail, password);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || 'Log masuk gagal. Sila semak e-mel dan kata laluan anda.');
          setLoading(false);
          return;
        }

        setSuccessMessage(`Selamat kembali, ${result.user.studentName}!`);
        setTimeout(() => {
          onAuthSuccess(result.user!, result.progress);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ralat sambungan pelayan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 sm:p-6 relative">
          {allowClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] uppercase">
              Akaun Calon SPM
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif text-white mt-1.5">
            {mode === 'register' ? 'Daftar Akaun Calon' : 'Log Masuk Calon'}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            {mode === 'register'
              ? 'Masukkan e-mel dan kata laluan untuk mengunci markah anda.'
              : 'Sila masukkan e-mel dan kata laluan berdaftar anda.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
          <button
            id="modal-tab-register"
            type="button"
            onClick={() => handleModeSwitch('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daftar Akaun</span>
          </button>

          <button
            id="modal-tab-login"
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Log Masuk</span>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4">
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

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alamat E-mel</span>
              </label>
              <input
                id="modal-email-input"
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
                id="modal-password-input"
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
                id="modal-submit-btn"
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
                    <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
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

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleModeSwitch(mode === 'register' ? 'login' : 'register')}
              className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              {mode === 'register'
                ? 'Sudah mendaftar sebelum ini? Klik Log Masuk'
                : 'Calon baru? Klik untuk Daftar Akaun'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
