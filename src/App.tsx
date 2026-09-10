import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  TargetLanguage,
  DictionaryData,
  WordBankItem,
  UserProgress,
  SpmGradeInfo,
  AuthUser
} from './types';
import { Navbar } from './components/Navbar';
import { SpeakingAssessment } from './components/SpeakingAssessment';
import { ListeningAssessment } from './components/ListeningAssessment';
import { AiTutorChat } from './components/AiTutorChat';
import { WeeklyLeaderboard } from './components/WeeklyLeaderboard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DictionaryModal } from './components/DictionaryModal';
import { WordBankModal } from './components/WordBankModal';
import { RubricGuideModal } from './components/RubricGuideModal';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { AuthModal } from './components/AuthModal';
import { AuthGateView } from './components/AuthGateView';
import { fetchCurrentSession, logout } from './services/authService';
import {
  loadUserProgress,
  saveUserProgress,
  addPointsToUser,
  checkDailyCheckInStatus,
  getWeeklyLeaderboard
} from './utils/gamification';
import { Flame, Sparkles, Award, X, Trophy } from 'lucide-react';

const WORD_BANK_STORAGE_KEY = 'spm_bm_word_bank_v1';
const PREF_LANG_STORAGE_KEY = 'spm_bm_pref_lang_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('speaking');
  const [preferredLang, setPreferredLang] = useState<TargetLanguage>('en');
  const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress);

  // Modals state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordContext, setSelectedWordContext] = useState<string | undefined>(undefined);
  const [isWordBankOpen, setIsWordBankOpen] = useState(false);
  const [isRubricGuideOpen, setIsRubricGuideOpen] = useState(false);
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  // XP Reward Toast notification
  const [pointsToast, setPointsToast] = useState<{
    points: number;
    reason: string;
    spmGrade?: SpmGradeInfo;
  } | null>(null);

  // Check verified auth session on app initialization
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await fetchCurrentSession();
        if (session && session.user) {
          const u = session.user;
          const p = session.progress;
          setUserProgress((prev) => {
            const merged: UserProgress = {
              ...prev,
              userId: u.id,
              username: u.username,
              studentName: u.studentName,
              schoolName: u.schoolName,
              state: u.state,
              avatar: u.avatar,
              email: u.email,
              authProvider: u.authProvider,
              isRegistered: true,
              points: Math.max(prev.points, p?.points || 0),
              streak: Math.max(prev.streak, p?.streak || 1),
            };
            saveUserProgress(merged);
            return merged;
          });
        }
      } catch (e) {
        console.warn('Session verification error:', e);
      }
    };
    checkSession();
  }, []);

  // Load preferences, wordbank, and prompt daily check-in on first load if available
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(PREF_LANG_STORAGE_KEY) as TargetLanguage;
      if (savedLang) setPreferredLang(savedLang);

      const savedBank = localStorage.getItem(WORD_BANK_STORAGE_KEY);
      if (savedBank) {
        setWordBank(JSON.parse(savedBank));
      } else {
        // Initial sample seed items for SPM
        const initialSeed: WordBankItem[] = [
          {
            word: 'meruncing',
            rootWord: 'runcing',
            partOfSpeech: 'Kata Kerja / Kata Adjektif',
            definitions: {
              ms: 'Menjadi semakin genting, tegang, atau bertambah parah.',
              en: 'To become critical, acute, worsening, or escalating.',
              zh: '（形势或危机）变得尖锐、严重、恶化。',
              ta: 'நிலமை மோசமடைதல் / தீவிரமடைதல்.'
            },
            synonyms: ['genting', 'gawat', 'parah', 'meruncingkan'],
            antonyms: ['reda', 'pulih', 'stabil'],
            spmSampleSentence: 'Kemelut pencemaran sungai yang kian meruncing ini menuntut tindakan drastik daripada semua pihak.',
            spmTips: 'Gunakan dalam huraian masalah karangan/lisan SPM bagi menggantikan "semakin teruk".',
            savedAt: new Date().toISOString(),
            masteryLevel: 'learning'
          },
          {
            word: 'maslahat',
            rootWord: 'maslahat',
            partOfSpeech: 'Kata Nama',
            definitions: {
              ms: 'Faedah, guna, keuntungan, kebaikan, atau manfaat yang diperoleh.',
              en: 'Benefit, advantage, utility, public good or welfare.',
              zh: '利益、好处、福祉、益处。',
              ta: 'நன்மை / பயன் / லாபம்.'
            },
            synonyms: ['faedah', 'manfaat', 'keuntungan', 'kemaslahatan'],
            antonyms: ['mudarat', 'kerugian'],
            spmSampleSentence: 'Amalan gaya hidup sihat membawa seribu satu maslahat kepada kecergasan jasmani.',
            spmTips: 'Gantikan perkataan "faedah/kebaikan" dengan "kemaslahatan".',
            savedAt: new Date().toISOString(),
            masteryLevel: 'mastered'
          }
        ];
        setWordBank(initialSeed);
        localStorage.setItem(WORD_BANK_STORAGE_KEY, JSON.stringify(initialSeed));
      }

      // Check if eligible for daily check-in
      const checkInStatus = checkDailyCheckInStatus(userProgress.lastCheckInDate);
      if (checkInStatus.canCheckInToday) {
        // Slight delay for smooth initial entrance
        const timer = setTimeout(() => {
          setIsDailyCheckInOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }, []);

  const handleLanguageChange = (lang: TargetLanguage) => {
    setPreferredLang(lang);
    try {
      localStorage.setItem(PREF_LANG_STORAGE_KEY, lang);
    } catch (e) {}
  };

  const handleWordClick = (word: string, contextSentence: string) => {
    setSelectedWord(word);
    setSelectedWordContext(contextSentence);
  };

  const handleToggleSaveWord = (item: DictionaryData) => {
    setWordBank((prev) => {
      const exists = prev.some((w) => w.word.toLowerCase() === item.word.toLowerCase());
      let updated: WordBankItem[];
      if (exists) {
        updated = prev.filter((w) => w.word.toLowerCase() !== item.word.toLowerCase());
      } else {
        const newItem: WordBankItem = {
          ...item,
          savedAt: new Date().toISOString(),
          masteryLevel: 'learning'
        };
        updated = [newItem, ...prev];
        // Award XP for expanding vocabulary!
        handleEarnPoints(5, `Menyimpan Kosa Kata Baru: "${item.word}"`);
      }
      try {
        localStorage.setItem(WORD_BANK_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleRemoveWord = (word: string) => {
    setWordBank((prev) => {
      const updated = prev.filter((w) => w.word.toLowerCase() !== word.toLowerCase());
      try {
        localStorage.setItem(WORD_BANK_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleToggleMastery = (word: string) => {
    setWordBank((prev) => {
      const updated = prev.map((w) => {
        if (w.word.toLowerCase() === word.toLowerCase()) {
          const nextMastery = (w.masteryLevel === 'mastered' ? 'learning' : 'mastered') as 'learning' | 'mastered';
          if (nextMastery === 'mastered') {
            handleEarnPoints(10, `Menguasai Kosa Kata: "${word}"`);
          }
          return {
            ...w,
            masteryLevel: nextMastery
          };
        }
        return w;
      });
      try {
        localStorage.setItem(WORD_BANK_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Gamification: Earn points callback
  const handleEarnPoints = (points: number, reason: string, spmGrade?: SpmGradeInfo) => {
    setUserProgress((prev) => {
      const updated = addPointsToUser(prev, points, reason, spmGrade);
      return updated;
    });

    setPointsToast({
      points,
      reason,
      spmGrade
    });

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setPointsToast((current) => (current?.reason === reason ? null : current));
    }, 4500);
  };

  const handleCheckInSuccess = (rewardXp: number, newStreak: number) => {
    // Refresh userProgress
    setUserProgress(loadUserProgress());
    setPointsToast({
      points: rewardXp,
      reason: `Daftar Masuk Harian (Rentetan ${newStreak} Hari Berturut-turut! 🔥)`
    });
    setTimeout(() => {
      setPointsToast(null);
    }, 4500);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthUser, syncedProgress?: UserProgress) => {
    const updated: UserProgress = {
      ...(syncedProgress || userProgress),
      userId: user.id,
      username: user.username,
      studentName: user.studentName,
      schoolName: user.schoolName,
      state: user.state,
      avatar: user.avatar,
      email: user.email,
      authProvider: user.authProvider,
      isRegistered: true,
      points: Math.max(userProgress.points, syncedProgress?.points || 0),
      streak: Math.max(userProgress.streak, syncedProgress?.streak || 1),
    };
    setUserProgress(updated);
    saveUserProgress(updated);
    setIsAuthModalOpen(false);
    setPointsToast({
      points: updated.points,
      reason: `Selamat datang, ${user.studentName}! Akaun anda telah disahkan dan kemajuan telah dikunci di Papan Pendahulu.`
    });
    setTimeout(() => {
      setPointsToast(null);
    }, 5000);
  };

  const handleLogout = async () => {
    await logout();
    setUserProgress((prev) => {
      const guest: UserProgress = {
        ...prev,
        userId: `guest_${Date.now()}`,
        username: undefined,
        email: undefined,
        authProvider: undefined,
        studentName: 'Saya (Calon SPM)',
        isRegistered: false,
      };
      saveUserProgress(guest);
      return guest;
    });
    setPointsToast({
      points: 0,
      reason: 'Anda telah log keluar. Sila daftar atau log masuk semula untuk mengakses ujian.'
    });
    setTimeout(() => {
      setPointsToast(null);
    }, 4000);
  };

  // Compute current user ranking for mobile bottom navigation pill
  const leaderboardData = getWeeklyLeaderboard(userProgress);
  const currentRank = leaderboardData.currentUserRank;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navbar (Only shown after login/registration) */}
      {userProgress.isRegistered && (
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          wordBankCount={wordBank.length}
          onOpenWordBank={() => setIsWordBankOpen(true)}
          preferredLang={preferredLang}
          onLanguageChange={handleLanguageChange}
          onOpenGuide={() => setIsRubricGuideOpen(true)}
          userProgress={userProgress}
          onOpenDailyCheckIn={() => setIsDailyCheckInOpen(true)}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
        />
      )}

      {/* Floating XP Reward Banner */}
      {pointsToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-950 text-white rounded-2xl p-3.5 shadow-2xl border border-amber-400/40 flex items-start justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 tracking-wide">
                  +{pointsToast.points} XP Diperoleh!
                </span>
                {pointsToast.spmGrade && (
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black">
                    Gred {pointsToast.spmGrade.grade}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 line-clamp-2 leading-tight">
                {pointsToast.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPointsToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content View (Mandatory registration gate enforced) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        {!userProgress.isRegistered ? (
          <AuthGateView
            currentUserProgress={userProgress}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          <>
            {activeTab === 'speaking' && (
              <SpeakingAssessment
                onWordClick={handleWordClick}
                onEarnPoints={handleEarnPoints}
              />
            )}

            {activeTab === 'listening' && (
              <ListeningAssessment
                onWordClick={handleWordClick}
                onEarnPoints={handleEarnPoints}
              />
            )}

            {activeTab === 'tutor' && (
              <AiTutorChat
                onWordClick={handleWordClick}
                onEarnPoints={handleEarnPoints}
              />
            )}

            {activeTab === 'leaderboard' && (
              <WeeklyLeaderboard
                userProgress={userProgress}
                onUpdateUserProgress={(updated) => {
                  setUserProgress(updated);
                  saveUserProgress(updated);
                }}
                onNavigateToSpeaking={() => setActiveTab('speaking')}
                onOpenAuthModal={handleOpenAuthModal}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile-First Fixed Bottom Navigation (Only shown after login/registration) */}
      {userProgress.isRegistered && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUserRank={currentRank}
          isRegistered={userProgress.isRegistered}
          onOpenAuthModal={() => handleOpenAuthModal('register')}
        />
      )}

      {/* Instant Dictionary & Multi-language Translation Modal */}
      <DictionaryModal
        selectedWord={selectedWord}
        contextSentence={selectedWordContext}
        preferredLang={preferredLang}
        onLanguageChange={handleLanguageChange}
        wordBank={wordBank}
        onToggleSaveWord={handleToggleSaveWord}
        onClose={() => {
          setSelectedWord(null);
          setSelectedWordContext(undefined);
        }}
      />

      {/* Personal Word Bank & Flashcards Modal */}
      <WordBankModal
        isOpen={isWordBankOpen}
        wordBank={wordBank}
        onRemoveWord={handleRemoveWord}
        onToggleMastery={handleToggleMastery}
        onClose={() => setIsWordBankOpen(false)}
        preferredLang={preferredLang}
      />

      {/* LPM SPM Format & Rubric Guide Modal */}
      <RubricGuideModal
        isOpen={isRubricGuideOpen}
        onClose={() => setIsRubricGuideOpen(false)}
      />

      {/* Daily Check-In & Streak Rewards Modal */}
      <DailyCheckInModal
        isOpen={isDailyCheckInOpen}
        onClose={() => setIsDailyCheckInOpen(false)}
        userProgress={userProgress}
        onCheckInSuccess={handleCheckInSuccess}
      />

      {/* Student Sign Up / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        currentUserProgress={userProgress}
        allowClose={userProgress.isRegistered}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
