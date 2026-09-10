import { UserProgress, LeaderboardEntry, SpmGradeInfo } from '../types';

const PROGRESS_STORAGE_KEY = 'spm_bm_user_progress_day1_fresh';

export const DAILY_STREAK_REWARDS = [
  { day: 1, xp: 20, label: 'Hari 1', icon: '🌱' },
  { day: 2, xp: 30, label: 'Hari 2', icon: '🌿' },
  { day: 3, xp: 40, label: 'Hari 3', icon: '🔥' },
  { day: 4, xp: 50, label: 'Hari 4', icon: '⚡' },
  { day: 5, xp: 65, label: 'Hari 5', icon: '⭐' },
  { day: 6, xp: 80, label: 'Hari 6', icon: '🚀' },
  { day: 7, xp: 120, label: 'Hari 7 (Hadiah Khas)', icon: '👑' },
];

export const LEVEL_TIERS = [
  { level: 1, minXp: 0, title: 'Pemula Bahasa' },
  { level: 2, minXp: 150, title: 'Penutur Asas' },
  { level: 3, minXp: 400, title: 'Penutur Mahir' },
  { level: 4, minXp: 800, title: 'Cemerlang SPM' },
  { level: 5, minXp: 1400, title: 'Wira Debat SPM' },
  { level: 6, minXp: 2200, title: 'Juara Kebangsaan SPM' },
];

export function calculateLevel(xp: number) {
  let tier = LEVEL_TIERS[0];
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      tier = LEVEL_TIERS[i];
      break;
    }
  }
  return tier;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateUserId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'spm_user_' + Math.random().toString(36).substring(2, 11);
}

// Clean Day 1 Initial State (Zero points, zero streak, no memory)
export function getInitialProgress(): UserProgress {
  return {
    userId: generateUserId(),
    points: 0,
    streak: 0,
    lastCheckInDate: '',
    claimedStreakDays: [],
    level: 1,
    levelName: 'Pemula Bahasa',
    studentName: 'Saya (Calon SPM)',
    schoolName: '',
    state: 'Kuala Lumpur',
    totalSpeakingDone: 0,
    totalListeningDone: 0,
    totalExercisesDone: 0,
  };
}

export function loadUserProgress(): UserProgress {
  if (typeof window === 'undefined') return getInitialProgress();
  try {
    // Purge previous version memories to ensure clean Day 1 start
    ['spm_bm_user_progress_v1', 'spm_bm_user_progress_v2', 'spm_bm_user_progress_v3_strict', 'spm_bm_user_progress_v4_clean'].forEach((k) => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Ensure userId exists
      if (!data.userId) {
        data.userId = generateUserId();
      }
      const tier = calculateLevel(data.points || 0);
      return {
        ...getInitialProgress(),
        ...data,
        level: tier.level,
        levelName: tier.title,
      };
    }
  } catch (e) {
    console.warn('Failed to load progress from localStorage:', e);
  }
  const init = getInitialProgress();
  saveUserProgress(init);
  syncUserToServer(init);
  return init;
}

export function saveUserProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const tier = calculateLevel(progress.points);
    const updated: UserProgress = {
      ...progress,
      level: tier.level,
      levelName: tier.title,
    };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save progress to localStorage:', e);
  }
}

// Reset app memory completely back to Day 1
export function resetUserProgressToDay1(): UserProgress {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      localStorage.removeItem('spm_bm_user_progress_v2');
      localStorage.removeItem('spm_bm_user_progress_v1');
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  }
  const clean = getInitialProgress();
  saveUserProgress(clean);
  syncUserToServer(clean);
  return clean;
}

// Sync user profile and XP to server real leaderboard
export async function syncUserToServer(progress: UserProgress): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/leaderboard/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: progress.userId,
        name: progress.studentName || 'Saya (Calon SPM)',
        username: progress.username || '',
        isRegistered: Boolean(progress.isRegistered),
        school: progress.schoolName || '',
        state: progress.state || 'Malaysia',
        points: progress.points || 0,
        streak: progress.streak || 0,
        predictedGrade: progress.lastSpmGrade?.grade || (progress.points > 100 ? 'A' : 'A-'),
        avatar: progress.avatar || '⭐',
      }),
    });

    // If user has a registered account, also sync their full account progress
    if (progress.isRegistered) {
      await fetch('/api/auth/sync-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: progress.userId,
          points: progress.points,
          streak: progress.streak,
          lastCheckInDate: progress.lastCheckInDate,
          claimedStreakDays: progress.claimedStreakDays,
          level: progress.level,
          levelName: progress.levelName,
          lastSpmGrade: progress.lastSpmGrade,
          totalSpeakingDone: progress.totalSpeakingDone,
          totalListeningDone: progress.totalListeningDone,
        }),
      });
    }
  } catch (e) {
    // Network errors handled silently
  }
}

// Fetch real participants from server
export async function fetchServerLeaderboard(registeredOnly = false): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard${registeredOnly ? '?registeredOnly=true' : ''}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch (e) {
    console.warn('Failed to fetch real leaderboard from server:', e);
    return [];
  }
}

// Clear all leaderboard entries on the server (for clean Day 1 publish)
export async function resetServerLeaderboard(): Promise<boolean> {
  try {
    const res = await fetch('/api/leaderboard/reset', { method: 'POST' });
    return res.ok;
  } catch (e) {
    console.warn('Failed to reset server leaderboard:', e);
    return false;
  }
}

export function addPointsToUser(
  progress: UserProgress,
  pointsToAdd: number,
  _reason?: string,
  spmGrade?: SpmGradeInfo
): UserProgress {
  const newPoints = (progress.points || 0) + pointsToAdd;
  const tier = calculateLevel(newPoints);
  const updated: UserProgress = {
    ...progress,
    points: newPoints,
    level: tier.level,
    levelName: tier.title,
    ...(spmGrade ? { lastSpmGrade: spmGrade } : {}),
  };
  saveUserProgress(updated);
  syncUserToServer(updated);
  return updated;
}

export function checkDailyCheckInStatus(progressOrDate: UserProgress | string): {
  canClaimToday: boolean;
  canCheckInToday: boolean;
  todayDayIndex: number; // 1-7
  isAlreadyClaimedToday: boolean;
} {
  const lastCheckIn = typeof progressOrDate === 'string' ? progressOrDate : progressOrDate.lastCheckInDate;
  const streak = typeof progressOrDate === 'string' ? 0 : progressOrDate.streak || 0;

  const todayStr = getTodayDateString();
  const isAlreadyClaimedToday = lastCheckIn === todayStr;

  let currentStreak = streak;
  if (!isAlreadyClaimedToday && lastCheckIn) {
    const lastDate = new Date(lastCheckIn);
    const today = new Date(todayStr);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 1) {
      currentStreak = 0;
    }
  }

  const nextDay = Math.min(7, (currentStreak % 7) + 1);

  return {
    canClaimToday: !isAlreadyClaimedToday,
    canCheckInToday: !isAlreadyClaimedToday,
    todayDayIndex: nextDay,
    isAlreadyClaimedToday,
  };
}

// Calculate leaderboard using ONLY real users
export function computeRankedLeaderboard(
  userProgress: UserProgress,
  serverEntries: LeaderboardEntry[] = []
): {
  entries: LeaderboardEntry[];
  currentUserRank: number;
  timeRemainingText: string;
  totalRealUsers: number;
} {
  const currentUserId = userProgress.userId;

  // Filter only registered users from server entries (guests are strictly excluded from leaderboard)
  const otherRealUsers = (serverEntries || [])
    .filter((e) => e.isRegistered && e.id !== currentUserId)
    .map((e) => {
      const { email: _unusedEmail, ...safeEntry } = e as any;
      return { ...safeEntry, isCurrentUser: false };
    });

  const isRegistered = Boolean(userProgress.isRegistered);
  const currentUserEntry: LeaderboardEntry = {
    id: currentUserId,
    rank: 0,
    name: userProgress.studentName || 'Calon SPM',
    username: '',
    isRegistered: true,
    school: userProgress.schoolName || 'Calon SPM',
    state: userProgress.state || 'Malaysia',
    points: userProgress.points || 0,
    streak: userProgress.streak || 0,
    predictedGrade: userProgress.lastSpmGrade?.grade || (userProgress.points > 100 ? 'A' : 'A-'),
    avatar: userProgress.avatar || '👨‍🎓',
    isCurrentUser: true,
    league: 'bronze',
    trend: 'up',
  };

  // The leaderboard exclusively contains registered candidates
  const allEntries: LeaderboardEntry[] = isRegistered
    ? [currentUserEntry, ...otherRealUsers]
    : [...otherRealUsers];

  // Sort descending by points
  allEntries.sort((a, b) => b.points - a.points);

  // Assign ranks and leagues
  let currentUserRank = isRegistered ? 1 : 0;
  const ranked = allEntries.map((entry, idx) => {
    const rank = idx + 1;
    let league: 'diamond' | 'gold' | 'silver' | 'bronze' = 'bronze';
    if (rank <= 3) league = 'diamond';
    else if (rank <= 8) league = 'gold';
    else if (rank <= 14) league = 'silver';
    else league = 'bronze';

    if (entry.isCurrentUser) {
      currentUserRank = rank;
    }

    return {
      ...entry,
      rank,
      league,
    };
  });

  // Calculate days until next Sunday 23:59
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const hoursRemaining = 23 - now.getHours();
  const timeRemainingText =
    daysUntilSunday === 0 && hoursRemaining <= 0
      ? 'Reset malam ini!'
      : `${daysUntilSunday} hari ${hoursRemaining} jam`;

  return {
    entries: ranked,
    currentUserRank,
    timeRemainingText,
    totalRealUsers: allEntries.length,
  };
}

export function getWeeklyLeaderboard(userProgress: UserProgress): {
  entries: LeaderboardEntry[];
  currentUserRank: number;
  timeRemainingText: string;
} {
  const result = computeRankedLeaderboard(userProgress, []);
  return {
    entries: result.entries,
    currentUserRank: result.currentUserRank,
    timeRemainingText: result.timeRemainingText,
  };
}
