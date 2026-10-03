import { getCapabilities } from '../services/capabilities';
import { apiFetch } from '../services/api';
// Authentic Malaysian Bahasa Melayu Audio Player & Web Speech Engine

export interface SpeechRecognitionResultState {
  transcript: string;
  isListening: boolean;
  error?: string;
}

export function recognitionErrorMessage(code?: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Akses mikrofon atau pengecaman suara tidak dibenarkan. Semak kebenaran pelayar, atau taip jawapan anda.';
    case 'audio-capture':
      return 'Mikrofon tidak dapat dikesan. Semak sambungan mikrofon, atau taip jawapan anda.';
    case 'network':
      return 'Sambungan pengecaman suara terganggu. Semak internet dan cuba lagi, atau teruskan dengan menaip.';
    case 'no-speech':
      return 'Tiada suara dikesan. Tekan mikrofon untuk mencuba lagi, atau taip jawapan anda.';
    case 'language-not-supported':
      return 'Pengecaman Bahasa Melayu tidak tersedia dalam pelayar ini. Anda masih boleh menaip jawapan.';
    default:
      return 'Pengecaman suara telah berhenti. Cuba lagi atau taip jawapan anda. Jawapan yang sudah dipaparkan dikekalkan.';
  }
}

// Global reference to active audio player
let currentAudioPlayer: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;

/**
 * Deduplicates accidental speech recognition repetitions (e.g. "saya saya saya" -> "saya")
 * while preserving valid natural phrases.
 */
export function normalizeMalayTranscript(rawText: string): string {
  if (!rawText) return '';
  const tokens = rawText.trim().split(/\s+/);
  const deduped: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const prev = deduped[deduped.length - 1];

    if (!prev) {
      deduped.push(current);
      continue;
    }

    // Skip if identical to immediate previous token
    if (current.toLowerCase() === prev.toLowerCase()) {
      continue;
    }

    deduped.push(current);
  }

  return deduped.join(' ');
}

// Browser speech recognition support
export function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ms-MY';
    return recognition;
  } catch {
    return null;
  }
}

// Cached voice list for offline fallback
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoices = window.speechSynthesis.getVoices();
    });
  } catch (e) {
    console.warn('SpeechSynthesis voice load error:', e);
  }
}

export function getMalaysianVoice(): {
  voice: SpeechSynthesisVoice | null;
  isExplicitlyMalaysian: boolean;
  name: string;
} {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { voice: null, isExplicitlyMalaysian: false, name: 'Suara peranti tidak tersedia' };
  }

  let voices = cachedVoices;
  if (!voices || voices.length === 0) {
    voices = window.speechSynthesis.getVoices();
    cachedVoices = voices;
  }

  const msMyVoice = voices.find(v => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    return lang === 'ms-my';
  });
  if (msMyVoice) {
    return { voice: msMyVoice, isExplicitlyMalaysian: true, name: msMyVoice.name };
  }

  return {
    voice: null,
    isExplicitlyMalaysian: false,
    name: 'Suara lalai peranti (sebutan mungkin berbeza)'
  };
}

/** Plays configured cloud audio or device speech, with cancellation and bounded resources. */
export function speakMalayText(text: string, onEnd?: () => void, rate = 1, pitch = 1, onError?: (message: string) => void): () => void {
  stopSpeaking();
  const cleanText = text.replace(/[*#_~`]/g, '').replace(/\[JEDA\]/gi, ', ').replace(/\s+/g, ' ').trim();
  const controller = new AbortController(); currentAbortController = controller;
  let objectUrl: string | undefined;
  let ended = false;
  const done = (error?: string) => {
    if (ended || controller.signal.aborted) return;
    ended = true;
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = undefined; }
    if (currentAbortController === controller) { currentAudioPlayer = null; currentAbortController = null; }
    if (error && onError) onError(error); else onEnd?.();
  };
  const cancel = () => {
    controller.abort();
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = undefined; }
  };
  controller.signal.addEventListener('abort', () => { if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = undefined; } }, { once: true });
  let deviceStarted = false;
  const deviceSpeech = () => {
    if (controller.signal.aborted || deviceStarted) return;
    deviceStarted = true;
    if (!window.speechSynthesis) { done('Audio tidak disokong. Gunakan teks petikan.'); return; }
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ms-MY'; utterance.rate = rate; utterance.pitch = pitch;
    const { voice } = getMalaysianVoice(); if (voice) utterance.voice = voice;
    utterance.onend = () => done();
    utterance.onerror = () => done('Suara peranti tidak tersedia. Cuba pelayar lain atau gunakan teks petikan.');
    window.speechSynthesis.speak(utterance);
  };
  if (!cleanText) { done(); return cancel; }
  // Device playback stays inside the user's click, avoiding mobile autoplay rejection.
  if (!getCapabilities().cloudAudio) { deviceSpeech(); return () => { if (currentAbortController === controller) stopSpeaking(); else cancel(); }; }
  const audio = new Audio(); currentAudioPlayer = audio; audio.playbackRate = rate;
  audio.onended = () => done(); audio.onerror = deviceSpeech;
  void apiFetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: cleanText }), signal: controller.signal }, 25000)
    .then(async response => { if (!response.ok) throw new Error('Audio unavailable'); return response.blob(); })
    .then(async blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); audio.src = objectUrl; await audio.play();
    }).catch(() => { if (!controller.signal.aborted) deviceSpeech(); });
  return () => { if (currentAbortController === controller) stopSpeaking(); else cancel(); };
}

export function stopSpeaking(): void {
  currentAbortController?.abort(); currentAbortController = null;
  if (currentAudioPlayer) {
    currentAudioPlayer.onended = null; currentAudioPlayer.onerror = null;
    currentAudioPlayer.pause(); currentAudioPlayer.src = ''; currentAudioPlayer = null;
  }
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}
export function isAudioPlaying(): boolean {
  return !!currentAudioPlayer && !currentAudioPlayer.paused || !!(typeof window !== 'undefined' && window.speechSynthesis?.speaking);
}
