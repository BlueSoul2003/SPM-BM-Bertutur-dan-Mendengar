import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkCheck,
  X,
  Languages,
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
  Check,
  Copy
} from 'lucide-react';
import { DictionaryData, TargetLanguage, WordBankItem } from '../types';
import { lookupDictionaryWord } from '../services/geminiService';
import { speakMalayText } from '../utils/speechUtils';

interface DictionaryModalProps {
  selectedWord: string | null;
  contextSentence?: string;
  preferredLang: TargetLanguage;
  onLanguageChange: (lang: TargetLanguage) => void;
  wordBank: WordBankItem[];
  onToggleSaveWord: (item: DictionaryData) => void;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  selectedWord,
  contextSentence,
  preferredLang,
  onLanguageChange,
  wordBank,
  onToggleSaveWord,
  onClose,
}) => {
  const [data, setData] = useState<DictionaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);
  // Local active translation tab (default to user's preferred language, with instant switching)
  const [activeTab, setActiveTab] = useState<TargetLanguage | 'all'>(preferredLang || 'en');

  // Fetch word data ONLY when selectedWord or contextSentence changes
  useEffect(() => {
    if (!selectedWord) {
      setData(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let isMounted = true;
    setLoading(true);

    lookupDictionaryWord(selectedWord, contextSentence, preferredLang)
      .then((result) => {
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Dictionary error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedWord, contextSentence, onClose]);

  // Keep active tab in sync if parent preferredLang updates initially
  useEffect(() => {
    if (preferredLang) {
      setActiveTab(preferredLang);
    }
  }, [preferredLang]);

  if (!selectedWord) return null;

  const isSaved = wordBank.some(
    (w) => w.word.toLowerCase() === selectedWord.toLowerCase()
  );

  const handleSpeak = () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    speakMalayText(data?.word || selectedWord, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleCopy = () => {
    if (!data) return;
    const textToCopy = `${data.word} (${data.partOfSpeech || 'Kosa Kata'})\nTakrifan Melayu: ${data.definitions.ms}\nEnglish: ${data.definitions.en || 'N/A'}\n中文: ${data.definitions.zh || 'N/A'}\nTamil: ${data.definitions.ta || 'N/A'}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabSelect = (tab: TargetLanguage | 'all') => {
    setActiveTab(tab);
    if (tab !== 'all') {
      onLanguageChange(tab);
    }
  };

  const languageTabs: { key: TargetLanguage | 'all'; label: string; flag: string }[] = [
    { key: 'en', label: 'English', flag: '🇬🇧' },
    { key: 'zh', label: '中文', flag: '🇨🇳' },
    { key: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { key: 'all', label: 'Semua Terjemahan', flag: '🌐' },
  ];

  return (
    <div
      id="dictionary-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="dictionary-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <BookOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white capitalize">
                  {data?.word || selectedWord}
                </h3>
                {data?.partOfSpeech && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-100 font-sans border border-emerald-500/30">
                    {data.partOfSpeech}
                  </span>
                )}
              </div>
              {data?.rootWord && data.rootWord.toLowerCase() !== (data.word || selectedWord).toLowerCase() && (
                <p className="text-xs text-emerald-200 mt-0.5">
                  Kata Dasar: <span className="font-semibold text-white bg-emerald-950/40 px-1.5 py-0.5 rounded">{data.rootWord}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="pronounce-word-btn"
              type="button"
              onClick={handleSpeak}
              disabled={isPlayingAudio}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer active:scale-95 border border-white/10"
              title="Dengar Sebutan Baku Melayu"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-amber-300' : ''}`} />
            </button>
            <button
              id="copy-dictionary-btn"
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer active:scale-95 border border-white/10"
              title="Salin Takrifan"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              id="save-to-wordbank-btn"
              type="button"
              onClick={() => data && onToggleSaveWord(data)}
              className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                isSaved
                  ? 'bg-amber-400 text-amber-950 font-medium'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={isSaved ? 'Disimpan dalam Buku Kosa Kata' : 'Simpan ke Buku Kosa Kata'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              id="close-dictionary-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Translation Switcher Bar */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 shrink-0">
            <Languages className="w-3.5 h-3.5 text-emerald-700" />
            <span>Terjemahan:</span>
          </div>
          <div className="flex gap-1 shrink-0">
            {languageTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabSelect(tab.key)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span className="mr-1">{tab.flag}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-slate-800 text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2.5">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <p className="text-xs font-medium text-slate-600">Mencari takrifan tepat Kamus Dewan & SPM...</p>
            </div>
          ) : (
            <>
              {/* PRIMARY ANCHOR: Official Kamus Dewan Malay Definition */}
              <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Maksud Rasmi (Bahasa Melayu / Kamus Dewan)
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                    Rujukan Utama SPM
                  </span>
                </div>
                <p className="text-slate-900 text-base leading-relaxed font-semibold">
                  {data?.definitions.ms || `Maksud bagi '${selectedWord}'.`}
                </p>
              </div>

              {/* TRANSLATION SECTION: Selected or All */}
              {activeTab === 'all' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Semua Terjemahan Bahasa
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">🇬🇧 English Translation:</span>
                      <p className="text-slate-800 text-sm">{data?.definitions.en || 'No translation available'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">🇨🇳 华文释义 (Mandarin):</span>
                      <p className="text-slate-800 text-sm font-medium">{data?.definitions.zh || '暂无华文释义'}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">🇮🇳 தமிழ் (Tamil):</span>
                      <p className="text-slate-800 text-sm">{data?.definitions.ta || 'மொழிபெயர்ப்பு இல்லை'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1">
                    <span>
                      {activeTab === 'en' ? '🇬🇧 Terjemahan Bahasa Inggeris' : activeTab === 'zh' ? '🇨🇳 华文释义 (Mandarin)' : '🇮🇳 தமிழ் விளக்கம் (Tamil)'}
                    </span>
                  </span>
                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
                    {activeTab === 'en'
                      ? data?.definitions.en || data?.definitions.ms
                      : activeTab === 'zh'
                      ? data?.definitions.zh || data?.definitions.en
                      : data?.definitions.ta || data?.definitions.en}
                  </p>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Synonyms */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Sinonim Aras Tinggi
                  </span>
                  {data?.synonyms && data.synonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {data.synonyms.map((syn, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-md font-medium"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tiada data sinonim</span>
                  )}
                </div>

                {/* Antonyms */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Antonim (Lawan Kata)
                  </span>
                  {data?.antonyms && data.antonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {data.antonyms.map((ant, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium"
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tiada perkataan berlawanan khusus</span>
                  )}
                </div>
              </div>

              {/* Sample SPM Sentence */}
              {data?.spmSampleSentence && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Contoh Penggunaan Ayat SPM
                  </span>
                  <p className="text-slate-800 italic leading-relaxed text-xs sm:text-sm">
                    "{data.spmSampleSentence}"
                  </p>
                </div>
              )}

              {/* SPM Exam Tip */}
              {data?.spmTips && (
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-700">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <p><span className="font-semibold text-emerald-950">Tip Skor SPM:</span> {data.spmTips}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Kamus Pintar SPM & Tatabahasa Dewan</span>
          <button
            id="modal-bottom-close-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
