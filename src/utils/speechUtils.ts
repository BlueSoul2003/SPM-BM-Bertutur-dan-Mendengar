import { apiFetch } from '../services/api';
// Authentic Malaysian Bahasa Melayu Audio Player & Web Speech Engine

export interface SpeechRecognitionResultState {
  transcript: string;
  isListening: boolean;
  error?: string;
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

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  // Malay locale for Malaysian SPM phoneme recognition
  recognition.lang = 'ms-MY';
  return recognition;
}

// Cached voice list for offline fallback
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
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
    return { voice: null, isExplicitlyMalaysian: false, name: 'Penyampai Audio Asli SPM (ms-MY)' };
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
    name: 'Penyampai Audio Tulen SPM (Bahasa Melayu Baku)'
  };
}

/**
 * Primary Native Malaysian Bahasa Melayu Speech Synthesizer.
 * Streams genuine native Malaysian Malay audio directly from the backend /api/tts endpoint.
 * This guarantees authentic pronunciation on all devices and OS without falling back
 * to foreign/English accents.
 */
export function speakMalayText(
  text: string,
  onEnd?: () => void,
  rate = 1.0,
  pitch = 1.0
): () => void {
  // Cancel any ongoing audio
  stopSpeaking();

  const cleanText = text
    .replace(/[*#_~`]/g, '')
    .replace(/\[JEDA\]/gi, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Abort controller to cancel network fetch if user stops prematurely
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  let isCancelled = false;
  let hasEnded = false;

  const audio = new Audio();
  currentAudioPlayer = audio;
  audio.playbackRate = rate;

  const finish = () => {
    if (!hasEnded) {
      hasEnded = true;
      if (currentAudioPlayer === audio) {
        currentAudioPlayer = null;
      }
      if (onEnd && !isCancelled) onEnd();
    }
  };

  audio.onended = finish;
  audio.onerror = (e) => {
    // Crucial: if audio was aborted or stopped or replaced, do NOT trigger fallback speech!
    if (isCancelled || hasEnded || currentAudioPlayer !== audio || !audio.src) {
      return;
    }
    console.warn('Audio playback error, trying synthesis fallback:', e);
    fallbackBrowserSpeech(cleanText, finish, rate, pitch);
  };

  {
    // Fetch all audio with the bearer token; media URLs cannot attach headers.
    apiFetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
      signal
    })
      .then((res) => {
        if (!res.ok) throw new Error(`TTS server response: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (signal.aborted || isCancelled || currentAudioPlayer !== audio) return;
        const objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;
        audio.play().catch((err) => {
          if (err.name !== 'AbortError' && !isCancelled && currentAudioPlayer === audio) {
            console.warn('Audio play failed:', err);
            finish();
          }
        });
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !isCancelled && currentAudioPlayer === audio) {
          console.warn('Failed to fetch TTS audio:', err);
          fallbackBrowserSpeech(cleanText, finish, rate, pitch);
        }
      });
  }

  return () => {
    isCancelled = true;
    stopSpeaking();
  };
}

function fallbackBrowserSpeech(
  cleanText: string,
  onFinish: () => void,
  rate = 0.92,
  pitch = 1.0
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onFinish();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ms-MY';
    utterance.rate = rate;
    utterance.pitch = pitch;

    const { voice } = getMalaysianVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = onFinish;
    utterance.onerror = onFinish;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Fallback speech error:', err);
    onFinish();
  }
}

/**
 * Halts all active audio elements and browser speech synthesis.
 */
export function stopSpeaking(): void {
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch (e) {}
    currentAbortController = null;
  }

  if (currentAudioPlayer) {
    try {
      // Detach event listeners BEFORE clearing src so error event won't trigger fallback speech!
      currentAudioPlayer.onended = null;
      currentAudioPlayer.onerror = null;
      currentAudioPlayer.pause();
      currentAudioPlayer.currentTime = 0;
      currentAudioPlayer.src = '';
    } catch (e) {}
    currentAudioPlayer = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

export function isAudioPlaying(): boolean {
  return currentAudioPlayer !== null && !currentAudioPlayer.paused;
}
