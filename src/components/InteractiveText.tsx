import React from 'react';

interface InteractiveTextProps {
  text: string;
  onWordClick: (word: string, contextSentence: string) => void;
  className?: string;
  highlightWords?: string[];
}

export const InteractiveText: React.FC<InteractiveTextProps> = ({
  text,
  onWordClick,
  className = '',
  highlightWords = []
}) => {
  if (!text) return null;

  // Split text by sentences to provide context for definitions
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];

  const cleanHighlightList = (highlightWords || []).map(w =>
    w.toLowerCase().replace(/[^a-zA-Z\u00C0-\u024F\-]/g, '').trim()
  );

  return (
    <span className={`inline leading-relaxed ${className}`}>
      {sentences.map((sentence, sIdx) => {
        // Regex to split into word tokens vs delimiter/punctuation/spacing tokens
        // Captures unicode letter sequences with optional hyphens (e.g., 'kanak-kanak', 'lestari')
        const tokens = sentence.split(/([\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*)/u);

        return (
          <span key={sIdx} className="inline">
            {tokens.map((token, tIdx) => {
              // Check if token contains valid alphabet word characters
              const isWord = /^[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*$/u.test(token);
              const cleanWord = token.toLowerCase().trim();
              const isHighlighted = cleanHighlightList.includes(cleanWord);

              if (isWord && cleanWord.length > 0) {
                return (
                  <span
                    key={`${sIdx}-${tIdx}`}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onWordClick(token, sentence.trim());
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        e.preventDefault();
                        onWordClick(token, sentence.trim());
                      }
                    }}
                    title="Ketik perkataan untuk takrifan, terjemahan & sinonim"
                    className={`inline-block font-inherit text-inherit transition-all duration-150 rounded px-0.5 -my-0.5 cursor-pointer select-text
                      hover:bg-amber-200/90 hover:text-amber-950 active:scale-95 focus:outline-none focus:ring-1 focus:ring-amber-500
                      ${
                        isHighlighted
                          ? 'bg-amber-100/90 font-medium text-amber-950 underline decoration-amber-400 underline-offset-2 hover:bg-amber-200'
                          : 'hover:underline decoration-amber-400/70'
                      }
                    `}
                  >
                    {token}
                  </span>
                );
              }

              return (
                <span
                  key={`${sIdx}-${tIdx}`}
                  className={token.includes('\n') ? 'whitespace-pre-wrap' : ''}
                >
                  {token}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
};

