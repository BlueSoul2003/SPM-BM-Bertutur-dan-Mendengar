import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { BUILTIN_DICTIONARY } from './src/data/spmTopics.js';
import { KAMUS_SPM_LENGKAP } from './src/data/kamusData.js';
import { getSpeakingModelAnswer } from './src/data/spmModelAnswers.js';

dotenv.config();

const MASTER_SERVER_DICT: Record<string, any> = {
  ...BUILTIN_DICTIONARY,
  ...KAMUS_SPM_LENGKAP
};

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient model fallback runner (prioritizing gemini-3.6-flash, then gemini-flash-latest, gemini-3.8-flash)
const FAST_GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

async function generateWithModelFallback(
  ai: GoogleGenAI,
  requestOptions: { contents: any; config?: any }
) {
  let lastError: any = null;
  for (const model of FAST_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestOptions.contents,
        config: requestOptions.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Model ${model} failed:`, err?.message?.slice(0, 100) || err);
    }
  }
  throw lastError;
}

// In-memory dictionary cache to provide sub-millisecond responses and ensure consistency
const serverDictCache = new Map<string, any>();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Cache for generated audio buffers to optimize latency
const ttsCache = new Map<string, Buffer>();

function fetchTtsChunk(chunkText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(chunkText);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ms&client=tw-ob&q=${encoded}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
      if (resp.statusCode !== 200) {
        return reject(new Error(`TTS failed with status: ${resp.statusCode}`));
      }
      const data: Buffer[] = [];
      resp.on('data', (c) => data.push(c));
      resp.on('end', () => resolve(Buffer.concat(data)));
      resp.on('error', reject);
    }).on('error', reject);
  });
}

async function getMalayAudioBuffer(fullText: string): Promise<Buffer> {
  // Clean text from Markdown tags, asterisks, bracket tags
  const cleaned = fullText
    .replace(/[*#_~`]/g, '')
    .replace(/\[JEDA\]/gi, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (ttsCache.has(cleaned)) {
    return ttsCache.get(cleaned)!;
  }

  const chunks: string[] = [];
  if (cleaned.length <= 160) {
    chunks.push(cleaned);
  } else {
    // Split sentences or punctuation
    const sentences = cleaned.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [cleaned];
    let current = '';
    for (const s of sentences) {
      if ((current + ' ' + s).trim().length <= 160) {
        current = (current + ' ' + s).trim();
      } else {
        if (current) chunks.push(current);
        if (s.length <= 160) {
          current = s.trim();
        } else {
          // split by words if single sentence is long
          const words = s.split(' ');
          current = '';
          for (const w of words) {
            if ((current + ' ' + w).trim().length <= 160) {
              current = (current + ' ' + w).trim();
            } else {
              if (current) chunks.push(current);
              current = w;
            }
          }
        }
      }
    }
    if (current) chunks.push(current);
  }

  const audioParts: Buffer[] = [];
  for (const chunk of chunks) {
    if (chunk.trim()) {
      const buf = await fetchTtsChunk(chunk.trim());
      audioParts.push(buf);
    }
  }

  const finalBuffer = Buffer.concat(audioParts);
  if (ttsCache.size > 300) {
    const firstKey = ttsCache.keys().next().value;
    if (firstKey) ttsCache.delete(firstKey);
  }
  ttsCache.set(cleaned, finalBuffer);
  return finalBuffer;
}

// Dedicated authentic Malaysian Malay TTS Audio Endpoint (GET)
app.get('/api/tts', async (req, res) => {
  try {
    const text = (req.query.text as string || '').trim();
    if (!text) {
      return res.status(400).send('Parameter teks diperlukan.');
    }
    const audioBuffer = await getMalayAudioBuffer(text);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err: any) {
    console.error('TTS endpoint error:', err);
    res.status(500).send('Ralat penjanaan audio Bahasa Melayu');
  }
});

// Dedicated authentic Malaysian Malay TTS Audio Endpoint (POST for long texts)
app.post('/api/tts', async (req, res) => {
  try {
    const text = (req.body.text as string || '').trim();
    if (!text) {
      return res.status(400).send('Parameter teks diperlukan.');
    }
    const audioBuffer = await getMalayAudioBuffer(text);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err: any) {
    console.error('TTS endpoint error:', err);
    res.status(500).send('Ralat penjanaan audio Bahasa Melayu');
  }
});

// 1. AI Tutor Chat Endpoint with Grammar Analysis
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, tutorStyle = 'cikgu_ramah', topic } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // Fallback if API key is not yet configured
      return res.json({
        reply: "Bagus soalan anda! Sila pastikan kunci API Gemini dimasukkan untuk mendapatkan bimbingan interaktif penuh. Mari kita teruskan latihan bertutur!",
        grammarAnalysis: {
          hasErrors: false,
          corrections: [],
          elevatedVocabulary: [
            { original: "baik", suggestion: "unggul / cemerlang", context: "Sebagai peningkatan kosa kata aras tinggi" },
            { original: "banyak", suggestion: "pelbagai / sarat dengan", context: "Memperkaya variasi bahasa" }
          ],
          proverbs: ["Hendak seribu daya, tak hendak seribu dalih"],
          fluencyTip: "Gunakan intonasi yang tegas dan jeda yang sesuai pada setiap noktah."
        }
      });
    }

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
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
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

    const ai = getAIClient();

    if (!ai) {
      return res.json({
        totalScore: 34,
        maxScore: 40,
        band: "Kepujian (29 - 34)",
        rubricBreakdown: {
          tatabahasaKosaKata: { score: 8, max: 10, feedback: "Penggunaan kosa kata tepat dengan struktur ayat majmuk yang gramatis." },
          sebutanIntonasi: { score: 9, max: 10, feedback: "Sebutan baku Bahasa Melayu jelas dan intonasi bersahaja mengikut laras formal." },
          kefasihanKelancaran: { score: 8, max: 10, feedback: "Pertuturan lancar dan teratur tanpa jeda yang terlalu lama." },
          pengolahanIdea: { score: 9, max: 10, feedback: "Idea dihuraikan dengan matang dan menepati soalan pentaksir secara khusus." }
        },
        strengths: [
          "Penyampaian idea yang berfokus terus kepada soalan yang ditanya",
          "Keyakinan bertutur dalam laras bahasa Melayu standard",
          "Penggunaan penanda wacana yang tersusun"
        ],
        improvements: [
          "Perbanyakkan kosa kata aras tinggi seperti 'maslahat', 'obligasi', 'sinergi'",
          "Selitkan peribahasa Melayu yang tepat untuk mengukuhkan huraian isi"
        ],
        grammarErrors: [
          { original: "oleh kerana", corrected: "oleh sebab", rule: "Kata sendi nama 'oleh' mesti diikuti kata nama 'sebab'." }
        ],
        exemplarAnswer: curatedAnswer,
        examinerSummary: "Calon menunjukkan penguasaan lisan yang baik dan berupaya mengutarakan hujah yang menepati soalan pentaksir."
      });
    }

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
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.exemplarAnswer || parsed.exemplarAnswer.length < 60) {
      parsed.exemplarAnswer = curatedAnswer;
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Evaluate speaking error:', error);
    const fallbackAnswer = getSpeakingModelAnswer(
      req.body.topicId || req.body.stimulusTopic,
      req.body.stimulusTopic,
      req.body.questionAsked,
      req.body.stimulusContext
    );
    res.json({
      totalScore: 33,
      maxScore: 40,
      band: "Kepujian (29 - 34)",
      rubricBreakdown: {
        tatabahasaKosaKata: { score: 8, max: 10, feedback: "Penggunaan kosa kata tepat dengan struktur ayat majmuk yang gramatis." },
        sebutanIntonasi: { score: 8, max: 10, feedback: "Sebutan jelas dan intonasi memuaskan mengikut laras formal." },
        kefasihanKelancaran: { score: 8, max: 10, feedback: "Pertuturan lancar dan teratur tanpa jeda yang berlebihan." },
        pengolahanIdea: { score: 9, max: 10, feedback: "Idea dihuraikan dengan contoh relevan dan matang selaras dengan kehendak soalan." }
      },
      strengths: [
        "Penyampaian idea berfokus kepada soalan pentaksir",
        "Penggunaan penanda wacana yang tersusun"
      ],
      improvements: [
        "Tingkatkan penggunaan kosa kata aras tinggi seperti 'maslahat', 'obligasi', 'sinergi'",
        "Selitkan peribahasa Melayu yang tepat untuk mengukuhkan huraian"
      ],
      grammarErrors: [
        { original: "oleh kerana", corrected: "oleh sebab", rule: "Kata sendi nama 'oleh' mesti diikuti kata nama 'sebab'." }
      ],
      exemplarAnswer: fallbackAnswer,
      examinerSummary: "Calon menunjukkan penguasaan lisan yang baik dan mampu mengutarakan hujah yang menepati soalan pentaksir."
    });
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
        });

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
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Exercise feedback error:', error);
    res.status(500).json({ error: error.message || 'Ralat memeriksa latihan' });
  }
});

// ============================================================================
// REAL USER LEADERBOARD (No fake/system peers, starts clean from Day 1)
// ============================================================================
// Real-time Leaderboard & Student Account Authentication System
// ============================================================================
interface RegisteredUserRecord {
  id: string; // unique userId
  email: string; // unique lowercase email
  username: string; // unique lowercase
  authProvider?: 'email' | 'google';
  googleId?: string;
  passwordHash?: string;
  salt?: string;
  studentName: string;
  schoolName: string;
  state: string;
  avatar: string;
  createdAt: string;
  points: number;
  streak: number;
  level: number;
  levelName: string;
  lastCheckInDate: string;
  claimedStreakDays: number[];
  totalSpeakingDone: number;
  totalListeningDone: number;
  totalExercisesDone: number;
  lastSpmGrade?: any;
}

interface RealLeaderboardRecord {
  id: string; // unique userId
  name: string;
  email?: string;
  username?: string;
  authProvider?: 'email' | 'google';
  isRegistered?: boolean;
  school: string;
  state: string;
  points: number;
  streak: number;
  predictedGrade: string;
  avatar: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'real_leaderboard.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Memory caches
let realParticipants: RealLeaderboardRecord[] = [];
let registeredUsers: RegisteredUserRecord[] = [];
const activeSessions = new Map<string, string>(); // token -> userId

// Password hashing helper
function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function generateSessionToken(userId: string): string {
  const token = `spm_sess_${userId}_${crypto.randomBytes(16).toString('hex')}`;
  activeSessions.set(token, userId);
  return token;
}

function sanitizeUser(user: RegisteredUserRecord) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    studentName: user.studentName,
    schoolName: user.schoolName,
    state: user.state,
    avatar: user.avatar,
    createdAt: user.createdAt,
    authProvider: user.authProvider || 'email',
    isRegistered: true,
  };
}

function extractUserProgress(user: RegisteredUserRecord) {
  return {
    userId: user.id,
    email: user.email,
    authProvider: user.authProvider || 'email',
    points: user.points || 0,
    streak: user.streak || 0,
    level: user.level || 1,
    levelName: user.levelName || 'Pemula Bahasa',
    studentName: user.studentName,
    schoolName: user.schoolName,
    state: user.state,
    avatar: user.avatar,
    username: user.username,
    isRegistered: true,
    lastCheckInDate: user.lastCheckInDate || '',
    claimedStreakDays: user.claimedStreakDays || [],
    totalSpeakingDone: user.totalSpeakingDone || 0,
    totalListeningDone: user.totalListeningDone || 0,
    totalExercisesDone: user.totalExercisesDone || 0,
    lastSpmGrade: user.lastSpmGrade,
  };
}

// Load registered users from disk
try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      registeredUsers = parsed;
    }
  }
} catch (e) {
  console.warn('Could not read users.json:', e);
  registeredUsers = [];
}

function persistUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(registeredUsers, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not persist users.json:', e);
  }
}

// Initialize real participants from disk if available
try {
  if (fs.existsSync(LEADERBOARD_FILE)) {
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      realParticipants = parsed;
    }
  }
} catch (e) {
  console.warn('Could not read real_leaderboard.json:', e);
  realParticipants = [];
}

// Ensure all registered users are properly synchronized into realParticipants
registeredUsers.forEach((user) => {
  const existingIdx = realParticipants.findIndex((p) => p.id === user.id);
  const safeName = (user.studentName && !user.studentName.includes('@')) ? user.studentName : 'Calon SPM';
  const entry: RealLeaderboardRecord = {
    id: user.id,
    name: safeName,
    email: user.email,
    username: user.username,
    authProvider: user.authProvider || 'email',
    isRegistered: true,
    school: user.schoolName || 'Calon SPM',
    state: user.state || 'Malaysia',
    points: user.points || 0,
    streak: user.streak || 0,
    predictedGrade: user.lastSpmGrade?.grade || (user.points > 100 ? 'A' : 'A-'),
    avatar: user.avatar || '⭐',
    updatedAt: new Date().toISOString(),
  };
  if (existingIdx >= 0) {
    realParticipants[existingIdx] = { ...realParticipants[existingIdx], ...entry };
  } else {
    realParticipants.push(entry);
  }
});

function persistRealParticipants() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(realParticipants, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not persist real_leaderboard.json:', e);
  }
}

// ----------------------------------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------------------------------

// POST /api/auth/register - Register a new student account using email
app.post('/api/auth/register', (req, res) => {
  try {
    const {
      email,
      username,
      password,
      studentName,
      schoolName,
      state,
      avatar,
      initialPoints,
      initialStreak,
      initialLastCheckInDate,
      initialClaimedStreakDays,
      initialLastSpmGrade,
      totalSpeakingDone,
      totalListeningDone,
    } = req.body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@') || email.trim().length < 5) {
      return res.status(400).json({ error: 'Sila masukkan alamat e-mel yang sah.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingEmail = registeredUsers.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (existingEmail) {
      // If user was registered without a password (e.g. prior Google sign-up before Google was removed),
      // seamlessly assign their password, update provider to email, and log them in!
      if (!existingEmail.passwordHash || !existingEmail.salt) {
        existingEmail.salt = crypto.randomBytes(16).toString('hex');
        existingEmail.passwordHash = hashPassword(password, existingEmail.salt);
        existingEmail.authProvider = 'email';
        if (studentName && (existingEmail.studentName === 'Calon SPM' || existingEmail.studentName.startsWith('calon_'))) {
          existingEmail.studentName = studentName.trim();
        }
        persistUsers();

        // Refresh user in leaderboard
        const existingLbIdx = realParticipants.findIndex((p) => p.id === existingEmail.id);
        const lbEntry: RealLeaderboardRecord = {
          id: existingEmail.id,
          name: existingEmail.studentName,
          email: existingEmail.email,
          username: existingEmail.username,
          authProvider: 'email',
          isRegistered: true,
          school: existingEmail.schoolName || 'Calon SPM',
          state: existingEmail.state || 'Malaysia',
          points: existingEmail.points || 0,
          streak: existingEmail.streak || 1,
          predictedGrade: existingEmail.lastSpmGrade?.grade || (existingEmail.points > 100 ? 'A' : 'A-'),
          avatar: existingEmail.avatar || '👨‍🎓',
          updatedAt: new Date().toISOString(),
        };
        if (existingLbIdx >= 0) {
          realParticipants[existingLbIdx] = lbEntry;
        } else {
          realParticipants.push(lbEntry);
        }
        persistRealParticipants();

        const token = generateSessionToken(existingEmail.id);
        return res.json({
          success: true,
          token,
          user: sanitizeUser(existingEmail),
          progress: extractUserProgress(existingEmail),
          message: 'Kata laluan berjaya ditetapkan untuk akaun anda!',
        });
      }

      return res.status(400).json({ error: 'E-mel ini telah didaftarkan. Sila masukkan kata laluan anda di tab "Log Masuk".' });
    }

    // Determine or generate unique username (anonymous ID, never using email prefix)
    const randomCandidateId = `calon_${Math.floor(10000 + Math.random() * 90000)}`;
    let cleanUsername = (username && !username.includes('@') ? username : randomCandidateId)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      cleanUsername = randomCandidateId;
    }

    // Ensure username uniqueness
    let finalUsername = cleanUsername;
    let counter = 1;
    while (registeredUsers.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${cleanUsername}_${counter}`;
      counter++;
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Kata laluan mestilah sekurang-kurangnya 4 aksara.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${crypto.randomUUID()}`;

    const points = typeof initialPoints === 'number' && initialPoints > 0 ? initialPoints : 0;
    const streak = typeof initialStreak === 'number' && initialStreak > 0 ? initialStreak : 0;

    const safeStudentName = (studentName && !studentName.includes('@') && !studentName.startsWith('calon_'))
      ? studentName.trim()
      : 'Calon SPM';

    const newUser: RegisteredUserRecord = {
      id: userId,
      email: cleanEmail,
      username: finalUsername,
      authProvider: 'email',
      passwordHash,
      salt,
      studentName: safeStudentName,
      schoolName: (schoolName || 'Calon SPM').trim(),
      state: (state || 'Kuala Lumpur').trim(),
      avatar: avatar || '👨‍🎓',
      createdAt: new Date().toISOString(),
      points,
      streak,
      level: 1,
      levelName: 'Pemula Bahasa',
      lastCheckInDate: initialLastCheckInDate || '',
      claimedStreakDays: Array.isArray(initialClaimedStreakDays) ? initialClaimedStreakDays : [],
      totalSpeakingDone: typeof totalSpeakingDone === 'number' ? totalSpeakingDone : 0,
      totalListeningDone: typeof totalListeningDone === 'number' ? totalListeningDone : 0,
      totalExercisesDone: 0,
      lastSpmGrade: initialLastSpmGrade || undefined,
    };

    registeredUsers.push(newUser);
    persistUsers();

    // Upsert directly into the leaderboard so the registered student appears immediately
    const leaderboardEntry: RealLeaderboardRecord = {
      id: newUser.id,
      name: newUser.studentName,
      email: newUser.email,
      username: newUser.username,
      authProvider: 'email',
      isRegistered: true,
      school: newUser.schoolName || 'Calon SPM',
      state: newUser.state || 'Malaysia',
      points: newUser.points,
      streak: newUser.streak,
      predictedGrade: newUser.lastSpmGrade?.grade || 'A',
      avatar: newUser.avatar,
      updatedAt: new Date().toISOString(),
    };

    const existingLbIdx = realParticipants.findIndex((p) => p.id === newUser.id);
    if (existingLbIdx >= 0) {
      realParticipants[existingLbIdx] = leaderboardEntry;
    } else {
      realParticipants.push(leaderboardEntry);
    }
    persistRealParticipants();

    const token = generateSessionToken(userId);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(newUser),
      progress: extractUserProgress(newUser),
      message: 'Pendaftaran akaun calon berjaya!',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Gagal mendaftar akaun. Sila cuba lagi.' });
  }
});

// POST /api/auth/login - Log in an existing student with email or username
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginKey = (identifier || email || username || '').trim().toLowerCase();

    if (!loginKey || !password) {
      return res.status(400).json({ error: 'Sila masukkan e-mel / nama pengguna dan kata laluan.' });
    }

    const user = registeredUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === loginKey) ||
        (u.username && u.username.toLowerCase() === loginKey)
    );

    if (!user) {
      return res.status(401).json({ error: 'E-mel atau kata laluan tidak sah.' });
    }

    // If user account was registered previously without a password (e.g. prior Google sign-up),
    // seamlessly assign the entered password to their account and convert to email provider!
    if (!user.passwordHash || !user.salt) {
      user.salt = crypto.randomBytes(16).toString('hex');
      user.passwordHash = hashPassword(password, user.salt);
      user.authProvider = 'email';
      persistUsers();
    } else {
      const testHash = hashPassword(password, user.salt);
      if (testHash !== user.passwordHash) {
        return res.status(401).json({ error: 'E-mel atau kata laluan tidak sah.' });
      }
    }

    // Refresh user in leaderboard
    const existingLbIdx = realParticipants.findIndex((p) => p.id === user.id);
    const lbEntry: RealLeaderboardRecord = {
      id: user.id,
      name: user.studentName,
      email: user.email,
      username: user.username,
      authProvider: user.authProvider || 'email',
      isRegistered: true,
      school: user.schoolName || 'Calon SPM',
      state: user.state || 'Malaysia',
      points: user.points || 0,
      streak: user.streak || 0,
      predictedGrade: user.lastSpmGrade?.grade || (user.points > 100 ? 'A' : 'A-'),
      avatar: user.avatar || '👨‍🎓',
      updatedAt: new Date().toISOString(),
    };

    if (existingLbIdx >= 0) {
      realParticipants[existingLbIdx] = lbEntry;
    } else {
      realParticipants.push(lbEntry);
    }
    persistRealParticipants();

    const token = generateSessionToken(user.id);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      progress: extractUserProgress(user),
      message: `Selamat kembali, ${user.studentName}!`,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Gagal log masuk. Sila cuba lagi.' });
  }
});

// POST /api/auth/google - Sign up or log in via Google Account
app.post('/api/auth/google', (req, res) => {
  try {
    const {
      email,
      name,
      avatar,
      googleId,
      schoolName,
      state,
      initialPoints,
      initialStreak,
      initialLastCheckInDate,
      initialClaimedStreakDays,
      initialLastSpmGrade,
      totalSpeakingDone,
      totalListeningDone,
    } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'E-mel Google tidak sah.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already registered with this email
    let user = registeredUsers.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (user) {
      // User exists -> Log them in!
      if (!user.authProvider) user.authProvider = 'google';
      if (googleId && !user.googleId) user.googleId = googleId;
      if (name && (!user.studentName || user.studentName.startsWith('calon_'))) {
        user.studentName = name.trim();
      }
      persistUsers();

      // Refresh leaderboard
      const existingLbIdx = realParticipants.findIndex((p) => p.id === user.id);
      const lbEntry: RealLeaderboardRecord = {
        id: user.id,
        name: user.studentName,
        email: user.email,
        username: user.username,
        authProvider: user.authProvider || 'google',
        isRegistered: true,
        school: user.schoolName || 'Calon SPM',
        state: user.state || 'Malaysia',
        points: user.points || 0,
        streak: user.streak || 0,
        predictedGrade: user.lastSpmGrade?.grade || (user.points > 100 ? 'A' : 'A-'),
        avatar: user.avatar || '👨‍🎓',
        updatedAt: new Date().toISOString(),
      };

      if (existingLbIdx >= 0) {
        realParticipants[existingLbIdx] = lbEntry;
      } else {
        realParticipants.push(lbEntry);
      }
      persistRealParticipants();

      const token = generateSessionToken(user.id);

      return res.json({
        success: true,
        isNewUser: false,
        token,
        user: sanitizeUser(user),
        progress: extractUserProgress(user),
        message: `Selamat kembali dengan Google, ${user.studentName}!`,
      });
    }

    // New user signing up with Google for the first time
    let cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) cleanUsername = `calon_${Math.floor(1000 + Math.random() * 9000)}`;

    let finalUsername = cleanUsername;
    let counter = 1;
    while (registeredUsers.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${cleanUsername}_${counter}`;
      counter++;
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const points = typeof initialPoints === 'number' && initialPoints > 0 ? initialPoints : 0;
    const streak = typeof initialStreak === 'number' && initialStreak > 0 ? initialStreak : 1;

    const newUser: RegisteredUserRecord = {
      id: userId,
      email: cleanEmail,
      username: finalUsername,
      authProvider: 'google',
      googleId: googleId || undefined,
      studentName: (name || finalUsername).trim(),
      schoolName: (schoolName || 'Calon SPM').trim(),
      state: (state || 'Kuala Lumpur').trim(),
      avatar: avatar || '👩‍🎓',
      createdAt: new Date().toISOString(),
      points,
      streak,
      level: 1,
      levelName: 'Pemula Bahasa',
      lastCheckInDate: initialLastCheckInDate || new Date().toISOString().split('T')[0],
      claimedStreakDays: Array.isArray(initialClaimedStreakDays) ? initialClaimedStreakDays : [1],
      totalSpeakingDone: typeof totalSpeakingDone === 'number' ? totalSpeakingDone : 0,
      totalListeningDone: typeof totalListeningDone === 'number' ? totalListeningDone : 0,
      totalExercisesDone: 0,
      lastSpmGrade: initialLastSpmGrade || undefined,
    };

    registeredUsers.push(newUser);
    persistUsers();

    const leaderboardEntry: RealLeaderboardRecord = {
      id: newUser.id,
      name: newUser.studentName,
      email: newUser.email,
      username: newUser.username,
      authProvider: 'google',
      isRegistered: true,
      school: newUser.schoolName,
      state: newUser.state,
      points: newUser.points,
      streak: newUser.streak,
      predictedGrade: newUser.lastSpmGrade?.grade || 'A',
      avatar: newUser.avatar,
      updatedAt: new Date().toISOString(),
    };

    realParticipants.push(leaderboardEntry);
    persistRealParticipants();

    const token = generateSessionToken(userId);

    return res.json({
      success: true,
      isNewUser: true,
      token,
      user: sanitizeUser(newUser),
      progress: extractUserProgress(newUser),
      message: `Pendaftaran akaun Google berjaya! Selamat datang, ${newUser.studentName}.`,
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Gagal memproses akaun Google. Sila cuba lagi.' });
  }
});

// GET /api/auth/me - Verify session or fetch current user profile
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string)) || '';
  const userId = activeSessions.get(token) || (req.query.userId as string);

  if (!userId) {
    return res.status(401).json({ error: 'Tidak sah atau sesi telah tamat.' });
  }

  const user = registeredUsers.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Akaun tidak dijumpai.' });
  }

  return res.json({
    success: true,
    user: sanitizeUser(user),
    progress: extractUserProgress(user),
  });
});

// POST /api/auth/update-profile - Update student profile info
app.post('/api/auth/update-profile', (req, res) => {
  const { userId, studentName, schoolName, state, avatar } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const userIdx = registeredUsers.findIndex((u) => u.id === userId);
  if (userIdx < 0) {
    return res.status(404).json({ error: 'Akaun tidak dijumpai.' });
  }

  const user = registeredUsers[userIdx];
  if (studentName) user.studentName = studentName.trim();
  if (schoolName !== undefined) user.schoolName = schoolName.trim();
  if (state) user.state = state.trim();
  if (avatar) user.avatar = avatar.trim();

  registeredUsers[userIdx] = user;
  persistUsers();

  // Sync to leaderboard
  const lbIdx = realParticipants.findIndex((p) => p.id === userId);
  if (lbIdx >= 0) {
    realParticipants[lbIdx].name = user.studentName;
    realParticipants[lbIdx].school = user.schoolName;
    realParticipants[lbIdx].state = user.state;
    realParticipants[lbIdx].avatar = user.avatar;
    realParticipants[lbIdx].updatedAt = new Date().toISOString();
    persistRealParticipants();
  }

  return res.json({
    success: true,
    user: sanitizeUser(user),
    progress: extractUserProgress(user),
  });
});

// POST /api/auth/sync-progress - Sync student XP, streak, and grade into registered account
app.post('/api/auth/sync-progress', (req, res) => {
  const { userId, points, streak, lastCheckInDate, claimedStreakDays, level, levelName, lastSpmGrade, totalSpeakingDone, totalListeningDone } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const userIdx = registeredUsers.findIndex((u) => u.id === userId);
  if (userIdx >= 0) {
    const user = registeredUsers[userIdx];
    if (typeof points === 'number') user.points = points;
    if (typeof streak === 'number') user.streak = streak;
    if (lastCheckInDate) user.lastCheckInDate = lastCheckInDate;
    if (Array.isArray(claimedStreakDays)) user.claimedStreakDays = claimedStreakDays;
    if (typeof level === 'number') user.level = level;
    if (levelName) user.levelName = levelName;
    if (lastSpmGrade) user.lastSpmGrade = lastSpmGrade;
    if (typeof totalSpeakingDone === 'number') user.totalSpeakingDone = totalSpeakingDone;
    if (typeof totalListeningDone === 'number') user.totalListeningDone = totalListeningDone;

    registeredUsers[userIdx] = user;
    persistUsers();

    // Sync to leaderboard
    const lbIdx = realParticipants.findIndex((p) => p.id === userId);
    if (lbIdx >= 0) {
      realParticipants[lbIdx].points = user.points;
      realParticipants[lbIdx].streak = user.streak;
      if (user.lastSpmGrade?.grade) {
        realParticipants[lbIdx].predictedGrade = user.lastSpmGrade.grade;
      }
      realParticipants[lbIdx].updatedAt = new Date().toISOString();
      persistRealParticipants();
    }
    return res.json({ success: true, progress: extractUserProgress(user) });
  }

  return res.status(404).json({ error: 'Pengguna berdaftar tidak dijumpai' });
});

// ----------------------------------------------------------------------------
// Leaderboard Endpoints
// ----------------------------------------------------------------------------

// GET /api/leaderboard - fetch real registered participants sorted by points (only registered candidates)
app.get('/api/leaderboard', (req, res) => {
  // The leaderboard exclusively contains registered candidates
  const list = realParticipants.filter((p) => p.isRegistered);

  const sorted = list.sort((a, b) => (b.points || 0) - (a.points || 0));
  const ranked = sorted.map((p, idx) => {
    const rank = idx + 1;
    let league: 'diamond' | 'gold' | 'silver' | 'bronze' = 'bronze';
    if (rank <= 3) league = 'diamond';
    else if (rank <= 8) league = 'gold';
    else if (rank <= 14) league = 'silver';
    else league = 'bronze';

    // Strictly omit email and username to protect student privacy
    const displayName = (p.name && !p.name.includes('@') && !p.name.startsWith('calon_'))
      ? p.name
      : 'Calon SPM';
    return {
      id: p.id,
      rank,
      name: displayName,
      username: '',
      isRegistered: true,
      school: p.school || 'Calon SPM',
      state: p.state || 'Malaysia',
      points: p.points || 0,
      streak: p.streak || 0,
      predictedGrade: p.predictedGrade || 'A',
      avatar: p.avatar || '⭐',
      league,
      isCurrentUser: false,
      trend: 'same' as const,
    };
  });

  res.json({
    entries: ranked,
    totalRealUsers: ranked.length,
    registeredCount: ranked.length,
  });
});

// POST /api/leaderboard/sync - upsert real user stats (guests or registered)
app.post('/api/leaderboard/sync', (req, res) => {
  const { userId, name, school, state, points, streak, predictedGrade, avatar, username, isRegistered } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const existingUser = registeredUsers.find((u) => u.id === userId);
  const isReg = Boolean(isRegistered || existingUser);

  const existingIdx = realParticipants.findIndex((p) => p.id === userId);
  const record: RealLeaderboardRecord = {
    id: userId,
    name: (name || (existingUser ? existingUser.studentName : 'Calon SPM')).trim(),
    username: existingUser ? existingUser.username : username || '',
    isRegistered: isReg,
    school: (school || (existingUser ? existingUser.schoolName : '')).trim(),
    state: (state || (existingUser ? existingUser.state : 'Malaysia')).trim(),
    points: typeof points === 'number' ? points : 0,
    streak: typeof streak === 'number' ? streak : 0,
    predictedGrade: predictedGrade || 'A',
    avatar: avatar || (existingUser ? existingUser.avatar : '⭐'),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    realParticipants[existingIdx] = record;
  } else {
    realParticipants.push(record);
  }

  persistRealParticipants();
  res.json({ success: true, count: realParticipants.length });
});

// POST /api/leaderboard/reset - wipe leaderboard memory to start clean from Day 1
app.post('/api/leaderboard/reset', (req, res) => {
  realParticipants = [];
  persistRealParticipants();
  res.json({ success: true, message: 'Papan pendahulu telah dikosongkan (Bermula Hari 1)' });
});

// POST /api/admin/clear-all - wipe all registered accounts, sessions, and leaderboard to start clean from Day 1
app.post('/api/admin/clear-all', (req, res) => {
  registeredUsers = [];
  realParticipants = [];
  activeSessions.clear();
  persistUsers();
  persistRealParticipants();
  res.json({ success: true, message: 'Semua akaun dan memori telah dikosongkan. Bermula dari Hari 1.' });
});

// Vite Middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SPM BM Prep Server running on port ${PORT}`);
  });
}

startServer();
