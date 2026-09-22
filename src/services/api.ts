const TOKEN_KEY = 'spm_bm_auth_token_day1';

/** Same-origin API transport: verified bearer session and bounded waiting. */
export function apiFetch(input: string, init: RequestInit = {}, timeoutMs = 65_000) {
  const headers = new Headers(init.headers);
  let requestToken: string | null = null;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    requestToken = token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch { /* Storage may be disabled; server will request login. */ }
  return fetch(input, { ...init, headers, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs) }).then(response=>{
    if (response.status === 401 && requestToken) {
      try { if (localStorage.getItem(TOKEN_KEY) === requestToken) {
        localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('spm_bm_auth_user_day1');
        window.dispatchEvent(new Event('session-expired'));
      } } catch {}
    }
    if(input.startsWith('/api/gemini/') || input.startsWith('/api/tts'))window.dispatchEvent(new Event('ai-usage-changed'));
    return response;
  });
}
