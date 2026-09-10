import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  Sparkles,
  HelpCircle,
  Edit2,
  Check,
  Zap,
  RotateCcw,
  RefreshCw,
  Users,
  ShieldCheck,
  Info,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { UserProgress, LeaderboardEntry } from '../types';
import {
  computeRankedLeaderboard,
  saveUserProgress,
  syncUserToServer,
  fetchServerLeaderboard,
  resetUserProgressToDay1,
  resetServerLeaderboard
} from '../utils/gamification';
import { updateProfile } from '../services/authService';

const MALAYSIAN_STATES = [
  'Kuala Lumpur',
  'Selangor',
  'Johor',
  'Melaka',
  'Negeri Sembilan',
  'Perak',
  'Pulau Pinang',
  'Kedah',
  'Perlis',
  'Pahang',
  'Terengganu',
  'Kelantan',
  'Sabah',
  'Sarawak',
  'Wilayah Persekutuan Labuan',
  'Wilayah Persekutuan Putrajaya'
];

interface WeeklyLeaderboardProps {
  userProgress: UserProgress;
  onUpdateUserProgress: (updated: UserProgress) => void;
  onNavigateToSpeaking: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const WeeklyLeaderboard: React.FC<WeeklyLeaderboardProps> = ({
  userProgress,
  onUpdateUserProgress,
  onNavigateToSpeaking,
  onOpenAuthModal,
  onLogout,
}) => {
  const [filter, setFilter] = useState<'weekly' | 'alltime'>('weekly');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(userProgress.studentName || 'Saya (Calon SPM)');
  const [schoolInput, setSchoolInput] = useState(userProgress.schoolName || '');
  const [stateInput, setStateInput] = useState(userProgress.state || 'Kuala Lumpur');
  const [showHowPointsWork, setShowHowPointsWork] = useState(false);
  const [serverEntries, setServerEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load real server users
  const loadLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sync current user first
      await syncUserToServer(userProgress);
      const entries = await fetchServerLeaderboard();
      setServerEntries(entries);
    } catch (e) {
      console.warn('Error loading real leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userProgress]);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const { entries, currentUserRank, timeRemainingText, totalRealUsers } =
    computeRankedLeaderboard(userProgress, serverEntries);

  // The leaderboard exclusively displays registered candidates
  const displayedEntries = entries.filter((e) => e.isRegistered);
  const registeredUsersCount = displayedEntries.length;

  const handleSaveProfile = async () => {
    const updated: UserProgress = {
      ...userProgress,
      studentName: nameInput.trim() || 'Saya (Calon SPM)',
      schoolName: schoolInput.trim() || 'Calon SPM',
      state: stateInput,
    };
    onUpdateUserProgress(updated);
    saveUserProgress(updated);
    await syncUserToServer(updated);

    if (userProgress.isRegistered) {
      await updateProfile({
        userId: userProgress.userId,
        studentName: updated.studentName,
        schoolName: updated.schoolName,
        state: updated.state,
      });
    }

    setIsEditingProfile(false);
    loadLeaderboardData();
    showToast('Profil papan pendahulu anda telah berjaya disimpan!');
  };

  const handleResetToDay1 = async () => {
    const confirmReset = window.confirm(
      'Adakah anda pasti mahu memadam semua memori dan memulakan semula dari Hari 1 (0 XP, 0 rentak)? Rekod sistem tiruan telah dialih keluar sepenuhnya.'
    );
    if (!confirmReset) return;

    const askServerReset = window.confirm(
      'Adakah anda juga mahu mengosongkan rekod papan pendahulu pelayan supaya bermula bersih untuk semua calon baru?'
    );

    if (askServerReset) {
      await resetServerLeaderboard();
    }

    const clean = resetUserProgressToDay1();
    onUpdateUserProgress(clean);
    setNameInput(clean.studentName);
    setSchoolInput(clean.schoolName);
    setStateInput(clean.state || 'Kuala Lumpur');
    await loadLeaderboardData();
    showToast('Aplikasi kini bermula bersih dari Hari 1 (0 XP)!');
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const getLeagueBadge = (league: LeaderboardEntry['league']) => {
    switch (league) {
      case 'diamond':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            💎 Liga Berlian
          </span>
        );
      case 'gold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            🥇 Liga Emas
          </span>
        );
      case 'silver':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
            🥈 Liga Perak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            🥉 Liga Gangsa
          </span>
        );
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center shadow-md shadow-amber-300/40 text-sm">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black flex items-center justify-center shadow-md text-sm">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-600 text-amber-50 font-black flex items-center justify-center shadow-md text-sm">
          🥉
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3 bg-emerald-900/90 text-emerald-100 border border-emerald-500/50 rounded-2xl text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-300 hover:text-white text-xs underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Banner: Weekly Battle Status */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 shadow-xl border border-indigo-700/40 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold tracking-wide flex items-center gap-1.5 border border-amber-400/30">
                <Trophy className="w-3.5 h-3.5" />
                PAPAN PENDAHULU SEBENAR (HARI 1)
              </span>
              <span className="text-xs text-indigo-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-300" />
                Baki: {timeRemainingText}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Pengguna Sebenar Sahaja
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Papan Pendahulu Murid SPM
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-lg leading-relaxed">
              Tiada data tiruan atau akaun bot sistem. Bersaing secara sihat bersama calon SPM sebenar yang memulakan persediaan dari Hari 1!
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="refresh-leaderboard-btn"
              onClick={loadLeaderboardData}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Kemas kini senarai pengguna sebenar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Memuatkan...' : 'Segar Semula'}</span>
            </button>
            <button
              id="how-points-work-btn"
              onClick={() => setShowHowPointsWork(!showHowPointsWork)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Cara Kumpul Mata</span>
            </button>
            <button
              id="cta-battle-speaking"
              onClick={onNavigateToSpeaking}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Latih Sekarang (+50 XP)</span>
            </button>
          </div>
        </div>

        {/* Current User Standing Card */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-bold shadow-md shadow-amber-500/30 text-white">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base">
                  {userProgress.studentName || 'Saya (Calon SPM)'}
                </span>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs text-indigo-300 hover:text-white underline flex items-center gap-0.5 cursor-pointer"
                  title="Tukar Nama & Sekolah"
                >
                  <Edit2 className="w-3 h-3" />
                  Ubah
                </button>
              </div>
              <div className="text-xs text-indigo-200">
                {userProgress.schoolName ? `${userProgress.schoolName} • ` : ''}
                {userProgress.state || 'Malaysia'} • Aras:{' '}
                <span className="text-amber-300 font-semibold">
                  {userProgress.levelName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-300">
                Kedudukan
              </div>
              <div className="text-lg font-black text-amber-400">
                #{currentUserRank}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-300">
                Jumlah Mata
              </div>
              <div className="text-lg font-black text-white">
                {userProgress.points}{' '}
                <span className="text-xs text-amber-300 font-normal">XP</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-300">
                Rentak
              </div>
              <div className="text-lg font-black text-orange-400 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-orange-400" />
                {userProgress.streak}h
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-300">
                Gred SPM
              </div>
              <div className="text-sm font-black px-2 py-0.5 rounded-lg bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                {userProgress.lastSpmGrade?.grade || 'A'}
              </div>
            </div>
          </div>
        </div>

        {/* Guest Callout vs Verified Student Account Status */}
        {!userProgress.isRegistered ? (
          <div className="mt-4 p-4 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shrink-0 shadow-md">
                <ShieldAlert className="w-5 h-5 text-amber-950" />
              </div>
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                  <span>Kunci Kemajuan & Kedudukan Anda di Papan Pendahulu</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-wider">
                    Mod Tetamu
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 mt-0.5 max-w-xl leading-relaxed">
                  Markah terkumpul anda (<span className="font-bold text-white">{userProgress.points} XP</span>,{' '}
                  <span className="font-bold text-white">{userProgress.streak} hari rentak</span>) hanya disimpan dalam memori sementara peranti ini. Daftar akaun rasmi calon SPM secara percuma untuk mengunci markah anda secara kekal!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                id="leaderboard-register-cta-btn"
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar (+Kunci {userProgress.points} XP)</span>
              </button>
              <button
                id="leaderboard-login-cta-btn"
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log Masuk</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 sm:p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white">Akaun Calon SPM Berdaftar:</span>
                  <span className="font-bold text-emerald-300">{userProgress.studentName || 'Calon SPM'}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                    ✓ Disahkan
                  </span>
                </div>
                <div className="text-emerald-200/80 text-[11px] mt-0.5">
                  Kedudukan #{currentUserRank} dan rekod {userProgress.points} XP anda disimpan dengan selamat dalam pangkalan data pelayan.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
              >
                Tukar Akaun
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-200 text-xs text-white/80 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Log Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* Profile Edit Inline */}
        {isEditingProfile && (
          <div className="mt-3 p-3.5 bg-slate-800/95 rounded-2xl border border-indigo-500/30 text-xs space-y-3">
            <div className="font-semibold text-indigo-200 flex items-center justify-between">
              <span>Peribadikan Profil Papan Pendahulu Calon SPM:</span>
              <span className="text-[11px] text-slate-400">
                Maklumat ini akan dipaparkan kepada calon lain
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Nama Anda / Samaran:
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="Contoh: Amirul Haziq"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Nama Sekolah:
                </label>
                <input
                  type="text"
                  value={schoolInput}
                  onChange={(e) => setSchoolInput(e.target.value)}
                  maxLength={40}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="Contoh: SMK Victoria"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Negeri:
                </label>
                <select
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                >
                  {MALAYSIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResetToDay1}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 transition-colors"
                title="Padam semua kemajuan ujian dan mula dari Hari 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Memori (Mula Dari Hari 1)</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Simpan Profil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How Points Work Accordion */}
      {showHowPointsWork && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2 animate-in fade-in">
          <div className="font-bold text-sm flex items-center gap-1.5 text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Sistem Pemarkahan & Ganjaran XP SPM:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
            <div className="p-2 rounded-xl bg-white border border-amber-100">
              <span className="font-semibold text-amber-800">
                🎁 Daftar Masuk Harian:
              </span>{' '}
              +20 hingga +120 XP (Hari 7 dapat mahkota + hadiah khas).
            </div>
            <div className="p-2 rounded-xl bg-white border border-amber-100">
              <span className="font-semibold text-amber-800">
                🎙️ Ujian Bertutur SPM:
              </span>{' '}
              +50 XP (+25 Bonus jika dapat Gred A/A+).
            </div>
            <div className="p-2 rounded-xl bg-white border border-amber-100">
              <span className="font-semibold text-amber-800">
                🗣️ Latih Sebutan & Frasa Kunci:
              </span>{' '}
              +15 XP setiap frasa yang disebut tepat.
            </div>
            <div className="p-2 rounded-xl bg-white border border-amber-100">
              <span className="font-semibold text-amber-800">
                🎧 Ujian Mendengar SPM:
              </span>{' '}
              +15 XP bagi setiap jawapan betul.
            </div>
          </div>
        </div>
      )}

      {/* Registered Users Only Status & Privacy Assurance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white shadow-xs font-bold text-xs flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
            <span>Papan Pendahulu Calon Berdaftar Sahaja ({registeredUsersCount})</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1.5 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privasi Terjamin: Alamat e-mel tidak dipaparkan</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{registeredUsersCount} Calon Berdaftar Aktif</span>
        </div>
      </div>

      {/* Guest Warning Banner if viewer has not registered yet */}
      {!userProgress.isRegistered && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-amber-950">
                Papan Pendahulu Khusus Calon Berdaftar Sahaja
              </div>
              <p className="text-xs text-amber-800">
                Anda belum mendaftar akaun. Daftar akaun e-mel sekarang untuk menyertai dan mengunci ranking SPM anda di sini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuthModal('register')}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Daftar Akaun Sekarang
          </button>
        </div>
      )}

      {/* Empty State when no registered users exist yet */}
      {displayedEntries.length === 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Belum Ada Calon Berdaftar dalam Senarai
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Jadilah calon SPM pertama yang mendaftar akaun rasmi untuk mengunci markah anda di tangga teratas papan pendahulu!
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuthModal('register')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Daftar Akaun Calon Sekarang
          </button>
        </div>
      )}

      {/* Leaderboard Entries List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {(displayedEntries || []).map((entry) => {
          const isMe = entry.isCurrentUser;

          return (
            <div
              key={entry.id}
              id={`leaderboard-entry-${entry.rank}`}
              className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                isMe
                  ? 'bg-amber-50/80 border-l-4 border-l-amber-500'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              {/* Left: Rank & Avatar & Name */}
              <div className="flex items-center gap-3 min-w-0">
                {getRankMedal(entry.rank)}

                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl shrink-0 border border-slate-200 shadow-2xs">
                  {entry.avatar || '👨‍🎓'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-sm font-bold truncate ${
                        isMe ? 'text-amber-950 font-black' : 'text-slate-800'
                      }`}
                    >
                      {entry.name}
                    </span>

                    {/* Registered Status vs Guest */}
                    {entry.isRegistered ? (
                      <span
                        className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-0.5"
                        title="Calon Berdaftar Rasmi"
                      >
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Calon Sah</span>
                      </span>
                    ) : (
                      <span
                        className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium"
                        title="Pengguna Tetamu (Belum Kunci Akaun)"
                      >
                        Tetamu
                      </span>
                    )}

                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                        ANDA
                      </span>
                    )}

                    {getLeagueBadge(entry.league)}
                  </div>

                  <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <span>{entry.school || 'Calon SPM'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{entry.state || 'Malaysia'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Points, Streak & SPM Predicted Grade */}
              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-slate-900">
                    {entry.points}{' '}
                    <span className="text-xs font-bold text-amber-600">XP</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span>{entry.streak} hari</span>
                  </div>
                </div>

                <div className="text-center min-w-[52px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Gred SPM
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                      entry.predictedGrade === 'A+'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : entry.predictedGrade.startsWith('A')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-teal-100 text-teal-800 border border-teal-300'
                    }`}
                  >
                    {entry.predictedGrade}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
