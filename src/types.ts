export type ActiveTab = 'speaking' | 'listening' | 'tutor' | 'leaderboard' | 'guide';

export type TargetLanguage = 'en' | 'zh' | 'ta' | 'ms';

export type DifficultyLevel = 'mudah' | 'sederhana' | 'sukar';

export interface SpmGradeInfo {
  rawScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'E' | 'G';
  gradeTitle: string; // e.g. "Cemerlang Tertinggi", "Cemerlang", "Kepujian"
  label?: string;
  band: string; // e.g. "TP6 (Cemerlang Tertinggi)", "TP5", etc.
  tpLevel?: string;
  color: string;
  nextGradeTips?: string;
  scoreGap?: number;
  gapToNextGrade?: number;
  nextGrade?: string;
}

export interface PronunciationDrillItem {
  phrase: string;
  targetKeyword: string;
  tips: string;
  phoneticHint?: string;
  category: 'penanda_wacana' | 'peribahasa' | 'kosa_kata';
}

export interface IdeaTemplateItem {
  section: 'Isi Utama' | 'Mengapa' | 'Bagaimana' | 'Contoh' | 'Peribahasa' | 'Kesimpulan';
  starter: string;
  placeholder: string;
  sampleCompletion: string;
  keyVocabulary: string[];
}

export interface StepDrills {
  pronunciationDrills: PronunciationDrillItem[];
  ideaTemplates: IdeaTemplateItem[];
  speakingTips: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  studentName: string;
  schoolName: string;
  state: string;
  avatar: string;
  createdAt: string;
  isRegistered: boolean;
  authProvider?: 'email' | 'google';
}

export interface UserProgress {
  userId: string;
  email?: string;
  points: number;
  streak: number;
  lastCheckInDate: string; // YYYY-MM-DD
  claimedStreakDays: number[];
  level: number;
  levelName: string;
  studentName: string;
  schoolName: string;
  state?: string;
  avatar?: string;
  username?: string;
  isRegistered?: boolean;
  authProvider?: 'email' | 'google';
  totalSpeakingDone: number;
  totalListeningDone: number;
  totalExercisesDone: number;
  lastSpmGrade?: SpmGradeInfo;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  email?: string;
  school: string;
  state: string;
  points: number;
  streak: number;
  predictedGrade: string;
  avatar: string;
  username?: string;
  isRegistered?: boolean;
  authProvider?: 'email' | 'google';
  isCurrentUser?: boolean;
  league: 'diamond' | 'gold' | 'silver' | 'bronze';
  trend?: 'up' | 'down' | 'same';
}

export interface GrammarError {
  original: string;
  corrected: string;
  explanation: string;
  rule?: string;
}

export interface ElevatedVocab {
  original: string;
  suggestion: string;
  context: string;
}

export interface GrammarAnalysis {
  hasErrors: boolean;
  corrections: GrammarError[];
  elevatedVocabulary: ElevatedVocab[];
  proverbs: string[];
  fluencyTip?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioGenerated?: boolean;
  grammarAnalysis?: GrammarAnalysis;
}

export interface DictionaryData {
  word: string;
  rootWord?: string;
  partOfSpeech?: string;
  definitions: {
    ms: string;
    en: string;
    zh: string;
    ta: string;
  };
  synonyms: string[];
  antonyms: string[];
  spmSampleSentence: string;
  spmTips?: string;
}

export interface WordBankItem extends DictionaryData {
  savedAt: string;
  notes?: string;
  masteryLevel: 'learning' | 'mastered';
}

export interface SpeakingAssessmentCriterion {
  score: number;
  max: number;
  feedback: string;
}

export interface SpeakingAssessmentResult {
  totalScore: number;
  maxScore: number;
  band: string;
  rubricBreakdown: {
    tatabahasaKosaKata: SpeakingAssessmentCriterion;
    sebutanIntonasi: SpeakingAssessmentCriterion;
    kefasihanKelancaran: SpeakingAssessmentCriterion;
    pengolahanIdea: SpeakingAssessmentCriterion;
  };
  strengths: string[];
  improvements: string[];
  grammarErrors: { original: string; corrected: string; rule: string }[];
  exemplarAnswer: string;
  examinerSummary: string;
}

export interface SpeakingTopic {
  id: string;
  title: string;
  theme: string;
  level: 'Tingkatan 4' | 'Tingkatan 5';
  type: 'individu' | 'kumpulan';
  difficulty?: DifficultyLevel;
  stimulusText: string;
  guideQuestions: string[];
  groupRoles?: { candidate: string; name: string; openingLine: string }[];
  prepTimeSeconds: number;
  speakTimeSeconds: number;
  examinerQuestions: string[];
  vocabularyAssistance: { word: string; meaning: string }[];
  stepDrills?: StepDrills;
}

export interface ListeningQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'matching' | 'fill_blank' | 'short_answer';
  questionNumber: number;
  prompt: string;
  options?: string[]; // for mcq
  matchingPairs?: { left: string; right: string }[]; // for matching
  correctAnswer: string | boolean | Record<string, string>;
  explanation: string;
  transcriptTimestamp?: string;
}

export interface ListeningTrack {
  id: string;
  title: string;
  theme: string;
  audioDurationSeconds: number;
  genre: 'Berita' | 'Wawancara' | 'Taklimat' | 'Rencana' | 'Pengumuman';
  script: string;
  scriptParagraphs: { speaker?: string; text: string; timeOffsetSeconds: number }[];
  questions: ListeningQuestion[];
  spmTips: string;
}

export interface ExerciseItem {
  id: string;
  category: 'pronunciation' | 'vocabulary' | 'grammar' | 'micro_listening';
  title: string;
  question: string;
  targetPhrase?: string;
  audioScript?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  proverbMeaning?: string;
}
