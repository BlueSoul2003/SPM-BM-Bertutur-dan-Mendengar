import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Clock,
  Award,
  Sparkles,
  AlertCircle,
  FileText,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  VolumeX,
  Target,
  Eye,
  EyeOff,
  BarChart3,
  ChevronRight,
  Headphones,
  Check
} from 'lucide-react';
import {
  SpeakingTopic,
  SpeakingAssessmentResult,
  SpmGradeInfo
} from '../types';
import { SPM_SPEAKING_TOPICS } from '../data/spmTopics';
import { InteractiveText } from './InteractiveText';
import { evaluateSpeakingResponse } from '../services/geminiService';
import {
  getSpeechRecognition,
  speakMalayText,
  stopSpeaking,
  getMalaysianVoice,
  normalizeMalayTranscript
} from '../utils/speechUtils';
import { calculateSpmGrade, SPM_GRADE_SCALE } from '../utils/spmGrading';

interface SpeakingAssessmentProps {
  onWordClick: (word: string, contextSentence: string) => void;
  onEarnPoints?: (points: number, reason: string, spmGrade?: SpmGradeInfo) => void;
}

export const SpeakingAssessment: React.FC<SpeakingAssessmentProps> = ({
  onWordClick,
  onEarnPoints,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<SpeakingTopic>(SPM_SPEAKING_TOPICS[0]);

  // 3-Page Flow State: 1 = Mula & Soalan, 2 = Persediaan & Bahan Rangsangan, 3 = Audio Soalan & Menjawab, 'evaluating' | 'result'
  const [examPage, setExamPage] = useState<1 | 2 | 3 | 'evaluating' | 'result'>(1);
  
  // Timers: LPM SPM Format (Persediaan: 60 saat, Menjawab: 180 saat)
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [speakTimeLeft, setSpeakTimeLeft] = useState(180);

  // Page 3: Hidden question text toggle
  const [showQuestionText, setShowQuestionText] = useState(false);

  // Audio playing states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayingText, setAudioPlayingText] = useState<string | null>(null);

  // Recording & Transcription
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Assessment results
  const [evaluationResult, setEvaluationResult] = useState<SpeakingAssessmentResult | null>(null);
  const [calculatedGrade, setCalculatedGrade] = useState<SpmGradeInfo | null>(null);

  // Malaysian Voice Status
  const [voiceDetails, setVoiceDetails] = useState(getMalaysianVoice());

  // Scale modal toggle
  const [showScaleModal, setShowScaleModal] = useState(false);

  const recognitionRef = useRef<any>(null);
  const prepTimerRef = useRef<any>(null);
  const speakTimerRef = useRef<any>(null);

  // Robust speech recognition tracking refs to prevent word repetitions and lost phrases
  const isRecordingRef = useRef(false);
  const baseTranscriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const isProceedingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Setup Web Speech Recognition with Malay locale
  useEffect(() => {
    const recog = getSpeechRecognition();
    if (recog) {
      recog.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalChunk += (finalChunk ? ' ' : '') + text;
          } else {
            interimChunk += (interimChunk ? ' ' : '') + text;
          }
        }

        finalTranscriptRef.current = finalChunk;
        interimTranscriptRef.current = interimChunk;

        const combined = [
          baseTranscriptRef.current,
          finalChunk,
          interimChunk
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        const cleanTranscript = normalizeMalayTranscript(combined);
        setSpokenTranscript(cleanTranscript);
        setRecognitionError(null);
      };

      recog.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setRecognitionError('Kebenaran mikrofon diperlukan. Sila benarkan akses mikrofon dalam pelayar anda.');
        } else if (event.error !== 'no-speech') {
          setRecognitionError(`Ralat pengecaman suara: ${event.error}`);
        }
      };

      recog.onend = () => {
        if (isRecordingRef.current) {
          baseTranscriptRef.current = [
            baseTranscriptRef.current,
            finalTranscriptRef.current,
            interimTranscriptRef.current
          ]
            .filter(Boolean)
            .join(' ')
            .trim();
          finalTranscriptRef.current = '';
          interimTranscriptRef.current = '';
          try {
            recog.start();
          } catch (e) {}
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recog;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceDetails(getMalaysianVoice());
      };
    }

    return () => {
      stopSpeaking();
      clearInterval(prepTimerRef.current);
      clearInterval(speakTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Cleanup on unmount or topic change
  useEffect(() => {
    handleResetToPage1();
  }, [selectedTopic]);

  // Primary question string
  const primaryQuestion =
    selectedTopic.guideQuestions && selectedTopic.guideQuestions.length > 0
      ? selectedTopic.guideQuestions[0]
      : selectedTopic.description;

  // Speak audio using native Malay TTS
  const handlePlayPromptAudio = (text: string) => {
    if (isPlayingAudio && audioPlayingText === text) {
      stopSpeaking();
      setIsPlayingAudio(false);
      setAudioPlayingText(null);
    } else {
      stopSpeaking();
      setIsPlayingAudio(true);
      setAudioPlayingText(text);

      speakMalayText(text, () => {
        setIsPlayingAudio(false);
        setAudioPlayingText(null);
      });
    }
  };

  // =========================================================================
  // PAGE 1 -> PAGE 2: MULA MASA PERSEDIAAN BAHAN RANGSANGAN (Format LPM)
  // =========================================================================
  const handleStartExamFlow = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setAudioPlayingText(null);
    setExamPage(2);
    const initialPrep = selectedTopic.prepTimeSeconds || 60;
    setPrepTimeLeft(initialPrep);

    speakMalayText('Masa persediaan bermula. Sila teliti bahan rangsangan sebelum menjawab.');

    clearInterval(prepTimerRef.current);
    let remaining = initialPrep;
    prepTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(prepTimerRef.current);
        setPrepTimeLeft(0);
        handleAutoProceedToPage3();
      } else {
        setPrepTimeLeft(remaining);
      }
    }, 1000);
  };

  // =========================================================================
  // PAGE 2 -> PAGE 3: MULA SESI MENJAWAB (AUDIO SOALAN & MIC)
  // =========================================================================
  const handleAutoProceedToPage3 = () => {
    if (isProceedingRef.current) return;
    isProceedingRef.current = true;
    setTimeout(() => {
      isProceedingRef.current = false;
    }, 1500);

    clearInterval(prepTimerRef.current);
    stopSpeaking();
    setIsPlayingAudio(false);
    setAudioPlayingText(null);
    setExamPage(3);
    const initialSpeak = selectedTopic.speakingTimeSeconds || 180;
    setSpeakTimeLeft(initialSpeak);

    // Auto-play the examiner question with native Malaysian voice after previous audio cleanup
    const questionTextToSpeak = `Soalan Pentaksir SPM: ${primaryQuestion}`;
    setTimeout(() => {
      handlePlayPromptAudio(questionTextToSpeak);
    }, 200);

    clearInterval(speakTimerRef.current);
    let speakRemaining = initialSpeak;
    speakTimerRef.current = setInterval(() => {
      speakRemaining -= 1;
      if (speakRemaining <= 0) {
        clearInterval(speakTimerRef.current);
        setSpeakTimeLeft(0);
      } else {
        setSpeakTimeLeft(speakRemaining);
      }
    }, 1000);
  };

  // Toggle speech recording in Page 3
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setRecognitionError('Pelayar anda tidak menyokong rakaman suara. Sila gunakan Google Chrome atau taipkan jawapan anda.');
      return;
    }

    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}

      const completed = [
        baseTranscriptRef.current,
        finalTranscriptRef.current,
        interimTranscriptRef.current
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const normalized = normalizeMalayTranscript(completed);
      baseTranscriptRef.current = normalized;
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      setSpokenTranscript(normalized);
    } else {
      stopSpeaking();
      baseTranscriptRef.current = spokenTranscript.trim();
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecognitionError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // =========================================================================
  // PAGE 3 -> EVALUASI KEPUTUSAN SKEMA RASMI SPM
  // =========================================================================
  const handleSubmitAnswer = async () => {
    if (recognitionRef.current && isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    clearInterval(speakTimerRef.current);
    stopSpeaking();

    const responseToEvaluate = spokenTranscript.trim();
    if (!responseToEvaluate) {
      setRecognitionError('Sila berikan respon pertuturan sebelum menghantar untuk penilaian.');
      return;
    }

    setExamPage('evaluating');

    try {
      const res = await evaluateSpeakingResponse(
        selectedTopic.title,
        selectedTopic.stimulusText,
        responseToEvaluate,
        selectedTopic.type,
        primaryQuestion,
        selectedTopic.id
      );
      setEvaluationResult(res);

      const gradeInfo = calculateSpmGrade(res.totalScore, res.maxScore);
      setCalculatedGrade(gradeInfo);

      let earnedPoints = 50;
      if (gradeInfo.grade === 'A+' || gradeInfo.grade === 'A') {
        earnedPoints += 25;
      }
      if (onEarnPoints) {
        onEarnPoints(earnedPoints, `Ujian Bertutur SPM (${gradeInfo.grade})`, gradeInfo);
      }

      setExamPage('result');
    } catch (error) {
      console.error(error);
      setExamPage(3);
      setRecognitionError('Penilaian AI tidak tersedia. Jawapan anda dikekalkan. Sila cuba lagi.');
    }
  };

  // Reset back to Page 1
  const handleResetToPage1 = () => {
    stopSpeaking();
    clearInterval(prepTimerRef.current);
    clearInterval(speakTimerRef.current);
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setExamPage(1);
    setSpokenTranscript('');
    setEvaluationResult(null);
    setCalculatedGrade(null);
    setShowQuestionText(false);
    setIsPlayingAudio(false);
    setAudioPlayingText(null);
  };

  // Helper for formatting time
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col justify-between space-y-3 font-sans">
      {/* COMPACT TOP NAVIGATION BAR: Fits mobile screen without scrolling */}
      <div className="flex items-center justify-between gap-2 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div className="leading-tight truncate">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900">Ujian Bertutur SPM</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold">1103/3</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold">40 Markah</span>
            </div>
            {/* Malaysian speaker voice indicator badge */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate" title={voiceDetails.name}>
                🇲🇾 Suara: Bahasa Melayu (Malaysia)
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Tools: 52 Sets Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={selectedTopic.id}
            onChange={(e) => {
              const found = SPM_SPEAKING_TOPICS.find((t) => t.id === e.target.value);
              if (found) {
                setSelectedTopic(found);
                handleResetToPage1();
              }
            }}
            className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1.5 rounded-xl border border-slate-300 outline-none max-w-[170px] truncate cursor-pointer"
          >
            {SPM_SPEAKING_TOPICS.map((t, idx) => (
              <option key={t.id} value={t.id}>
                Set {idx + 1}: {t.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowScaleModal(true)}
            className="p-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
            title="Skala Gred Rasmi SPM 1103/3"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* HALAMAN 1: BUTANG MULA & SOALAN (Format SPM Sebenar - Mobile Zero-Scroll)                 */}
      {/* ========================================================================================= */}
      {examPage === 1 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 animate-in fade-in duration-200">
          {/* Header & Step progress indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Halaman 1: Mula & Soalan Tugasan
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">Langkah 1 daripada 3</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Format Rasmi SPM
              </span>
            </div>
          </div>

          {/* Question Presentation Card */}
          <div className="practice-stimulus rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm border border-emerald-900/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                {selectedTopic.type === 'individu' ? 'Bahagian A: Ujian Individu (40 Markah)' : 'Bahagian B: Ujian Kumpulan (40 Markah)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-semibold">
                Tema: {selectedTopic.theme}
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white leading-snug">
                {selectedTopic.title}
              </h2>
            </div>

            {/* Soalan Utama / Tugasan Pentaksir */}
            <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Soalan Pentaksir SPM:
                </span>
                <span className="text-[10px] text-amber-200/80">
                  💡 Ketik perkataan untuk maksud kamus
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                "<InteractiveText text={primaryQuestion} onWordClick={onWordClick} />"
              </div>
            </div>

            {/* Aspek Bimbingan Calon */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-slate-300">Aspek Pertuturan Calon:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {(selectedTopic.guideQuestions || []).slice(0, 2).map((q, idx) => (
                  <div key={idx} className="text-[11px] text-emerald-100 bg-white/5 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span className="line-clamp-2">
                      <InteractiveText text={q} onWordClick={onWordClick} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process Walkthrough Info Pills */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Halaman 2</span>
              <span className="font-bold flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> 1 Minit Persediaan
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Halaman 3</span>
              <span className="font-bold flex items-center justify-center gap-1 mt-0.5">
                <Headphones className="w-3.5 h-3.5 text-emerald-600" /> Soalan Audio & Butang Mic
              </span>
            </div>
          </div>

          {/* PROMINENT START BUTTON */}
          <div className="pt-2">
            <button
              id="mula-ujian-bertutur-btn"
              type="button"
              onClick={handleStartExamFlow}
              className="practice-start w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Mula Ujian Bertutur SPM</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Ketik untuk memulakan masa persediaan bahan rangsangan secara automatik.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* HALAMAN 2: BAHAN RANGSANGAN & COUNTDOWN (Format SPM Sebenar)                              */}
      {/* ========================================================================================= */}
      {examPage === 2 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3.5 animate-in fade-in duration-200">
          {/* Header & Step progress */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Halaman 2: Bahan Rangsangan (Masa Persediaan)
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Langkah 2 daripada 3</span>
          </div>

          {/* COUNTDOWN TIMER BANNER */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Masa Persediaan SPM</span>
                  <span className="text-xs font-bold text-slate-800">Teliti isi kandungan petikan rangsangan</span>
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-xs text-center">
                <span className="text-xl font-black font-mono text-amber-700">
                  {formatSeconds(prepTimeLeft)}
                </span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.max(0, (prepTimeLeft / (selectedTopic.prepTimeSeconds || 60)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-amber-800 font-medium text-center">
              ⏳ Apabila masa tamat, halaman akan bertukar ke soalan pentaksir secara automatik.
            </p>
          </div>

          {/* STIMULUS DISPLAY (Compact height, readable, interactive words) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                Petikan Bahan Rangsangan:
              </span>

              {/* Audio button for stimulus (Malaysian speaker) */}
              <button
                type="button"
                onClick={() => handlePlayPromptAudio(selectedTopic.stimulusText)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {isPlayingAudio && audioPlayingText === selectedTopic.stimulusText ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{isPlayingAudio && audioPlayingText === selectedTopic.stimulusText ? 'Henti' : 'Dengar Petikan'}</span>
              </button>
            </div>

            {/* Stimulus text */}
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif max-h-[30vh] sm:max-h-[36vh] overflow-y-auto pr-1">
              <InteractiveText
                text={selectedTopic.stimulusText}
                onWordClick={onWordClick}
              />
            </div>
            <span className="text-[10px] text-slate-400 block text-right">
              💡 Ketik mana-mana perkataan sukar untuk takrifan kamus
            </span>
          </div>

          {/* SKIP / PROCEED EARLY BUTTON */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleAutoProceedToPage3}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Saya Sudah Sedia (Terus Menjawab)</span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* HALAMAN 3: SOALAN AUDIO + TEKS SOALAN + BUTANG MIC MENJAWAB (Single Page - No Scroll)     */}
      {/* ========================================================================================= */}
      {examPage === 3 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3.5 animate-in fade-in duration-200">
          {/* Header & Step progress */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Halaman 3: Soalan Audio & Menjawab
              </span>
            </div>
            {/* Answer countdown */}
            <div className="flex items-center gap-1 text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-lg text-slate-700">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatSeconds(speakTimeLeft)}</span>
            </div>
          </div>

          {/* 1. QUESTION AUDIO (Malaysian Speaker Voice) */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  isPlayingAudio && audioPlayingText === `Soalan Pentaksir SPM: ${primaryQuestion}`
                    ? 'bg-amber-400 text-slate-950 animate-bounce'
                    : 'bg-emerald-600 text-white'
                }`}>
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Audio Soalan Pentaksir
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Penyampai: Bahasa Melayu (Malaysia)
                  </span>
                </div>
              </div>

              {/* Play / Replay Question Audio */}
              <button
                type="button"
                onClick={() => handlePlayPromptAudio(`Soalan Pentaksir SPM: ${primaryQuestion}`)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
              >
                {isPlayingAudio && audioPlayingText === `Soalan Pentaksir SPM: ${primaryQuestion}` ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    <span>Henti Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                    <span>Dengar Soalan</span>
                  </>
                )}
              </button>
            </div>

            {/* Audio waveform visualization when playing */}
            {isPlayingAudio && (
              <div className="flex items-center justify-center gap-1 py-1 text-emerald-400">
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-amber-400 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-7 bg-emerald-400 rounded-full animate-pulse delay-150" />
                <span className="w-1 h-4 bg-teal-400 rounded-full animate-pulse delay-100" />
                <span className="text-[10px] font-semibold ml-2 text-slate-300">
                  Pentaksir sedang memperdengarkan soalan...
                </span>
              </div>
            )}
          </div>

          {/* 2. QUESTION TEXT (HIDDEN BY DEFAULT - Revealable toggle for students who don't understand audio) */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/70">
            <button
              type="button"
              onClick={() => setShowQuestionText(!showQuestionText)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                {showQuestionText ? (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>
                  {showQuestionText
                    ? 'Sembunyi Teks Soalan'
                    : 'Tunjuk Teks Soalan (Rujukan jika sukar faham audio)'}
                </span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold">
                {showQuestionText ? 'Tutup' : 'Klik untuk Buka'}
              </span>
            </button>

            {showQuestionText && (
              <div className="p-3 bg-white border-t border-slate-200 text-xs space-y-1.5 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Teks Soalan:
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    💡 Ketik perkataan untuk maksud kamus
                  </span>
                </div>
                <div className="font-semibold text-slate-900 font-serif leading-relaxed">
                  "<InteractiveText text={primaryQuestion} onWordClick={onWordClick} />"
                </div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 space-y-0.5">
                  <span className="font-bold text-slate-700">Panduan Aspek Pertuturan:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {(selectedTopic.guideQuestions || []).map((g, idx) => (
                      <li key={idx}>
                        <InteractiveText text={g} onWordClick={onWordClick} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* 3. BUTTON MIC FOR STUDENT TO ANSWER IN THE SAME PAGE */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                Ketik Mic untuk Menjawab:
              </span>
              <span className="text-[11px] text-slate-500">
                Patah Perkataan: {spokenTranscript.trim() ? spokenTranscript.trim().split(/\s+/).length : 0}
              </span>
            </div>

            {/* Prominent Mic Button on the SAME PAGE */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98] ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-600/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-700/20'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Sedang Merakam... (Ketik untuk Selesai)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{spokenTranscript ? 'Sambung Rakam Jawapan' : 'Mula Rakam Jawapan'}</span>
                  </>
                )}
              </button>

              {spokenTranscript && (
                <button
                  type="button"
                  onClick={() => {
                    setSpokenTranscript('');
                    baseTranscriptRef.current = '';
                    finalTranscriptRef.current = '';
                    interimTranscriptRef.current = '';
                  }}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                  title="Padam Transkrip"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Error banner if microphone issue */}
            {recognitionError && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{recognitionError}</span>
              </div>
            )}

            {/* Real-time transcript textarea */}
            <textarea
              value={spokenTranscript}
              onChange={(e) => {
                setSpokenTranscript(e.target.value);
                baseTranscriptRef.current = e.target.value;
              }}
              placeholder="Jawapan lisan anda akan muncul secara langsung di sini apabila bercakap ke dalam mikrofon (atau taip di sini)..."
              className="w-full h-24 sm:h-28 p-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none leading-relaxed"
            />
          </div>

          {/* 4. SUBMIT AND EVALUATE BUTTON ON THE SAME PAGE */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={!spokenTranscript.trim() || isRecording}
              className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                !spokenTranscript.trim() || isRecording
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-950 hover:bg-slate-800 text-white shadow-slate-950/20 active:scale-[0.98]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hantar & Nilai Jawapan SPM (Skema LPM)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* EVALUATING STATE: Clean Spinner                                                           */}
      {/* ========================================================================================= */}
      {examPage === 'evaluating' && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm space-y-3 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900">
            Ketua Pentaksir Sedang Menilai Respon Anda...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Menilai Tatabahasa & Kosa Kata (20m), Sebutan & Intonasi (10m), serta Kefasihan & Makna (10m) mengikut rubrik rasmi LPM SPM.
          </p>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* RESULT PHASE: SPM Official Grading & Feedback                                            */}
      {/* ========================================================================================= */}
      {examPage === 'result' && evaluationResult && calculatedGrade && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4 animate-in zoom-in-95 duration-200">
          {/* Official Grade Card */}
          <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 border border-emerald-800">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Keputusan Rasmi SPM 1103/3
              </span>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                {calculatedGrade.label}
              </h3>
              <p className="text-[11px] text-emerald-200 max-w-md line-clamp-2">
                {evaluationResult.examinerSummary}
              </p>
            </div>

            <div className="text-center bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 shrink-0">
              <span className="text-[9px] uppercase font-bold text-amber-300 block">Gred SPM</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">{calculatedGrade.grade}</div>
              <span className="text-[10px] text-white font-mono font-bold">{evaluationResult.totalScore}/40m</span>
            </div>
          </div>

          {/* 4 Rubric Domain Marks */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Tatabahasa</span>
                <span className="font-black text-emerald-700">
                  {evaluationResult.rubricBreakdown.tatabahasaKosaKata.score}/10
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Sebutan Baku</span>
                <span className="font-black text-teal-700">
                  {evaluationResult.rubricBreakdown.sebutanIntonasi.score}/10
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Kelancaran</span>
                <span className="font-black text-indigo-700">
                  {evaluationResult.rubricBreakdown.kefasihanKelancaran.score}/10
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Kematangan Idea</span>
                <span className="font-black text-amber-800">
                  {evaluationResult.rubricBreakdown.pengolahanIdea.score}/10
                </span>
              </div>
            </div>
          </div>

          {/* Exemplar Answer Preview (Skema Jawapan Tepat & Model Cemerlang SPM Gred A+) */}
          <div className="p-3.5 sm:p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl space-y-2.5 shadow-sm text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="font-bold text-emerald-950 text-xs sm:text-sm block">
                    Skema Jawapan Tepat & Contoh Jawapan Cemerlang SPM (Gred A+)
                  </span>
                  <span className="text-[10px] text-emerald-800">
                    Menepati Rubrik LPM 1103/3 • Kosa Kata Aras Tinggi • Peribahasa Bertepatan
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePlayPromptAudio(evaluationResult.exemplarAnswer)}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
              >
                {isPlayingAudio && audioPlayingText === evaluationResult.exemplarAnswer ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                    <span>Henti Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Dengar Sebutan Skema</span>
                  </>
                )}
              </button>
            </div>

            {/* Target Question Displayed Explicitly */}
            <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5 text-[11px] uppercase tracking-wider">
                Soalan Pentaksir Yang Dijawab:
              </span>
              <div className="font-serif text-slate-900 font-semibold italic text-xs sm:text-sm">
                "<InteractiveText text={primaryQuestion} onWordClick={onWordClick} />"
              </div>
            </div>

            {/* Full Model Answer */}
            <div className="bg-white rounded-xl p-3.5 border border-emerald-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Contoh Respon Lengkap Calon Gred A+:
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300 font-semibold flex items-center gap-1">
                  💡 Ketik perkataan untuk maksud kamus & sebutan
                </span>
              </div>
              <div className="text-slate-800 leading-relaxed font-serif text-xs sm:text-sm whitespace-pre-line">
                <InteractiveText
                  text={evaluationResult.exemplarAnswer}
                  onWordClick={onWordClick}
                />
              </div>
            </div>

            {/* Student's Own Spoken Response with Tap-to-Translate */}
            {spokenTranscript && (
              <div className="bg-white/90 rounded-xl p-3 border border-emerald-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Transkrip Jawapan Yang Anda Berikan:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Ketik perkataan untuk semak takrifan & ejaan
                  </span>
                </div>
                <div className="text-slate-800 leading-relaxed font-serif text-xs sm:text-sm bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
                  <InteractiveText text={spokenTranscript} onWordClick={onWordClick} />
                </div>
              </div>
            )}

            {/* Grammar Corrections if present */}
            {evaluationResult.grammarErrors && evaluationResult.grammarErrors.length > 0 && (
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wider">
                  Cadangan Pembetulan Tatabahasa & Kosa Kata:
                </span>
                <div className="space-y-1">
                  {evaluationResult.grammarErrors.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-lg border border-rose-100 flex items-center gap-2 flex-wrap text-xs"
                    >
                      <span className="line-through text-rose-600 font-medium">
                        "{err.original}"
                      </span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <InteractiveText text={err.corrected} onWordClick={onWordClick} />
                      </span>
                      {err.rule && (
                        <span className="text-[11px] text-slate-500 italic ml-auto">
                          ({err.rule})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            {((evaluationResult.strengths && evaluationResult.strengths.length > 0) ||
              (evaluationResult.improvements && evaluationResult.improvements.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {evaluationResult.strengths && evaluationResult.strengths.length > 0 && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1.5">
                    <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Kekuatan Respon Anda:
                    </span>
                    <ul className="space-y-1 text-slate-700">
                      {evaluationResult.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>
                            <InteractiveText text={str} onWordClick={onWordClick} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluationResult.improvements && evaluationResult.improvements.length > 0 && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1.5">
                    <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                      Aspek Boleh Ditingkatkan:
                    </span>
                    <ul className="space-y-1 text-slate-700">
                      {evaluationResult.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>
                            <InteractiveText text={imp} onWordClick={onWordClick} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons: Try Again or Choose Next */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetToPage1}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Cuba Semula Topik Ini</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextIdx = (SPM_SPEAKING_TOPICS.findIndex((t) => t.id === selectedTopic.id) + 1) % SPM_SPEAKING_TOPICS.length;
                setSelectedTopic(SPM_SPEAKING_TOPICS[nextIdx]);
                handleResetToPage1();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Topik Seterusnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* OFFICIAL SPM GRADE SCALE MODAL */}
      {showScaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-bold font-serif text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                Skala Gred Rasmi SPM Bertutur 1103/3
              </h4>
              <button
                type="button"
                onClick={() => setShowScaleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1 text-xs">
              {SPM_GRADE_SCALE.map((scale, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs">
                      {scale.grade}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">{scale.label}</span>
                      <span className="text-[10px] text-slate-500">{scale.tpLevel}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 text-xs">
                    {scale.minPercentage}% - {scale.maxPercentage}%
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowScaleModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
