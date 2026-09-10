import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  Volume2,
  Award,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Clock,
  VolumeX,
  Check
} from 'lucide-react';
import { ListeningTrack, SpmGradeInfo } from '../types';
import { SPM_LISTENING_TRACKS } from '../data/spmListeningTracks';
import { InteractiveText } from './InteractiveText';
import { speakMalayText, stopSpeaking } from '../utils/speechUtils';
import { calculateSpmGrade } from '../utils/spmGrading';

interface ListeningAssessmentProps {
  onWordClick: (word: string, contextSentence: string) => void;
  onEarnPoints?: (points: number, reason: string, spmGrade?: SpmGradeInfo) => void;
}

/**
 * Robust Answer Comparator for SPM Listening Assessment.
 * Normalizes numeric formats (e.g., 15000 vs 15,000, RM15,000), whitespace, casing, and accepted variations.
 */
export function isListeningAnswerCorrect(
  userVal: any,
  question: { type: string; correctAnswer: any }
): boolean {
  if (userVal === undefined || userVal === null) return false;

  if (question.type === 'true_false') {
    return userVal === question.correctAnswer;
  }

  if (question.type === 'mcq') {
    return (
      String(userVal).trim().toLowerCase() ===
      String(question.correctAnswer).trim().toLowerCase()
    );
  }

  const rawUser = String(userVal).trim();
  const rawCorrect = String(question.correctAnswer).trim();

  if (!rawUser) return false;

  // Direct case-insensitive match
  if (rawUser.toLowerCase() === rawCorrect.toLowerCase()) return true;

  // Normalizer: strips currency prefixes, commas, fullstops, and whitespace
  const normalize = (val: string) => {
    return val
      .toLowerCase()
      .replace(/rm\s*/gi, '')
      .replace(/ringgit\s*(malaysia)?/gi, '')
      .replace(/,/g, '') // removes thousands separator: "15,000" -> "15000"
      .replace(/\./g, '')
      .replace(/\s+/g, '') // removes internal spaces: "15 000" -> "15000"
      .replace(/\b(orang|murid|pelajar|sen|sekolah|unit|buah|kali)\b/gi, '');
  };

  const normUser = normalize(rawUser);
  const normCorrect = normalize(rawCorrect);

  if (normUser && normCorrect && normUser === normCorrect) {
    return true;
  }

  // Check alternative formats in answer (e.g., "15,000 / 15000" or "Dewan Bestari / Bestari")
  const correctAlternatives = rawCorrect
    .split(/[/;,|]|\batau\b/i)
    .map(normalize)
    .filter(Boolean);
  if (correctAlternatives.some((alt) => alt === normUser)) {
    return true;
  }

  // Number digit extraction check
  const extractDigits = (s: string) => s.replace(/\D/g, '');
  const userDigits = extractDigits(rawUser);
  const correctDigits = extractDigits(rawCorrect);
  if (userDigits && correctDigits && userDigits === correctDigits) {
    return true;
  }

  // Common SPM number word equivalents
  const numberWordEquivalents: Record<string, string[]> = {
    '15000': ['lima belas ribu', 'limabelas ribu', '15k', '15 ribu', '15,000', '15000'],
    '1234': ['1234', 'satu dua tiga empat'],
    '25000': ['dua puluh lima ribu', '25k', '25 ribu', '25,000', '25000'],
    '10000': ['sepuluh ribu', '10k', '10 ribu', '10,000', '10000'],
    '5000': ['lima ribu', '5k', '5 ribu', '5,000', '5000'],
    '50000': ['lima puluh ribu', '50k', '50 ribu', '50,000', '50000'],
    '100000': ['seratus ribu', '100k', '100 ribu', '100,000', '100000']
  };

  for (const [key, variants] of Object.entries(numberWordEquivalents)) {
    const userMatches = variants.some((v) => normalize(v) === normUser) || userDigits === key;
    const correctMatches = variants.some((v) => normalize(v) === normCorrect) || correctDigits === key;
    if (userMatches && correctMatches) {
      return true;
    }
  }

  return false;
}

export const ListeningAssessment: React.FC<ListeningAssessmentProps> = ({
  onWordClick,
  onEarnPoints,
}) => {
  // Navigation State: 'set_selection' (Page 1) vs 'exam_session' (Page 2)
  const [currentPage, setCurrentPage] = useState<'set_selection' | 'exam_session'>('set_selection');

  const [selectedTrack, setSelectedTrack] = useState<ListeningTrack>(SPM_LISTENING_TRACKS[0]);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [listeningRound, setListeningRound] = useState<1 | 2>(1);

  // Stop audio on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const genres = [
    'all',
    'Berita',
    'Wawancara',
    'Taklimat',
    'Rencana',
    'Syarahan',
    'Pengumuman',
    'Perbualan',
  ];

  const filteredTracks = SPM_LISTENING_TRACKS.filter((track) => {
    const matchesGenre = selectedGenre === 'all' || track.genre.toLowerCase() === selectedGenre.toLowerCase();
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.script.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const handleStartSet = (track: ListeningTrack) => {
    stopSpeaking();
    setSelectedTrack(track);
    setUserAnswers({});
    setIsGraded(false);
    setShowTranscript(false);
    setListeningRound(1);
    setIsPlaying(false);
    setCurrentPage('exam_session');
    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSetList = () => {
    stopSpeaking();
    setIsPlaying(false);
    setCurrentPage('set_selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Play full audio using native Malaysian BM TTS
  const handlePlayFullAudio = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const textToSpeak = `Kertas 4, Peperiksaan SPM Bahasa Melayu. Petikan Mendengar, ${selectedTrack.title}. ${selectedTrack.script}`;

      speakMalayText(
        textToSpeak,
        () => {
          setIsPlaying(false);
          if (listeningRound === 1) {
            setListeningRound(2);
          }
        },
        speed
      );
    }
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setIsPlaying(false);
  };

  const handleSelectAnswer = (qId: string, value: any) => {
    if (isGraded) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleGradeSubmission = () => {
    handleStopAudio();
    setIsGraded(true);

    let cCount = 0;
    selectedTrack.questions.forEach((q) => {
      const userVal = userAnswers[q.id];
      if (isListeningAnswerCorrect(userVal, q)) {
        cCount++;
      }
    });

    const totalQuestions = selectedTrack.questions.length;
    const scaledScore = Math.round((cCount / Math.max(1, totalQuestions)) * 30);
    const gradeInfo = calculateSpmGrade(scaledScore, 30);

    if (onEarnPoints) {
      const points = 15 + cCount * 10;
      onEarnPoints(points, `Ujian Mendengar SPM (${cCount}/${totalQuestions} Betul)`, gradeInfo);
    }
  };

  const handleResetCurrentSet = () => {
    handleStopAudio();
    setUserAnswers({});
    setIsGraded(false);
    setShowTranscript(false);
    setListeningRound(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate score for display
  let correctCount = 0;
  selectedTrack.questions.forEach((q) => {
    const userVal = userAnswers[q.id];
    if (isListeningAnswerCorrect(userVal, q)) {
      correctCount++;
    }
  });

  const totalQuestions = selectedTrack.questions.length;
  const percentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const scaledSpmScore = Math.round((correctCount / Math.max(1, totalQuestions)) * 30);
  const currentGradeInfo = calculateSpmGrade(scaledSpmScore, 30);
  const currentTrackIndex = SPM_LISTENING_TRACKS.findIndex((t) => t.id === selectedTrack.id);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans pb-12">
      {/* ========================================================================= */}
      {/* HALAMAN 1: PILIH SET UJIAN MENDENGAR (52 SET LENGKAP)                     */}
      {/* ========================================================================= */}
      {currentPage === 'set_selection' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-teal-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-inner">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base sm:text-xl font-extrabold font-serif text-white tracking-tight">
                      Ujian Mendengar Bahasa Melayu
                    </h2>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      SPM 1103/4
                    </span>
                  </div>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Format Rasmi Lembaga Peperiksaan Malaysia &bull; 30 Markah &bull; 52 Set Praktis
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">🇲🇾 Suara Melayu Standard</span>
              </div>
            </div>

            {/* Search Bar & Genre Filters */}
            <div className="pt-2 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari petikan, tema, atau kata kunci (contoh: sukan, alam sekitar, teknologi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-300 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Genre Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {genres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedGenre === g
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-white/10 hover:bg-white/20 text-teal-100 border border-white/10'
                    }`}
                  >
                    {g === 'all' ? 'Semua Genre (52 Set)' : g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Set Count Display */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>
              Menunjukkan <strong>{filteredTracks.length}</strong> set petikan SPM
            </span>
            <span className="text-slate-400">Pilih mana-mana set untuk memulakan audio & soalan</span>
          </div>

          {/* Grid of Sets: Mobile-friendly large cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTracks.map((track, idx) => {
              const fullIdx = SPM_LISTENING_TRACKS.findIndex((t) => t.id === track.id) + 1;
              return (
                <div
                  key={track.id}
                  onClick={() => handleStartSet(track)}
                  className="bg-white hover:bg-teal-50/40 border border-slate-200 hover:border-teal-400/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 font-extrabold text-xs flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shrink-0">
                        #{fullIdx}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                        {track.genre}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 font-serif line-clamp-2 leading-snug">
                        {track.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        Tema: <span className="font-medium text-slate-700">{track.theme}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      ~{track.audioDurationSeconds}s &bull; {track.questions.length} Soalan
                    </span>
                    <span className="font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Mula Set <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HALAMAN 2: AUDIO PLAYER & SOALAN FORMAT RASMI SPM (1103/4)                */}
      {/* ========================================================================= */}
      {currentPage === 'exam_session' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Bar: Back to Set List + Set Index */}
          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={handleBackToSetList}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Senarai Set</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 hidden sm:inline-block">
                Set {currentTrackIndex + 1} daripada {SPM_LISTENING_TRACKS.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold border border-teal-300">
                {selectedTrack.genre}
              </span>
            </div>
          </div>

          {/* AUDIO PLAYER CARD: Mobile-Friendly Big Play Button */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-4 sm:p-6 border border-teal-900/60 shadow-md space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" />
                Format Rasmi SPM 1103/4 &bull; Ujian Mendengar (30 Markah)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-semibold">
                {listeningRound === 1 ? 'Bacaan Kali Pertama' : 'Bacaan Kali Kedua (Semakan)'}
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-xl font-bold font-serif text-white leading-snug">
                {selectedTrack.title}
              </h2>
              <p className="text-xs text-teal-200 mt-1">
                Tema: {selectedTrack.theme} &bull; Dengar dengan teliti sebelum menjawab soalan di bawah.
              </p>
            </div>

            {/* Audio Controller Bar */}
            <div className="bg-white/10 rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Play / Pause button */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  id="play-listening-audio-btn"
                  type="button"
                  onClick={handlePlayFullAudio}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all cursor-pointer active:scale-95 shrink-0 ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 animate-pulse shadow-amber-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/30'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <div className="leading-tight">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    {isPlaying ? 'Sedang Memainkan Audio SPM...' : 'Ketik untuk Dengar Audio'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    🇲🇾 Bahasa Melayu (Malaysia)
                  </span>
                </div>
              </div>

              {/* Speed Controls & Transcript Toggle */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Speed buttons */}
                <div className="flex items-center bg-white/10 rounded-xl p-1 text-xs border border-white/10">
                  {[0.85, 1.0, 1.15].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        speed === s
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Show / Hide Transcript Button */}
                <button
                  type="button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>{showTranscript ? 'Tutup Teks' : 'Lihat Teks'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCurrentSet}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                  title="Ulang semula ujian set ini"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transcript Drawer */}
            {showTranscript && (
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2.5 animate-in fade-in text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Transkrip Audio Penuh
                  </span>
                  <span className="text-[10px]">💡 Ketik mana-mana perkataan untuk kamus</span>
                </div>
                <div className="text-slate-200 leading-relaxed font-serif max-h-48 overflow-y-auto pr-1">
                  <InteractiveText text={selectedTrack.script} onWordClick={onWordClick} />
                </div>
              </div>
            )}
          </div>

          {/* QUESTIONS CONTAINER */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900">
                  Soalan Pemahaman Mendengar (Kertas 4)
                </h3>
                <p className="text-xs text-slate-500">
                  Jawab semua soalan berdasarkan petikan yang telah diperdengarkan.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                {Object.keys(userAnswers).length}/{totalQuestions} Dijawab
              </span>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {selectedTrack.questions.map((question, qIdx) => {
                const qNum = question.questionNumber || qIdx + 1;
                const userVal = userAnswers[question.id];
                const isCorrect =
                  question.type === 'fill_blank'
                    ? userVal &&
                      String(userVal).trim().toLowerCase() ===
                        String(question.correctAnswer).trim().toLowerCase()
                    : userVal === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isGraded
                        ? isCorrect
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-rose-50/60 border-rose-300'
                        : userVal !== undefined
                        ? 'bg-teal-50/30 border-teal-300 shadow-xs'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {qNum}
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {question.prompt}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                        {question.marks || 1} Markah
                      </span>
                    </div>

                    {/* Question Interactive Controls */}
                    {/* 1. Multiple Choice Options */}
                    {question.type === 'mcq' && question.options && (
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {question.options.map((opt, optIdx) => {
                          const isSelected = userVal === opt;
                          const isThisCorrect = question.correctAnswer === opt;

                          let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
                          if (isGraded) {
                            if (isThisCorrect) {
                              btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                            } else if (isSelected && !isThisCorrect) {
                              btnStyle = 'bg-rose-600 text-white border-rose-600 font-bold';
                            } else {
                              btnStyle = 'bg-white text-slate-400 border-slate-200 opacity-60';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectAnswer(question.id, opt)}
                              disabled={isGraded}
                              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isGraded && isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                              )}
                              {isGraded && isSelected && !isThisCorrect && (
                                <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. True / False Options */}
                    {question.type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[true, false].map((tfVal) => {
                          const isSelected = userVal === tfVal;
                          const isThisCorrect = question.correctAnswer === tfVal;
                          const label = tfVal ? 'BETUL' : 'SALAH';

                          let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
                          if (isGraded) {
                            if (isThisCorrect) {
                              btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                            } else if (isSelected && !isThisCorrect) {
                              btnStyle = 'bg-rose-600 text-white border-rose-600 font-bold';
                            } else {
                              btnStyle = 'bg-white text-slate-400 border-slate-200 opacity-60';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs';
                          }

                          return (
                            <button
                              key={String(tfVal)}
                              type="button"
                              onClick={() => handleSelectAnswer(question.id, tfVal)}
                              disabled={isGraded}
                              className={`py-2.5 px-4 rounded-xl border text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${btnStyle}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Fill in the Blank */}
                    {question.type === 'fill_blank' && (
                      <div className="pt-1 space-y-1.5">
                        <input
                          type="text"
                          value={userVal || ''}
                          onChange={(e) => handleSelectAnswer(question.id, e.target.value)}
                          disabled={isGraded}
                          placeholder="Taip jawapan tepat mengikut petikan audio..."
                          className={`w-full p-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                            isGraded
                              ? isListeningAnswerCorrect(userVal, question)
                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold focus:ring-emerald-500'
                                : 'border-rose-400 bg-rose-50/50 text-rose-950 font-bold focus:ring-rose-500'
                              : 'border-slate-300 focus:ring-teal-500'
                          }`}
                        />
                        {isGraded && (
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            {isListeningAnswerCorrect(userVal, question) ? (
                              <span className="text-emerald-700 flex items-center gap-1 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Jawapan Anda Diterima (Betul)
                              </span>
                            ) : (
                              <span className="text-rose-700 flex items-center gap-1 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-lg">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Kurang tepat. Skema Diterima: {String(question.correctAnswer)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation Banner when graded */}
                    {isGraded && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Penerangan Skema SPM:</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                          {question.explanation}
                        </p>
                        <p className="text-[11px] text-teal-800 font-medium">
                          Jawapan Tepat: <strong>{String(question.correctAnswer)}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submission / Grade Action */}
            {!isGraded ? (
              <div className="pt-2">
                <button
                  id="submit-listening-answers-btn"
                  type="button"
                  onClick={handleGradeSubmission}
                  disabled={Object.keys(userAnswers).length === 0}
                  className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                    Object.keys(userAnswers).length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white shadow-teal-700/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hantar & Semak Jawapan SPM (Skema LPM)</span>
                </button>
              </div>
            ) : (
              /* RESULTS BANNER */
              <div className="pt-2 space-y-3">
                <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 border border-teal-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Keputusan Ujian Mendengar (1103/4)
                    </span>
                    <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                      {currentGradeInfo.label}
                    </h3>
                    <p className="text-xs text-teal-200">
                      Anda berjaya menjawab {correctCount} daripada {totalQuestions} soalan dengan tepat ({percentage}%).
                    </p>
                  </div>

                  <div className="text-center bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 shrink-0">
                    <span className="text-[9px] uppercase font-bold text-amber-300 block">Gred SPM</span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">{currentGradeInfo.grade}</div>
                    <span className="text-[10px] text-white font-mono font-bold">{scaledSpmScore}/30m</span>
                  </div>
                </div>

                {/* Bottom Navigation Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCurrentSet}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Cuba Semula Set Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (currentTrackIndex + 1) % SPM_LISTENING_TRACKS.length;
                      handleStartSet(SPM_LISTENING_TRACKS[nextIdx]);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <span>Set Seterusnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToSetList}
                    className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <span>Senarai 52 Set</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
