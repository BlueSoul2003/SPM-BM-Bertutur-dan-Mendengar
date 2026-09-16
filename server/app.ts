import { metered, usageStatus, type AiFeature } from './usage.js';
import { billingRoutes } from './billing.js';
import { recoveryRoutes } from './recovery.js';
import express from 'express';
import path from 'path';
import { openDatabase, migrate, type Database } from './database.js';
import { PersistentSessions, accountRoutes, sharedRateLimit, route, importLegacy, digest } from './accounts.js';
import { listeningRoutes, cachedAttempt, recordAttempt } from './attempts.js';
import { getMalayAudioBuffer } from './tts.js';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Sessions, bearer, requireSession, rateLimit, concurrencyLimit, hashPassword, verifyPassword } from './security.js';
import { BUILTIN_DICTIONARY } from '../src/data/spmTopics.js';
import { KAMUS_SPM_LENGKAP } from '../src/data/kamusData.js';
import { getSpeakingModelAnswer } from '../src/data/spmModelAnswers.js';

export async function createApplication(options: { serverless?: boolean; databaseUrl?: string; database?: Database } = {}) {
dotenv.config();

const MASTER_SERVER_DICT: Record<string, any> = {
  ...BUILTIN_DICTIONARY,
  ...KAMUS_SPM_LENGKAP
};

const app = express();
const PORT = Number(process.env.PORT || 3000);
const databaseReady = (options.database ? Promise.resolve(options.database) : openDatabase(options.databaseUrl)).then(async db => {
  if (!options.serverless) await migrate(db);
  if (process.env.IMPORT_LEGACY_JSON === 'true') await importLegacy(db, path.join(process.env.DATA_DIR || 'data','users.json'));
  return db;
});
const routesReady = databaseReady.then(db => { const sessions=new PersistentSessions(db); return {...accountRoutes(db,sessions),db}; });
const authenticated = route(async(req,res,next) => (await routesReady).auth(req,res,next));
const sharedLimit = (scope: string,max: number,seconds: number) => {
  const handler=databaseReady.then(db=>sharedRateLimit(db,scope,max,seconds));
  return route(async(req,res,next)=>(await handler)(req,res,next));
};
app.disable('x-powered-by');
app.use('/api', sharedLimit('api',240,60));

const billingReady=routesReady.then(({db,auth})=>billingRoutes(db,auth));
app.use('/api',route(async(req,res,next)=>(await billingReady).webhook(req,res,next)));
app.use(express.json({ limit: '64kb' }));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
app.use(['/api/auth/register', '/api/auth/login'], sharedLimit('auth',20,900), concurrencyLimit(4));
app.use(['/api/gemini', '/api/tts'], authenticated, sharedLimit('ai',30,60), concurrencyLimit(8));
app.use(['/api/auth/update-profile', '/api/auth/sync-progress', '/api/leaderboard/sync'], authenticated);
app.use(['/api/admin/clear-all', '/api/leaderboard/reset', '/api/auth/google'], (_req, res) => { res.status(403).json({ error: 'Endpoint tidak tersedia.' }); });

app.use('/api', (req, res, next) => {
  const body = req.body;
  if (body && (typeof body !== 'object' || Array.isArray(body))) return res.status(400).json({ error: 'Permintaan tidak sah.' });
  for (const key of ['email', 'username', 'identifier', 'password', 'studentName', 'schoolName', 'state', 'avatar', 'name', 'school', 'text']) {
    if (body?.[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > (key === 'text' ? 5000 : 256))) return res.status(400).json({ error: 'Medan tidak sah.' });
  }
  next();
});

app.use(['/api/auth/forgot-password','/api/auth/reset-password'],sharedLimit('recovery',5,900),concurrencyLimit(4));
const recoveryReady=databaseReady.then(db=>recoveryRoutes(db));
app.use('/api',route(async(req,res,next)=>(await recoveryReady)(req,res,next)));
app.use('/api',route(async(req,res,next)=>(await billingReady).router(req,res,next)));
app.use('/api',route(async(req,res,next)=>(await routesReady).router(req,res,next)));
const listeningReady = routesReady.then(({db,auth})=>listeningRoutes(db,auth));
app.use('/api',route(async(req,res,next)=>(await listeningReady)(req,res,next)));

app.get('/api/usage', authenticated, route(async (_req,res)=>res.json(await usageStatus(await databaseReady,res.locals.userId))));

// Lazy initializer for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  // Student-facing deployments must use a provider approved for their audience.
  if (process.env.STUDENT_DIRECT_MODE !== 'false') return null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 20_000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Configurable model fallback with a bounded number of upstream attempts
const FAST_GEMINI_MODELS = (process.env.GEMINI_MODELS || 'gemini-flash-latest').split(',').map(m => m.trim()).filter(Boolean).slice(0, 2);

async function generateWithModelFallback(
  ai: GoogleGenAI,
  requestOptions: { contents: any; config?: any },
  userId: string, feature: AiFeature
) {
  return metered(await databaseReady,userId,feature,JSON.stringify([FAST_GEMINI_MODELS,requestOptions]),async()=>{
  let lastError: any = null;
  for (const model of FAST_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestOptions.contents,
        config: { ...requestOptions.config, maxOutputTokens: 4096 },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (feature === 'chat' && (typeof parsed.reply !== 'string' || !parsed.reply.trim() || !parsed.grammarAnalysis)) throw new Error('Invalid chat response');
      if (feature === 'speaking' && (!Number.isInteger(parsed.totalScore) || parsed.totalScore < 0 || parsed.totalScore > 40 || parsed.maxScore !== 40 || !parsed.rubricBreakdown)) throw new Error('Invalid assessment response');
      if (feature === 'dictionary' && typeof parsed.definitions?.ms !== 'string') throw new Error('Invalid dictionary response');
      if (feature === 'feedback' && (typeof parsed.isCorrect !== 'boolean' || typeof parsed.feedback !== 'string')) throw new Error('Invalid feedback response');
      return { text: response.text };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Model ${model} failed:`, err?.message?.slice(0, 100) || err);
    }
  }
  throw lastError;
  });
}

// In-memory dictionary cache to provide sub-millisecond responses and ensure consistency
const serverDictCache = new Map<string, any>();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Dedicated authentic Malaysian Malay TTS Audio Endpoint (GET)
app.get('/api/tts', async (req, res) => {
  try {
    const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
    if (!text || text.length > 5000) {
      return res.status(400).send('Parameter teks diperlukan.');
    }
    const audioBuffer = Buffer.from(await metered(await databaseReady,res.locals.userId,'audio',text,async()=>(await getMalayAudioBuffer(text)).toString('base64')),'base64');
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'private, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err: any) {
    if(err?.status===429)return res.status(429).json({error:err.message,code:err.code});
    console.error('TTS provider unavailable');
    res.status(503).send('Audio awan tidak tersedia. Cuba suara peranti.');
  }
});

// Dedicated authentic Malaysian Malay TTS Audio Endpoint (POST for long texts)
app.post('/api/tts', async (req, res) => {
  try {
    const text = (req.body.text as string || '').trim();
    if (!text || text.length > 5000) {
      return res.status(400).send('Parameter teks diperlukan.');
    }
    const audioBuffer = Buffer.from(await metered(await databaseReady,res.locals.userId,'audio',text,async()=>(await getMalayAudioBuffer(text)).toString('base64')),'base64');
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'private, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err: any) {
    if(err?.status===429)return res.status(429).json({error:err.message,code:err.code});
    console.error('TTS provider unavailable');
    res.status(503).send('Audio awan tidak tersedia. Cuba suara peranti.');
  }
});

// 1. AI Tutor Chat Endpoint with Grammar Analysis
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, tutorStyle = 'cikgu_ramah', topic } = req.body;
    if (!Array.isArray(messages) || messages.length<1 || messages.length>20 || messages.some(m=>!m || !['user','assistant'].includes(m.role) || typeof m.content!=='string' || m.content.length>4000)) return res.status(400).json({error:'Perbualan terlalu panjang atau tidak sah.'});
    const ai = getAIClient();

    if (!ai) return res.status(503).json({error:'Cikgu AI belum tersedia.'});

    const systemInstruction = `Anda ialah Cikgu Maya / Tutor Pintar Bahasa Melayu SPM untuk Ujian Bertutur KSSM 1103/3.
Tugas anda:
1. Berbual dengan murid dalam Bahasa Melayu standard (sebutan baku & tatabahasa tepat).
2. Bersikap ${tutorStyle === 'pemeriksa_tegas' ? 'tegas dan teliti seperti pemeriksa LPM SPM sebenar' : tutorStyle === 'peribahasa' ? 'sangat menitikberatkan penggunaan peribahasa dan ungkapan menarik' : 'ramah, membina semangat dan mendidik'}.
3. Galakkan murid memberi huraian idea yang matang (Formula: Isi + Mengapa + Bagaimana + Contoh + Kesan/Penyimpul - IMBaCK).
4. Buat analisis tatabahasa terperinci bagi mesej terakhir murid: kesan kesalahan ejaan, hukum D-M, imbuhan, kata sendi, kosa kata lemah, dan cadangkan kosa kata aras tinggi serta peribahasa yang sesuai.

Sila kembalikan respons dalam format JSON dengan struktur:
{
  "reply": "Mesej perbualan daripada cikgu (1-3 perenggan padat, membalas pandangan murid dan mengajukan soalan rangsangan seterusnya)",
  "grammarAnalysis": {
    "hasErrors": true/false,
    "corrections": [
      {
        "original": "frasa/ayat murid yang salah",
        "corrected": "frasa/ayat yang betul mengikut tatabahasa dewan",
        "explanation": "Penerangan ringkas peraturan tatabahasa (cth: Hukum D-M, Kata Sendi 'di' vs 'ke', imbuhan)"
      }
    ],
    "elevatedVocabulary": [
      {
        "original": "perkataan biasa yang digunakan murid",
        "suggestion": "kosa kata aras tinggi SPM (cth: maslahat, obligasi, sinergi, marhaen, seantero)",
        "context": "Cara menggunakannya dalam ayat berkaitan"
      }
    ],
    "proverbs": ["Peribahasa atau ungkapan menarik yang sangat padan dengan topik perbincangan ini"],
    "fluencyTip": "Tip kepetahan dan intonasi sebutan untuk SPM Ujian Bertutur"
  }
}`;

    const formattedHistory = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await generateWithModelFallback(ai, {
      contents: [
        { role: 'user', parts: [{ text: `Topik perbincangan: ${topic || 'Isu Remaja & SPM'}` }] },
        ...formattedHistory
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    }, res.locals.userId, 'chat');

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    if(error?.status===429)return res.status(429).json({error:error.message,code:error.code});
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Ralat memproses perbualan AI' });
  }
});

// 2. Mock Speaking Assessment Evaluation (LPM Rubric 1103/3)
app.post('/api/gemini/evaluate-speaking', async (req, res) => {
  try {
    const {
      stimulusTopic,
      stimulusContext,
      studentResponse,
      assessmentType = 'individu',
      questionAsked,
      topicId
    } = req.body;

    const curatedAnswer = getSpeakingModelAnswer(
      topicId || stimulusTopic,
      stimulusTopic,
      questionAsked,
      stimulusContext
    );

    if (typeof studentResponse !== 'string' || !studentResponse.trim() || studentResponse.length>12000 || typeof stimulusTopic !== 'string') return res.status(400).json({error:'Jawapan diperlukan.'});
    const db=await databaseReady;
    const inputHash=digest(JSON.stringify([topicId,stimulusTopic,stimulusContext,studentResponse,assessmentType,questionAsked]));
    const id='speaking:'+inputHash;
    const cached=await cachedAttempt(db,res.locals.userId,id);
    if(cached) return res.json({...cached,awarded:0});
    const ai = getAIClient();

    if (!ai) return res.status(503).json({ error: 'Penilaian AI belum tersedia. Sila cuba lagi kemudian.' });

    const systemInstruction = `Anda ialah Ketua Pentaksir Kebangsaan bagi Ujian Bertutur Bahasa Melayu KSSM SPM (Kod Kertas: 1103/3).
Tilai respon lisan murid berdasarkan Kriteria Pemarkahan Lembaga Peperiksaan Malaysia (LPM) 40 Markah penuh:
1. Tatabahasa & Kosa Kata (10 Markah)
2. Sebutan, Intonasi & Nada (10 Markah)
3. Kefasihan & Kelancaran (10 Markah)
4. Pengolahan Idea & Maklumat (10 Markah)

Peringkat Tahap Penguasaan:
- Cemerlang (35 - 40 Markah)
- Kepujian (29 - 34 Markah)
- Baik / Memuaskan (21 - 28 Markah)
- Penguasaan Terhad (13 - 20 Markah)
- Penguasaan Minimum (1 - 12 Markah)

Kembalikan penilaian dalam format JSON:
{
  "totalScore": number (1-40),
  "maxScore": 40,
  "band": "Cemerlang / Kepujian / Memuaskan / Penguasaan Terhad / Penguasaan Minimum",
  "rubricBreakdown": {
    "tatabahasaKosaKata": { "score": number (1-10), "max": 10, "feedback": "Komen terperinci" },
    "sebutanIntonasi": { "score": number (1-10), "max": 10, "feedback": "Komen terperinci" },
    "kefasihanKelancaran": { "score": number (1-10), "max": 10, "feedback": "Komen terperinci" },
    "pengolahanIdea": { "score": number (1-10), "max": 10, "feedback": "Komen terperinci" }
  },
  "strengths": ["Kekuatan 1", "Kekuatan 2", "Kekuatan 3"],
  "improvements": ["Cadangan penambahbaikan 1", "Cadangan penambahbaikan 2"],
  "grammarErrors": [
    { "original": "frasa silap", "corrected": "frasa betul", "rule": "hukum tatabahasa" }
  ],
  "exemplarAnswer": "Contoh jawapan cemerlang SPM (Model Answer Gred A+) yang KHUSUS dan TEPAT menjawab soalan yang ditanya",
  "examinerSummary": "Ulasan keseluruhan daripada Ketua Pentaksir"
}`;

    const prompt = `Nilai respon murid berikut bagi Ujian Bertutur SPM 1103/3 mengikut format Lembaga Peperiksaan Malaysia (LPM):
Jenis Taksiran: ${assessmentType}
Tema / Tajuk Rangsangan: ${stimulusTopic}
Soalan Pentaksir SPM Yang Dijawab: "${questionAsked || stimulusTopic}"
Konteks / Bahan Rangsangan: ${stimulusContext}

Respon / Pertuturan Murid:
"""${studentResponse}"""

SYARAT MANDATORI BAGI "exemplarAnswer":
Anda WAJIB menyediakan SATU contoh jawapan murid aras CEMERLANG (Model Answer Gred A+, 38-40 Markah) yang KHUSUS, TEPAT dan LENGKAP menjawab soalan pentaksir: "${questionAsked || stimulusTopic}".
Jawapan mestilah:
1. 100% relevan dan menjawab terus soalan: "${questionAsked || stimulusTopic}".
2. Mengandungi sekurang-kurangnya 2 isi bernas beserta huraian mendalam dan contoh konkrit.
3. Menyertakan peribahasa Melayu yang amat tepat dengan tema ini.
4. Menggunakan kosa kata aras tinggi dan penanda wacana yang gramatis.
5. JANGAN sesekali mengulang templat umum atau jawapan yang tidak berkaitan dengan soalan!
Rujukan Skema Asas yang diterima:
"""${curatedAnswer}"""`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    }, res.locals.userId, 'speaking');

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.exemplarAnswer || parsed.exemplarAnswer.length < 60) {
      parsed.exemplarAnswer = curatedAnswer;
    }
    if (!Number.isInteger(parsed.totalScore) || parsed.totalScore<0 || parsed.totalScore>40 || parsed.maxScore!==40 || !parsed.rubricBreakdown) throw new Error('Invalid assessment output');
    res.json(await recordAttempt(db,res.locals.userId,id,'speaking',topicId||stimulusTopic,inputHash,parsed,50+(parsed.totalScore>=32?25:0)));
  } catch (error: any) {
    if(error?.status===429)return res.status(429).json({error:error.message,code:error.code});
    console.error('Evaluate speaking error:', error);
    res.status(503).json({ error: 'Penilaian AI tidak tersedia. Sila cuba lagi.' });
  }
});

// 3. Instant Multi-language Dictionary & Vocabulary Lookup
app.post('/api/gemini/dictionary', async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    const cleanWord = (word || '').toLowerCase().replace(/[^a-zA-Z\u00C0-\u024F\-]/g, '').trim();

    if (!cleanWord) {
      return res.status(400).json({ error: 'Perkataan diperlukan' });
    }

    // 1. Check server-side memory cache first
    if (serverDictCache.has(cleanWord)) {
      return res.json(serverDictCache.get(cleanWord));
    }

    // 2. Check curated master dictionary for an EXACT word match
    if (MASTER_SERVER_DICT[cleanWord]) {
      const match = MASTER_SERVER_DICT[cleanWord];
      serverDictCache.set(cleanWord, match);
      return res.json(match);
    }

    const ai = getAIClient();

    if (ai) {
      try {
        const systemInstruction = `Anda ialah Pakar Leksikografi Bahasa Melayu Dewan Bahasa dan Pustaka (DBP) serta Guru Cemerlang SPM.
Tugas anda: Berikan takrifan dan terjemahan yang PALING TEPAT, JELAS, dan LENGKAP bagi perkataan atau frasa Bahasa Melayu yang diberikan, bersandarkan konteks penggunaannya dalam peperiksaan SPM.

PANDUAN KETEPATAN MAKSUD:
1. JIKA PERKATAAN MEMPUNYAI IMBUHAN (contoh: "memperkasakan", "berkesan", "mengamalkan", "kebersihan", "meningkatkan", "pentaksir"):
   - Berikan maksud KHUSUS bagi bentuk terbitan tersebut, BUKAN sekadar kata dasarnya!
   - Contoh: "memperkasakan" -> Maksud: "Menjadikan hebat, kuat, atau berwibawa; memperkukuh atau memperhebat sesuatu." (Bukan sekadar "perkasa").
   - Contoh: "berkesan" -> Maksud: "Mendatangkan hasil atau impak yang positif; mujarab; efektif." (Bukan sekadar "kesan").
2. "definitions.ms": Takrifan Bahasa Melayu Kamus Dewan DBP yang terang, mendalam dan mudah difahami murid.
3. "definitions.en": Terjemahan bahasa Inggeris yang tepat, semula jadi dan profesional (contoh: "memperkasakan" -> "To empower, strengthen, enhance, or consolidate").
4. "definitions.zh": 准确通顺的中文释义与翻译（例如："memperkasakan" -> "强化、加强、巩固或赋能"；"berkesan" -> "有效的、奏效的、产生良好成效的"）。
5. "definitions.ta": துல்லியமான தமிழ் விளக்கம் மற்றும் மொழிபெயர்ப்பு.
6. "rootWord": Kata dasar perkataan (tanpa imbuhan).
7. "partOfSpeech": Golongan kata (Kata Nama / Kata Kerja Transitif / Kata Kerja Tak Transitif / Kata Adjektif / Kata Tugas / Kata Hubung / Peribahasa).
8. "synonyms": 3-5 kosa kata setara atau bersinonim aras tinggi SPM.
9. "antonyms": 1-3 perkataan berlawanan maksud (atau senarai kosong [] jika tiada lawan kata).
10. "spmSampleSentence": Contoh ayat SPM aras cemerlang yang gramatis dan relevan dengan isu semasa / tema SPM.
11. "spmTips": Panduan khas cara menggunakan kosa kata ini secara efektif dalam Kertas 1103/1 (Karangan) atau 1103/3 (Ujian Bertutur).

Format WAJIB JSON:
{
  "word": "${cleanWord}",
  "rootWord": "kata dasar",
  "partOfSpeech": "golongan kata",
  "definitions": {
    "ms": "takrifan Kamus Dewan yang tepat",
    "en": "accurate English translation and meaning",
    "zh": "准确通顺的中文释义",
    "ta": "துல்லியமான தமிழ் விளக்கம்"
  },
  "synonyms": ["sinonim 1", "sinonim 2", "sinonim 3"],
  "antonyms": ["antonim 1", "antonim 2"],
  "spmSampleSentence": "ayat contoh SPM berimpak tinggi",
  "spmTips": "tip SPM"
}`;

        const prompt = `Perkataan: "${cleanWord}"\nKonteks ayat penggunaan: "${contextSentence || ''}"`;

        const response = await generateWithModelFallback(ai, {
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          }
        }, res.locals.userId, 'dictionary');

        const parsed = JSON.parse(response.text || '{}');
        if (parsed && parsed.definitions && parsed.definitions.ms) {
          // Normalize and save in cache
          const normalizedResult = {
            word: cleanWord,
            rootWord: parsed.rootWord || cleanWord,
            partOfSpeech: parsed.partOfSpeech || 'Kosa Kata SPM',
            definitions: {
              ms: parsed.definitions.ms || `Maksud bagi perkataan '${cleanWord}'.`,
              en: parsed.definitions.en || parsed.definitions.ms,
              zh: parsed.definitions.zh || parsed.definitions.en || parsed.definitions.ms,
              ta: parsed.definitions.ta || parsed.definitions.en || parsed.definitions.ms,
            },
            synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
            antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
            spmSampleSentence: parsed.spmSampleSentence || (contextSentence ? `Contoh dalam wacana: "${contextSentence}"` : `Amalan '${cleanWord}' wajar dibudayakan dalam masyarakat.`),
            spmTips: parsed.spmTips || 'Gunakan kosa kata ini secara tepat mengikut laras bahasa formal SPM.'
          };

          serverDictCache.set(cleanWord, normalizedResult);
          return res.json(normalizedResult);
        }
      } catch (geminiErr) {
        console.warn('Gemini dictionary lookup failed, falling back to linguistic parser:', geminiErr);
      }
    }

    // 3. Intelligent linguistic fallback with morphological semantic rules
    const possibleRoots = [
      cleanWord,
      cleanWord.replace(/^(memper|meng|meny|mem|men|me|ber|ter|di|ke|se|pem|peny|peng|pen|pe|per)/, ''),
      cleanWord.replace(/(kan|i|an|nya|lah|tah|kah|mu|ku)$/, ''),
      cleanWord.replace(/^(memper|meng|meny|mem|men|me|ber|ter|di|pe|pem|pen|peng|peny|per)/, '').replace(/(kan|i|an|nya|lah|tah|kah|mu|ku)$/, '')
    ];

    // Check if any root exists in dictionary
    for (const r of possibleRoots) {
      if (r && r !== cleanWord && MASTER_SERVER_DICT[r]) {
        const base = MASTER_SERVER_DICT[r];
        const isVerb = /^(me|ber|ter|di|memper)/.test(cleanWord);
        const fallbackEntry = {
          word: cleanWord,
          rootWord: base.rootWord || r,
          partOfSpeech: isVerb ? 'Kata Kerja Terbitan' : 'Kata Nama Terbitan',
          definitions: {
            ms: isVerb 
              ? `Melakukan perbuatan atau menjadikan berhubung '${r}': ${base.definitions.ms}`
              : `Perihal atau hasil daripada '${r}': ${base.definitions.ms}`,
            en: isVerb ? `To practise, apply, or carry out ${base.definitions.en}` : `Aspect or condition of ${base.definitions.en}`,
            zh: isVerb ? `进行、落实或关于“${base.definitions.zh}”的行动` : `关于“${base.definitions.zh}”的方面或状态`,
            ta: base.definitions.ta || `தொடர்புடைய சொல் '${r}'`
          },
          synonyms: base.synonyms || [],
          antonyms: base.antonyms || [],
          spmSampleSentence: contextSentence || base.spmSampleSentence,
          spmTips: base.spmTips || 'Gunakan kata terbitan ini untuk memperkukuh wacana formal SPM.'
        };
        serverDictCache.set(cleanWord, fallbackEntry);
        return res.json(fallbackEntry);
      }
    }

    const guessedRoot = possibleRoots.find(r => r.length >= 3 && r !== cleanWord) || cleanWord;
    const isVerb = /^(me|ber|ter|di)/.test(cleanWord);
    const defaultEntry = {
      word: cleanWord,
      rootWord: guessedRoot,
      partOfSpeech: isVerb ? "Kata Kerja" : "Kata Nama / Kosa Kata",
      definitions: {
        ms: `Maksud perkataan '${cleanWord}' (kata dasar: '${guessedRoot}'): perbuatan atau perkara yang berkaitan dalam wacana Bahasa Melayu SPM.`,
        en: `Meaning of '${cleanWord}' (root: '${guessedRoot}'): action or subject matter in formal Malay discourse.`,
        zh: `'${cleanWord}'（词根：'${guessedRoot}'）在标准马来语语境中的实际含义与运用。`,
        ta: `'${cleanWord}' (அடிச்சொல்: '${guessedRoot}') என்பதன் தமிழ் விளக்கம்.`
      },
      synonyms: isVerb 
        ? ["melaksanakan", "mengusahakan", "mempraktikkan", "menjayakan"]
        : ["elemen penting", "tonggak utama", "aspek signifikan"],
      antonyms: isVerb ? ["mengabaikan", "meninggalkan"] : [],
      spmSampleSentence: contextSentence
        ? `Contoh dalam wacana: "${contextSentence}"`
        : `Penggunaan perkataan '${cleanWord}' dalam wacana SPM memantapkan kualiti huraian calon.`,
      spmTips: "Gunakan kosa kata ini secara gramatis bagi membina ayat majmuk berimpak tinggi."
    };

    serverDictCache.set(cleanWord, defaultEntry);
    res.json(defaultEntry);
  } catch (error: any) {
    if(error?.status===429)return res.status(429).json({error:error.message,code:error.code});
    console.error('Dictionary error:', error);
    res.status(500).json({ error: error.message || 'Ralat mencari takrifan perkataan' });
  }
});

// 4. Interactive Exercise Feedback
app.post('/api/gemini/exercise-feedback', async (req, res) => {
  try {
    const { exerciseType, question, studentAnswer, expectedAnswer } = req.body;
    const ai = getAIClient();

    if (!ai) {
      const isCorrect = studentAnswer?.toLowerCase()?.trim() === expectedAnswer?.toLowerCase()?.trim();
      return res.json({
        isCorrect,
        score: isCorrect ? 100 : 60,
        feedback: isCorrect ? "Tahniah! Jawapan anda tepat dan mematuhi hukum tatabahasa SPM." : `Jawapan yang lebih tepat ialah "${expectedAnswer}".`,
        explanation: "Penerangan tatabahasa ringkas.",
        improvedSentence: studentAnswer
      });
    }

    const systemInstruction = `Anda ialah guru pakar Bahasa Melayu SPM.
Nilai latihan murid dan berikan maklum balas membina serta markah/status ketepatan.
Format JSON:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": "Maklum balas ringkas dan membina",
  "explanation": "Penerangan tatabahasa / sebutan / kosa kata terperinci",
  "improvedSentence": "Ayat yang telah diperkemas (jika berkenaan)"
}`;

    const prompt = `Jenis Latihan: ${exerciseType}
Soalan / Rangsangan: ${question}
Jawapan Murid: ${studentAnswer}
Skema / Jawapan Disasarkan: ${expectedAnswer || 'N/A'}`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    }, res.locals.userId, 'feedback');

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    if(error?.status===429)return res.status(429).json({error:error.message,code:error.code});
    console.error('Exercise feedback error:', error);
    res.status(500).json({ error: error.message || 'Ralat memeriksa latihan' });
  }
});

app.use('/api', (_req,res)=>res.status(404).json({error:'Endpoint tidak dijumpai.'}));
app.use(((error:any,_req:any,res:any,_next:any)=>{ if(!error.status || error.status>=500)console.error('API request failed',String(error.code || error.name || 'unknown').replace(/[^A-Za-z0-9_-]/g,'')); return res.status(error.status || 500).json({error:error.status && error.status < 500 ? error.message : 'Ralat pelayan. Sila cuba lagi.'}); }) as express.ErrorRequestHandler);

// Vite Middleware for development & static serving for production
async function startServer() {
  const db=await databaseReady;
  const cleanup=setInterval(()=>{void db.query('DELETE FROM rate_buckets WHERE expires_at < now()').catch(()=>console.error('Quota cleanup failed'));void db.query('DELETE FROM sessions WHERE expires_at < now()').catch(()=>{});void db.query('DELETE FROM reset_tokens WHERE expires_at < now()').catch(()=>{});},60_000);
  cleanup.unref();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listener=app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    console.log(`SPM BM Prep Server running on port ${PORT}`);
  });
  const stop=()=>{clearInterval(cleanup);listener.close(()=>{void db.close().then(()=>process.exit(0));});setTimeout(()=>process.exit(1),10000).unref();};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}

await databaseReady;
if (!options.serverless) await startServer();
return app;
}
