const TOKEN_KEY = 'spm_bm_auth_token_day1';

/** Same-origin API transport: verified bearer session and bounded waiting. */
export function apiFetch(input: string, init: RequestInit = {}, timeoutMs = 65_000) {
  const headers = new Headers(init.headers);
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } catch { /* Storage may be disabled; server will request login. */ }
  return fetch(input, { ...init, headers, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs) }).then(response=>{
    if(input.startsWith('/api/gemini/') || input.startsWith('/api/tts'))window.dispatchEvent(new Event('ai-usage-changed'));
    return response;
  });
}
