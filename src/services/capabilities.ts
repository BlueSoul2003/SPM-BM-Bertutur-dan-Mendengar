import { useEffect, useState } from 'react';
import { apiFetch } from './api';
export interface Capabilities { ai: boolean; cloudAudio: boolean; passwordRecovery: boolean }
const unavailable: Capabilities = { ai: false, cloudAudio: false, passwordRecovery: false };
let pending: Promise<Capabilities> | undefined;
let current = unavailable;
export function getCapabilities() { return current; }
export function loadCapabilities(): Promise<Capabilities> {
  return pending ??= apiFetch('/api/capabilities', {}, 10000).then(async response => {
    if (!response.ok) throw new Error('Capabilities unavailable');
    const data = await response.json();
    return current = { ai: data.ai === true, cloudAudio: data.cloudAudio === true, passwordRecovery: data.passwordRecovery === true };
  }).catch(() => { pending = undefined; return unavailable; });
}
export function useCapabilities() {
  const [capabilities, setCapabilities] = useState(current);
  useEffect(() => { let active = true; void loadCapabilities().then(value => { if (active) setCapabilities(value); }); return () => { active = false; }; }, []);
  return capabilities;
}
