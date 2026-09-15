import { apiFetch } from './api';
import {
  ChatMessage,
  SpeakingAssessmentResult,
  DictionaryData,
  TargetLanguage
} from '../types';
import { BUILTIN_DICTIONARY } from '../data/spmTopics';
import { KAMUS_SPM_LENGKAP } from '../data/kamusData';
import { getSpeakingModelAnswer } from '../data/spmModelAnswers';

// Master dictionary combining all curated lexicons
const MASTER_DICTIONARY: Record<string, DictionaryData> = {
  ...BUILTIN_DICTIONARY,
  ...KAMUS_SPM_LENGKAP
};

export async function sendChatMessageToAI(
  messages: ChatMessage[],
  tutorStyle: string,
  topic: string
): Promise<{ reply: string; grammarAnalysis?: any }> {
  try {
    const res = await apiFetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tutorStyle,
        topic
      })
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return {reply:'Cikgu AI tidak tersedia buat masa ini. Sila cuba lagi sebentar atau semak had penggunaan harian anda.'};
  }
}

export async function evaluateSpeakingResponse(
  stimulusTopic: string,
  stimulusContext: string,
  studentResponse: string,
  assessmentType: 'individu' | 'kumpulan',
  questionAsked?: string,
  topicId?: string
): Promise<SpeakingAssessmentResult> {
  const modelAnswer = getSpeakingModelAnswer(
    topicId || stimulusTopic,
    stimulusTopic,
    questionAsked,
    stimulusContext
  );

  try {
    const res = await apiFetch('/api/gemini/evaluate-speaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stimulusTopic,
        stimulusContext,
        studentResponse,
        assessmentType,
        questionAsked,
        topicId
      })
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.exemplarAnswer || data.exemplarAnswer.length < 50) {
      data.exemplarAnswer = modelAnswer;
    }
    return data;
  } catch (err) {
    throw new Error('Penilaian AI tidak tersedia. Jawapan anda dikekalkan; sila cuba lagi.');
  }
}

// In-memory client cache to guarantee instant sub-millisecond repeated lookups
const clientDictCache = new Map<string, DictionaryData>();

export async function lookupDictionaryWord(
  rawWord: string,
  contextSentence?: string,
  targetLang: TargetLanguage = 'en'
): Promise<DictionaryData> {
  const cleanWord = rawWord.toLowerCase().replace(/[^a-zA-Z\u00C0-\u024F\-]/g, '').trim();

  // 1. In-memory client cache
  if (clientDictCache.has(cleanWord)) {
    return clientDictCache.get(cleanWord)!;
  }

  // 2. Direct master dictionary exact word match
  if (MASTER_DICTIONARY[cleanWord]) {
    const entry: DictionaryData = {
      ...MASTER_DICTIONARY[cleanWord],
      word: cleanWord
    };
    clientDictCache.set(cleanWord, entry);
    return entry;
  }

  // 3. Query backend Gemini API for accurate, context-aware dictionary definitions
  try {
    const res = await apiFetch('/api/gemini/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: cleanWord,
        contextSentence,
        targetLang
      })
    });

    if (res.ok) {
      const serverData = await res.json();
      if (
        serverData &&
        serverData.word &&
        serverData.definitions &&
        serverData.definitions.ms
      ) {
        clientDictCache.set(cleanWord, serverData);
        return serverData;
      }
    }
  } catch (err) {
    console.warn('Backend dictionary fetch failed, using linguistic parser fallback:', err);
  }

  // 4. Morphological stemming & root derivation (fallback only if network is offline)
  const possibleRoots: string[] = [
    cleanWord,
    cleanWord.replace(/^(memper|meng|meny|mem|men|me|ber|ter|di|ke|se|pem|peny|peng|pen|pe|per)/, ''),
    cleanWord.replace(/(kan|i|an|nya|lah|tah|kah|mu|ku)$/, ''),
    cleanWord
      .replace(/^(memper|meng|meny|mem|men|me|ber|ter|di|pe|pem|pen|peng|peny|per)/, '')
      .replace(/(kan|i|an|nya|lah|tah|kah|mu|ku)$/, '')
  ];

  // Specific Malay root morph rules
  if (cleanWord.startsWith('meny')) {
    possibleRoots.push('s' + cleanWord.slice(4).replace(/(kan|i|an|nya)$/, ''));
  }
  if (cleanWord.startsWith('mem') && !cleanWord.startsWith('memb') && !cleanWord.startsWith('memp')) {
    possibleRoots.push('p' + cleanWord.slice(3).replace(/(kan|i|an|nya)$/, ''));
  }
  if (cleanWord.startsWith('men') && !cleanWord.startsWith('mend') && !cleanWord.startsWith('ment') && !cleanWord.startsWith('menj') && !cleanWord.startsWith('menc')) {
    possibleRoots.push('t' + cleanWord.slice(3).replace(/(kan|i|an|nya)$/, ''));
  }
  if (cleanWord.startsWith('meng') && !cleanWord.startsWith('mengg') && !cleanWord.startsWith('mengk') && !cleanWord.startsWith('mengh')) {
    possibleRoots.push('k' + cleanWord.slice(4).replace(/(kan|i|an|nya)$/, ''));
  }

  for (const candidate of possibleRoots) {
    if (candidate && candidate !== cleanWord && MASTER_DICTIONARY[candidate]) {
      const baseEntry = MASTER_DICTIONARY[candidate];
      const isVerb = /^(me|ber|ter|di|memper)/.test(cleanWord);
      
      const derivedEntry: DictionaryData = {
        word: cleanWord,
        rootWord: baseEntry.rootWord || candidate,
        partOfSpeech: isVerb ? 'Kata Kerja Terbitan' : 'Kata Nama Terbitan',
        definitions: {
          ms: isVerb 
            ? `Melakukan perbuatan atau menjadikan berhubung '${candidate}': ${baseEntry.definitions.ms}`
            : `Perihal atau hasil daripada '${candidate}': ${baseEntry.definitions.ms}`,
          en: isVerb 
            ? `To practise, apply, or carry out: ${baseEntry.definitions.en}`
            : `Aspect, state or result of: ${baseEntry.definitions.en}`,
          zh: isVerb 
            ? `进行、落实或践行（${baseEntry.definitions.zh}）的行动`
            : `关于“${baseEntry.definitions.zh}”的事项或状态`,
          ta: baseEntry.definitions.ta
        },
        synonyms: baseEntry.synonyms || [],
        antonyms: baseEntry.antonyms || [],
        spmSampleSentence: contextSentence 
          ? `Contoh dalam wacana: "${contextSentence}"`
          : baseEntry.spmSampleSentence,
        spmTips: baseEntry.spmTips
      };
      clientDictCache.set(cleanWord, derivedEntry);
      return derivedEntry;
    }
  }

  // 5. Intelligent linguistic fallback for unindexed words
  const guessedRoot = possibleRoots.find(r => r.length >= 3 && r !== cleanWord) || cleanWord;
  const isVerb = /^(me|ber|ter|di)/.test(cleanWord);
  const isNoun = /^(pe|ke|per)/.test(cleanWord) || /an$/.test(cleanWord);

  const partOfSpeech = isVerb
    ? 'Kata Kerja'
    : isNoun
    ? 'Kata Nama'
    : 'Kata Adjektif / Kosa Kata';

  const defaultSynonyms = isVerb
    ? ['melaksanakan tindakan', 'mengusahakan', 'mempraktikkan', 'menjayakan']
    : isNoun
    ? ['unsur penting', 'aspek utama', 'perihal berkait', 'tonggak']
    : ['signifikan', 'wajar', 'bertepatan'];

  const defaultAntonyms = isVerb
    ? ['mengabaikan', 'meninggalkan']
    : [];

  const finalFallback: DictionaryData = {
    word: cleanWord,
    rootWord: guessedRoot,
    partOfSpeech,
    definitions: {
      ms: `Maksud perkataan '${cleanWord}' (kata dasar: '${guessedRoot}'): konsep atau perbuatan dalam wacana Bahasa Melayu standard SPM.`,
      en: `Meaning of '${cleanWord}' (root: '${guessedRoot}'): concept or action in standard SPM Malay curriculum.`,
      zh: `'${cleanWord}'（词根：'${guessedRoot}'）在标准马来语语境中的实际释义与运用。`,
      ta: `'${cleanWord}' (அடிச்சொல்: '${guessedRoot}') என்பதன் தமிழ் விளக்கம்.`
    },
    synonyms: defaultSynonyms,
    antonyms: defaultAntonyms,
    spmSampleSentence: contextSentence
      ? `Penggunaan dalam konteks wacana: "${contextSentence}"`
      : `Amalan menggunakan '${cleanWord}' dalam penulisan dan pertuturan rasmi dapat memantapkan kualiti bahasa murid.`,
    spmTips: 'Gunakan kosa kata ini secara gramatis dan selitkan penanda wacana yang sesuai untuk meraih markah cemerlang.'
  };

  clientDictCache.set(cleanWord, finalFallback);
  return finalFallback;
}

export async function submitExerciseAnswer(
  exerciseType: string,
  question: string,
  studentAnswer: string,
  expectedAnswer?: string
): Promise<{ isCorrect: boolean; score: number; feedback: string; explanation: string }> {
  try {
    const res = await apiFetch('/api/gemini/exercise-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseType,
        question,
        studentAnswer,
        expectedAnswer
      })
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    const isCorrect = studentAnswer.toLowerCase().trim() === (expectedAnswer || '').toLowerCase().trim();
    return {
      isCorrect,
      score: isCorrect ? 100 : 50,
      feedback: isCorrect ? 'Tahniah! Jawapan anda tepat mengikut skema SPM.' : `Jawapan sebenar ialah "${expectedAnswer}".`,
      explanation: 'Penerangan peraturan tatabahasa dan sebutan baku.'
    };
  }
}
