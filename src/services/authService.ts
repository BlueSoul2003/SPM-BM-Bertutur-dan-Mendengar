import { AuthUser, UserProgress } from '../types';

const AUTH_USER_KEY = 'spm_bm_auth_user_day1';
const AUTH_TOKEN_KEY = 'spm_bm_auth_token_day1';

// Purge legacy session memories
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('spm_bm_auth_user_v1');
    localStorage.removeItem('spm_bm_auth_token_v1');
  } catch (e) {}
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function logout(): void {
  clearAuthSession();
}

export interface RegisterPayload {
  email: string;
  password: string;
  studentName?: string;
  schoolName?: string;
  state?: string;
  avatar?: string;
  username?: string;
  initialPoints?: number;
  initialStreak?: number;
  initialLastCheckInDate?: string;
  initialClaimedStreakDays?: number[];
  initialLastSpmGrade?: any;
  totalSpeakingDone?: number;
  totalListeningDone?: number;
}

export interface GoogleAuthPayload {
  email: string;
  name?: string;
  avatar?: string;
  googleId?: string;
  schoolName?: string;
  state?: string;
  initialPoints?: number;
  initialStreak?: number;
  initialLastCheckInDate?: string;
  initialClaimedStreakDays?: number[];
  initialLastSpmGrade?: any;
  totalSpeakingDone?: number;
  totalListeningDone?: number;
}

export async function registerAccount(payload: RegisterPayload): Promise<{
  success: boolean;
  token?: string;
  user?: AuthUser;
  progress?: UserProgress;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Pendaftaran akaun gagal.' };
    }

    if (data.token && data.user) {
      saveAuthSession(data.token, data.user);
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
      progress: data.progress,
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ralat sambungan ke pelayan.' };
  }
}

export async function loginAccount(identifier: string, password: string): Promise<{
  success: boolean;
  token?: string;
  user?: AuthUser;
  progress?: UserProgress;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Log masuk gagal.' };
    }

    if (data.token && data.user) {
      saveAuthSession(data.token, data.user);
    }

    return {
      success: true,
      token: data.token,
      user: data.user,
      progress: data.progress,
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ralat sambungan ke pelayan.' };
  }
}

export async function authenticateWithGoogle(payload: GoogleAuthPayload): Promise<{
  success: boolean;
  isNewUser?: boolean;
  token?: string;
  user?: AuthUser;
  progress?: UserProgress;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal menyambung akaun Google.' };
    }

    if (data.token && data.user) {
      saveAuthSession(data.token, data.user);
    }

    return {
      success: true,
      isNewUser: data.isNewUser,
      token: data.token,
      user: data.user,
      progress: data.progress,
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ralat sambungan pelayan Google.' };
  }
}

export async function fetchCurrentSession(): Promise<{
  user: AuthUser | null;
  progress: UserProgress | null;
}> {
  const token = getStoredAuthToken();
  const cachedUser = getStoredAuthUser();
  if (!token && !cachedUser) return { user: null, progress: null };

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/auth/me${token ? '' : `?userId=${cachedUser?.id}`}`, { headers });
    if (!res.ok) {
      if (res.status === 401) {
        clearAuthSession();
      }
      return { user: null, progress: null };
    }

    const data = await res.json();
    if (data.user) {
      saveAuthSession(token || 'guest', data.user);
      return { user: data.user, progress: data.progress };
    }
  } catch (e) {
    console.warn('Failed to verify session with server:', e);
  }

  return { user: cachedUser, progress: null };
}

export async function updateProfile(payload: {
  userId: string;
  studentName?: string;
  schoolName?: string;
  state?: string;
  avatar?: string;
}): Promise<{ success: boolean; user?: AuthUser; progress?: UserProgress; error?: string }> {
  try {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Gagal mengemas kini profil.' };
    }

    const token = getStoredAuthToken() || 'spm_token';
    if (data.user) {
      saveAuthSession(token, data.user);
    }

    return { success: true, user: data.user, progress: data.progress };
  } catch (e: any) {
    return { success: false, error: e.message || 'Ralat semasa mengemas kini profil.' };
  }
}
