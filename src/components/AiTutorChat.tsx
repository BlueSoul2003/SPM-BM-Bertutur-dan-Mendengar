import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  AlertCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  User,
  Loader2,
  VolumeX,
  Languages
} from 'lucide-react';
import { ChatMessage, GrammarAnalysis } from '../types';
import { InteractiveText } from './InteractiveText';
import { sendChatMessageToAI } from '../services/geminiService';
import {
  getSpeechRecognition,
  speakMalayText,
  stopSpeaking,
  normalizeMalayTranscript
} from '../utils/speechUtils';

interface AiTutorChatProps {
  onWordClick: (word: string, contextSentence: string) => void;
  onEarnPoints?: (points: number, reason: string) => void;
}

export const AiTutorChat: React.FC<AiTutorChatProps> = ({ onWordClick, onEarnPoints }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Selamat sejahtera! Saya Cikgu Maya, tutor pintar Bahasa Melayu SPM anda. Anda boleh berlatih bertutur dan berbual dalam Bahasa Melayu standard tentang apa-apa topik SPM, atau bertanyakan soalan tatabahasa. Saya akan membetulkan sebarang kesilapan tatabahasa dan mencadangkan kosa kata aras tinggi serta peribahasa secara masa nyata. Mari kita mulakan!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [tutorStyle, setTutorStyle] = useState<string>('cikgu_ramah');
  const [currentTopic, setCurrentTopic] = useState<string>('Amalan Gaya Hidup Sihat & Kesejahteraan Remaja');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<GrammarAnalysis | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const baseInputRef = useRef('');
  const finalInputRef = useRef('');
  const interimInputRef = useRef('');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Setup Web Speech Recognition
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

        finalInputRef.current = finalChunk;
        interimInputRef.current = interimChunk;

        const combined = [baseInputRef.current, finalChunk, interimChunk]
          .filter(Boolean)
          .join(' ')
          .trim();

        setInputMessage(normalizeMalayTranscript(combined));
      };

      recog.onerror = () => {
        setIsRecording(false);
      };

      recog.onend = () => {
        if (isRecordingRef.current) {
          baseInputRef.current = [
            baseInputRef.current,
            finalInputRef.current,
            interimInputRef.current
          ]
            .filter(Boolean)
            .join(' ')
            .trim();
          finalInputRef.current = '';
          interimInputRef.current = '';
          try {
            recog.start();
          } catch (e) {}
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recog;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendChatMessageToAI(newHistory, tutorStyle, currentTopic);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        grammarAnalysis: response.grammarAnalysis,
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (response.grammarAnalysis) {
        setLatestAnalysis(response.grammarAnalysis);
      }
      if (onEarnPoints) {
        onEarnPoints(5, 'Perbualan Lisan Interaktif bersama Tutor AI');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}

      const completed = [
        baseInputRef.current,
        finalInputRef.current,
        interimInputRef.current
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const normalized = normalizeMalayTranscript(completed);
      baseInputRef.current = normalized;
      finalInputRef.current = '';
      interimInputRef.current = '';
      setInputMessage(normalized);
    } else {
      stopSpeaking();
      baseInputRef.current = inputMessage.trim();
      finalInputRef.current = '';
      interimInputRef.current = '';
      isRecordingRef.current = true;
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handlePlayVoice = (id: string, text: string) => {
    if (playingMessageId === id) {
      stopSpeaking();
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(id);
      speakMalayText(text, () => {
        setPlayingMessageId(null);
      });
    }
  };

  const samplePrompts = [
    'Bagaimanakah cara memupuk amalan membaca dalam kalangan murid?',
    'Apakah impak negatif penggunaan telefon pintar secara berlebihan?',
    'Bolehkah cikgu terangkan perbezaan antara "di" dan "ke"?',
    'Beri saya contoh peribahasa yang sesuai untuk tema patriotisme.',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left 2 Cols: Main Chat Area */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md border border-indigo-400/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                  Cikgu Maya (AI Tutor BM SPM)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-xs text-indigo-200">
                Maklum balas tatabahasa, sebutan baku, dan kosa kata SPM segera
              </p>
            </div>
          </div>

          {/* Tutor Persona Selector */}
          <div className="flex items-center gap-2">
            <select
              value={tutorStyle}
              onChange={(e) => setTutorStyle(e.target.value)}
              className="bg-indigo-900/80 border border-indigo-700/80 text-indigo-100 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              <option value="cikgu_ramah">👩‍🏫 Cikgu BM Ramah</option>
              <option value="pemeriksa_tegas">🧐 Pemeriksa SPM Tegas</option>
              <option value="peribahasa">📜 Pakar Peribahasa & Kosa Kata</option>
            </select>
          </div>
        </div>

        {/* Topic Bar */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200/70 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Topik Semasa:</span>
          </div>
          <input
            type="text"
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            placeholder="Tukar topik perbincangan..."
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isPlaying = playingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[11px] opacity-75 border-b pb-1.5 mb-1.5 border-current/10">
                    <span className="font-bold">
                      {isUser ? 'Anda (Calon SPM)' : 'Cikgu Maya'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handlePlayVoice(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-slate-100 text-indigo-700 transition-colors cursor-pointer"
                          title="Dengar Audio Sebutan"
                        >
                          {isPlaying ? (
                            <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed font-sans">
                    <InteractiveText
                      text={msg.content}
                      onWordClick={onWordClick}
                      className={isUser ? 'text-white' : 'text-slate-800'}
                    />
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl p-3.5 max-w-xs shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Cikgu Maya sedang meneliti tatabahasa anda...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompt Pills */}
        <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Cadangan:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-800 hover:border-indigo-300 whitespace-nowrap transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            id="chat-voice-input-btn"
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-3 rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title={isRecording ? 'Henti rakaman suara' : 'Bercakap dalam Bahasa Melayu'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            id="chat-message-input"
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              baseInputRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Taip atau bertutur dalam Bahasa Melayu untuk maklum balas segera..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />

          <button
            id="chat-send-btn"
            type="button"
            disabled={!inputMessage.trim() || isLoading}
            onClick={() => handleSendMessage()}
            className="p-3 rounded-2xl bg-indigo-900 hover:bg-indigo-800 disabled:opacity-40 text-white shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Col: Real-time Grammar & Vocabulary Inspector Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5 h-[750px] overflow-y-auto">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-serif">
              Pemeriksa Tatabahasa & Kosa Kata SPM
            </h4>
            <p className="text-[11px] text-slate-500">
              Analisis automatik berdasarkan respon terkini murid
            </p>
          </div>
        </div>

        {latestAnalysis ? (
          <div className="space-y-4">
            {/* Grammar Corrections */}
            {Array.isArray(latestAnalysis.corrections) && latestAnalysis.corrections.length > 0 ? (
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Kesilapan Tatabahasa Dikesan
                </span>
                <div className="space-y-2">
                  {(latestAnalysis.corrections || []).map((c, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-red-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-600 line-through font-medium">"{c.original}"</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-700 font-bold">"{c.corrected}"</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Tahniah!</strong> Struktur ayat anda mematuhi tatabahasa standard tanpa kesilapan ketara.
                </span>
              </div>
            )}

            {/* Elevated Vocabulary Suggestions */}
            {Array.isArray(latestAnalysis.elevatedVocabulary) && latestAnalysis.elevatedVocabulary.length > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Cadangan Kosa Kata Aras Tinggi SPM
                </span>
                <div className="space-y-2">
                  {(latestAnalysis.elevatedVocabulary || []).map((v, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-indigo-100 text-xs space-y-1 cursor-pointer hover:border-indigo-300 transition-colors"
                      onClick={() => onWordClick(v.suggestion.split('/')[0].trim(), v.context)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Perkataan biasa: <strong className="text-slate-700">"{v.original}"</strong></span>
                        <span className="text-[10px] text-indigo-600 font-bold">Ketik untuk kamus</span>
                      </div>
                      <p className="text-emerald-800 font-bold text-sm">
                        &rarr; {v.suggestion}
                      </p>
                      <p className="text-[11px] text-slate-600 italic">
                        {v.context}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proverbs / Peribahasa */}
            {Array.isArray(latestAnalysis.proverbs) && latestAnalysis.proverbs.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Peribahasa Sesuai Topik Ini
                </span>
                <div className="space-y-1.5">
                  {(latestAnalysis.proverbs || []).map((pr, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs text-amber-950 font-serif italic"
                    >
                      "{pr}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fluency tip */}
            {latestAnalysis.fluencyTip && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Tip Kelancaran SPM:</span>
                <p>{latestAnalysis.fluencyTip}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Bot className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs text-slate-500">
              Hantar mesej atau bercakap dengan Cikgu Maya untuk melihat pembetulan tatabahasa dan cadangan kosa kata tinggi di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
