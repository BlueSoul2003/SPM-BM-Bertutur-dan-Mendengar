import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Trash2,
  Volume2,
  Sparkles,
  Layers,
  CheckCircle2,
  RotateCcw,
  Search,
  BookOpen
} from 'lucide-react';
import { WordBankItem, TargetLanguage } from '../types';
import { speakMalayText } from '../utils/speechUtils';

interface WordBankModalProps {
  isOpen: boolean;
  wordBank: WordBankItem[];
  onRemoveWord: (word: string) => void;
  onToggleMastery: (word: string) => void;
  onClose: () => void;
  preferredLang: TargetLanguage;
}

export const WordBankModal: React.FC<WordBankModalProps> = ({
  isOpen,
  wordBank,
  onRemoveWord,
  onToggleMastery,
  onClose,
  preferredLang
}) => {
  const [activeView, setActiveView] = useState<'list' | 'flashcards'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  if (!isOpen) return null;

  const filteredWords = (wordBank || []).filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.rootWord && w.rootWord.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.synonyms || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSpeak = (wordText: string) => {
    speakMalayText(wordText);
  };

  const getDef = (item: WordBankItem) => {
    switch (preferredLang) {
      case 'en':
        return item.definitions.en || item.definitions.ms;
      case 'zh':
        return item.definitions.zh || item.definitions.en;
      case 'ta':
        return item.definitions.ta || item.definitions.en;
      default:
        return item.definitions.ms;
    }
  };

  const currentFlashcard = filteredWords[currentFlashcardIndex];

  return (
    <div
      id="wordbank-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="wordbank-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
                Buku Kosa Kata SPM (Word Bank)
              </h3>
              <p className="text-xs text-slate-400">
                {wordBank.length} perkataan disimpan &bull; {wordBank.filter(w => w.masteryLevel === 'mastered').length} telah dikuasai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs">
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'list'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Senarai
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('flashcards');
                  setCurrentFlashcardIndex(0);
                  setIsCardFlipped(false);
                }}
                disabled={filteredWords.length === 0}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'flashcards'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white disabled:opacity-40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Kad Imbasan
              </button>
            </div>

            <button
              id="close-wordbank-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content View */}
        {activeView === 'list' ? (
          <>
            {/* Search filter */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kosa kata, sinonim atau kata dasar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* List items */}
            <div className="p-4 overflow-y-auto space-y-3 divide-y divide-slate-100">
              {filteredWords.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Bookmark className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">
                    {wordBank.length === 0
                      ? 'Belum ada perkataan disimpan.'
                      : 'Tiada perkataan yang sepadan.'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Ketik mana-mana perkataan dalam teks semasa latihan dan klik ikon penanda buku untuk menyimpannya di sini.
                  </p>
                </div>
              ) : (
                filteredWords.map((item) => (
                  <div
                    key={item.word}
                    className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-serif text-slate-900 capitalize">
                          {item.word}
                        </span>
                        {item.partOfSpeech && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-sans">
                            {item.partOfSpeech}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSpeak(item.word)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Dengar Sebutan"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {getDef(item)}
                      </p>

                      {item.synonyms && item.synonyms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-semibold text-slate-400">Sinonim:</span>
                          {item.synonyms.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.spmSampleSentence && (
                        <p className="text-xs italic text-amber-900/90 pt-1">
                          "{item.spmSampleSentence}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => onToggleMastery(item.word)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          item.masteryLevel === 'mastered'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title="Tandakan status penguasaan"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.masteryLevel === 'mastered' ? 'Dikuasai' : 'Belajar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveWord(item.word)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Padam daripada buku kosa kata"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Flashcard View */
          <div className="p-6 flex flex-col items-center justify-center space-y-6">
            {filteredWords.length > 0 && currentFlashcard ? (
              <div className="w-full max-w-md space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Kad Imbasan SPM</span>
                  <span>
                    {currentFlashcardIndex + 1} daripada {filteredWords.length}
                  </span>
                </div>

                {/* Card Container with Flip */}
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className={`min-h-56 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center select-none shadow-md ${
                    isCardFlipped
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 text-slate-800'
                      : 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {!isCardFlipped ? (
                    <div className="space-y-3">
                      <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                        {currentFlashcard.partOfSpeech || 'Kosa Kata SPM'}
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-bold font-serif capitalize">
                        {currentFlashcard.word}
                      </h4>
                      {currentFlashcard.rootWord && (
                        <p className="text-xs text-slate-400">
                          Kata dasar: {currentFlashcard.rootWord}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 pt-3 flex items-center justify-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Ketik untuk melihat maksud & contoh ayat
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-left w-full">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <span className="text-sm font-bold text-emerald-950 capitalize">
                          {currentFlashcard.word}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(currentFlashcard.word);
                          }}
                          className="p-1 rounded bg-white text-emerald-700 hover:bg-emerald-100"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {getDef(currentFlashcard)}
                      </p>

                      {currentFlashcard.synonyms.length > 0 && (
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-emerald-900">Sinonim: </span>
                          {currentFlashcard.synonyms.join(', ')}
                        </div>
                      )}

                      {currentFlashcard.spmSampleSentence && (
                        <p className="text-xs italic text-amber-900 bg-amber-100/50 p-2 rounded-lg">
                          "{currentFlashcard.spmSampleSentence}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Nav buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={currentFlashcardIndex === 0}
                    onClick={() => {
                      setCurrentFlashcardIndex((prev) => Math.max(0, prev - 1));
                      setIsCardFlipped(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    &larr; Sebelumnya
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleMastery(currentFlashcard.word);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentFlashcard.masteryLevel === 'mastered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {currentFlashcard.masteryLevel === 'mastered'
                      ? 'Telah Dikuasai'
                      : 'Tandakan Dikuasai'}
                  </button>

                  <button
                    type="button"
                    disabled={currentFlashcardIndex === filteredWords.length - 1}
                    onClick={() => {
                      setCurrentFlashcardIndex((prev) =>
                        Math.min(filteredWords.length - 1, prev + 1)
                      );
                      setIsCardFlipped(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Seterusnya &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Tiada kad imbasan.</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Kosa kata tersimpan secara automatik pada peranti anda</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
