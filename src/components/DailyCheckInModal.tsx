import React, { useState } from 'react';
import {
  X,
  Flame,
  Sparkles,
  CheckCircle2,
  Calendar,
  Gift,
  Award,
  ArrowRight
} from 'lucide-react';
import { UserProgress } from '../types';
import {
  DAILY_STREAK_REWARDS,
  checkDailyCheckInStatus,
  getTodayDateString,
  saveUserProgress,
  syncUserToServer,
} from '../utils/gamification';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProgress: UserProgress;
  onCheckInSuccess: (rewardXp: number, newStreak: number) => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  userProgress,
  onCheckInSuccess,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedJustNow, setClaimedJustNow] = useState(false);

  if (!isOpen) return null;

  const { canClaimToday, todayDayIndex, isAlreadyClaimedToday } =
    checkDailyCheckInStatus(userProgress);

  const handleClaim = () => {
    if (!canClaimToday || isClaiming) return;
    setIsClaiming(true);

    const todayReward =
      DAILY_STREAK_REWARDS.find((r) => r.day === todayDayIndex) ||
      DAILY_STREAK_REWARDS[0];

    const todayStr = getTodayDateString();
    const updatedClaimedDays = [...(userProgress.claimedStreakDays || [])];
    if (!updatedClaimedDays.includes(todayDayIndex)) {
      updatedClaimedDays.push(todayDayIndex);
    }

    const newStreak = (userProgress.streak || 0) + 1;
    const newPoints = userProgress.points + todayReward.xp;

    const updatedProgress: UserProgress = {
      ...userProgress,
      points: newPoints,
      streak: newStreak,
      lastCheckInDate: todayStr,
      claimedStreakDays: updatedClaimedDays,
    };

    saveUserProgress(updatedProgress);
    syncUserToServer(updatedProgress);

    setTimeout(() => {
      setIsClaiming(false);
      setClaimedJustNow(true);
      onCheckInSuccess(todayReward.xp, newStreak);
    }, 600);
  };

  return (
    <div
      id="daily-checkin-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="daily-checkin-modal"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative"
      >
        {/* Header with Warm Flame Glow */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white relative">
          <button
            id="close-checkin-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-white/20">
              <Calendar className="w-5 h-5 text-white" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
              Ganjaran Harian SPM
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            Daftar Masuk Harian
          </h2>
          <p className="text-xs text-orange-100 leading-relaxed">
            Kekalkan rentak latihan setiap hari untuk mengumpul mata pertarungan
            dan menakluki Papan Pendahulu Mingguan!
          </p>

          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-200 fill-amber-300 animate-pulse" />
            <span>Rentak Semasa: {userProgress.streak} Hari Berturut-turut</span>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="p-5">
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            {DAILY_STREAK_REWARDS.map((item) => {
              const isClaimed =
                userProgress.claimedStreakDays?.includes(item.day) ||
                (claimedJustNow && item.day === todayDayIndex);
              const isToday = item.day === todayDayIndex;
              const isDay7 = item.day === 7;

              return (
                <div
                  key={item.day}
                  id={`streak-day-${item.day}`}
                  className={`relative rounded-2xl p-2.5 text-center transition-all flex flex-col items-center justify-between border ${
                    isDay7 ? 'col-span-2' : 'col-span-1'
                  } ${
                    isClaimed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isToday && canClaimToday
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 ring-offset-1 text-amber-900 shadow-md animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-500 mb-1">
                    {item.label}
                  </div>

                  <div className="my-1 text-2xl">
                    {isClaimed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    ) : (
                      <span>{item.icon}</span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-amber-600">
                    +{item.xp} XP
                  </div>

                  {isClaimed && (
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full mt-1">
                      Dituntut
                    </span>
                  )}

                  {!isClaimed && isToday && canClaimToday && (
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded-full mt-1">
                      Hari Ini!
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          {canClaimToday && !claimedJustNow ? (
            <button
              id="claim-today-streak-btn"
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gift className="w-5 h-5 animate-bounce" />
              <span>
                {isClaiming
                  ? 'Menebus Mata...'
                  : `Tuntut +${
                      DAILY_STREAK_REWARDS.find((r) => r.day === todayDayIndex)
                        ?.xp || 20
                    } XP Hari Ini!`}
              </span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Tahniah! Anda sudah menuntut ganjaran hari ini. Kembali lagi
                esok untuk ganjaran seterusnya!
              </span>
            </div>
          )}

          {/* Tips Card */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <span className="text-base leading-none mt-0.5">💡</span>
            <div>
              <span className="font-semibold text-slate-800">
                Petua Cikgu Maya:{' '}
              </span>
              Calon SPM yang konsisten berlatih lisan 5 minit sehari terbukti
              80% lebih tenang dan fasih semasa berdepan pentaksir SPM sebenar!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
