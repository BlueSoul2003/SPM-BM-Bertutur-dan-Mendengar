import { clearAuthSession, saveAuthSession } from './authService';
export interface CourseConfig { enabled: boolean; portalUrl: string; returnUrl: string }
const flowKey = 'bual.course-login.v1';
const random = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function courseRequest(path: string, body?: object) {
  const response = await fetch(`/api/course/${path}`, {
    method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Sambungan terganggu. Sila cuba lagi.');
  return data;
}
export async function startCourseLogin(config: CourseConfig) {
  const verifier = random(), state = random();
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  // Write before leaving. Disabled browser storage produces an actionable error.
  sessionStorage.setItem(flowKey, JSON.stringify({ verifier, state, at: Date.now() }));
  clearAuthSession();
  const url = new URL(config.portalUrl);
  url.searchParams.set('bual', 'login');
  url.searchParams.set('bual_state', state);
  url.searchParams.set('bual_challenge', challenge);
  url.hash = '/secondary/spm/spm-bm';
  window.location.assign(url.href);
}
let callbackResult: Promise<any> | undefined;
export function consumeCourseCallback() {
  // StrictMode mounts twice: consume a one-time code only once per page load.
  if (callbackResult) return callbackResult;
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.has('bual_code')) return Promise.resolve(null);
  const code = params.get('bual_code'), state = params.get('bual_state');
  window.history.replaceState({}, '', window.location.pathname);
  callbackResult = (async () => {
    const saved = sessionStorage.getItem(flowKey);
    sessionStorage.removeItem(flowKey);
    const flow = saved ? JSON.parse(saved) : null;
    if (!flow || flow.state !== state || Date.now() - flow.at > 1800_000 || !/^[A-Za-z0-9_-]{43}$/.test(code || '')) throw new Error('Pautan log masuk tidak sepadan atau telah tamat. Mulakan semula dari sini.');
    clearAuthSession();
    return courseRequest('exchange', { code, verifier: flow.verifier });
  })();
  return callbackResult;
}
export function acceptCourseSession(result: any) {
  if (!result?.token?.startsWith('ic.') || !result.user) throw new Error('Sesi tidak sah. Cuba log masuk semula.');
  saveAuthSession(result.token, result.user);
}
