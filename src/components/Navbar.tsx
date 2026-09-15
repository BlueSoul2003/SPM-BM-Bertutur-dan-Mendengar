import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Headphones,
  Bot,
  Award,
  Bookmark,
  Languages,
  BookOpenCheck,
  Trophy,
  Flame,
  Gift,
  Sparkles,
  User,
  UserCheck,
  LogOut,
  ChevronDown,
  Lock,
  Mail
} from 'lucide-react';
import { ActiveTab, TargetLanguage, UserProgress } from '../types';
import { checkDailyCheckInStatus } from '../utils/gamification';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  wordBankCount: number;
  onOpenWordBank: () => void;
  preferredLang: TargetLanguage;
  onLanguageChange: (lang: TargetLanguage) => void;
  onOpenGuide: () => void;
  userProgress: UserProgress;
  onOpenDailyCheckIn: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  wordBankCount,
  onOpenWordBank,
  preferredLang,
  onLanguageChange,
  onOpenGuide,
  userProgress,
  onOpenDailyCheckIn,
  onOpenAuthModal,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageOptions: { key: TargetLanguage; label: string; flag: string }[] = [
    { key: 'en', label: 'English', flag: '🇬🇧' },
    { key: 'zh', label: '中文', flag: '🇨🇳' },
    { key: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { key: 'ms', label: 'BM', flag: '🇲🇾' },
  ];

  const { canClaimToday } = checkDailyCheckInStatus(userProgress);

  return (
    <header className="bm-navbar sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="app-nav-layout">
          <button type="button" className="wordmark app-wordmark" onClick={() => onTabChange('speaking')} aria-label="Bual, kembali ke latihan bertutur">bual<span>.</span><small>SPM Bahasa Melayu</small></button>

            {/* Center Desktop Navigation Tabs */}
          <nav className="app-desktop-tabs hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              id="nav-speaking-tab"
              type="button"
              onClick={() => {
                if (!userProgress.isRegistered) {
                  onOpenAuthModal('register');
                } else {
                  onTabChange('speaking');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'speaking'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bertutur (1103/3)</span>
              {!userProgress.isRegistered && <Lock className="w-3 h-3 text-amber-600 ml-0.5" />}
            </button>

            <button
              id="nav-listening-tab"
              type="button"
              onClick={() => {
                if (!userProgress.isRegistered) {
                  onOpenAuthModal('register');
                } else {
                  onTabChange('listening');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'listening'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-teal-600" />
              <span>Mendengar (1103/4)</span>
              {!userProgress.isRegistered && <Lock className="w-3 h-3 text-amber-600 ml-0.5" />}
            </button>

            <button
              id="nav-leaderboard-tab"
              type="button"
              onClick={() => {
                if (!userProgress.isRegistered) {
                  onOpenAuthModal('register');
                } else {
                  onTabChange('leaderboard');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-white text-amber-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Kedudukan Mingguan</span>
              {!userProgress.isRegistered && <Lock className="w-3 h-3 text-amber-600 ml-0.5" />}
            </button>

            <button
              id="nav-tutor-tab"
              type="button"
              onClick={() => {
                if (!userProgress.isRegistered) {
                  onOpenAuthModal('register');
                } else {
                  onTabChange('tutor');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tutor'
                  ? 'bg-white text-indigo-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Tutor BM</span>
              {!userProgress.isRegistered && <Lock className="w-3 h-3 text-amber-600 ml-0.5" />}
            </button>
          </nav>

          {/* Right Action Controls: Gamification badges & tools */}
          <div className="app-tools">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-bold"
              title="Rentak Latihan Harian"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>{userProgress.streak}h</span>
            </div>

            {/* Total Points XP Badge */}
            <button
              id="navbar-points-badge"
              onClick={() => onTabChange('leaderboard')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer"
              title="Lihat Papan Pendahulu & Mata Anda"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{userProgress.points}</span>
              <span className="text-[10px] text-amber-700">XP</span>
            </button>

            {/* Daily Check-In CTA */}
            <button
              id="navbar-daily-checkin-btn"
              aria-label="Daftar masuk harian"
              onClick={onOpenDailyCheckIn}
              className={`relative px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                canClaimToday
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Daftar Masuk Harian untuk Dapatkan Mata"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Daftar Masuk</span>
              {canClaimToday && (
                <span className="w-2 h-2 rounded-full bg-amber-300 absolute -top-0.5 -right-0.5 ring-2 ring-white animate-ping" />
              )}
            </button>

            {/* Preferred Definition Language Selector */}
            <div className="relative flex items-center bg-slate-100 border border-slate-200/80 rounded-xl px-1.5 sm:px-2 py-1 gap-1">
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <select
                id="language-select-dropdown"
                value={preferredLang}
                onChange={(e) => onLanguageChange(e.target.value as TargetLanguage)}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
                title="Pilih bahasa terjemahan kamus"
              >
                {languageOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.flag} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Word Bank Button */}
            <button
              id="header-wordbank-btn"
              aria-label="Buka kosa kata"
              type="button"
              onClick={onOpenWordBank}
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Buka Buku Kosa Kata"
            >
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">Kosa Kata</span>
              {wordBankCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  {wordBankCount}
                </span>
              )}
            </button>

            {/* Format SPM Rubric Guide Button */}
            <button
              id="header-rubric-guide-btn"
              type="button"
              onClick={onOpenGuide}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold hidden md:flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Panduan Format & Kriteria Pemarkahan SPM"
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Panduan</span>
            </button>

            {/* Student Auth / Account Button */}
            {userProgress.isRegistered ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="navbar-user-profile-btn"
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Akaun Calon SPM Berdaftar"
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs shadow-inner">
                    {userProgress.avatar || '👨‍🎓'}
                  </span>
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">
                    {userProgress.studentName || 'Calon SPM'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-700 opacity-80" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                        {userProgress.avatar || '👨‍🎓'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">
                          {userProgress.studentName || 'Calon SPM'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {userProgress.schoolName || 'Calon SPM'}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                            Akaun Berdaftar
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div>Sekolah: <span className="font-semibold text-slate-700">{userProgress.schoolName || 'Calon SPM'}</span></div>
                      <div>Negeri: <span className="font-semibold text-slate-700">{userProgress.state || 'Malaysia'}</span></div>
                      <div>Status: <span className="text-emerald-600 font-bold">✓ Calon Berdaftar Sah</span></div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onTabChange('leaderboard');
                        }}
                        className="w-full py-1.5 px-2 rounded-lg hover:bg-slate-100 text-left font-medium flex items-center gap-1.5 text-slate-700 cursor-pointer"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lihat Ranking Saya</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full py-1.5 px-2 rounded-lg hover:bg-rose-50 text-left font-semibold flex items-center gap-1.5 text-rose-700 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="navbar-login-signup-btn"
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ring-2 ring-amber-400/50"
                title="Daftar akaun untuk kunci kedudukan dan markah anda di Papan Pendahulu"
              >
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Daftar / Log Masuk</span>
                <span className="sm:hidden">Daftar</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-sm uppercase">
                  Wajib
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
