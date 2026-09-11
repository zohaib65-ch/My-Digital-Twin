'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !isLoading && !disabled) {
      onSend(trimmed);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <div className="w-full px-4 sm:px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent">
      <div className="max-w-2xl sm:max-w-3xl mx-auto">
        {/* Sleek Modern Input Bar (Claude / ChatGPT style) */}
        <div className="relative flex items-center bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.05)] hover:border-slate-300 focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 transition-all p-1.5 pl-4 sm:pl-5">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything about Muhammad Zohaib..."
            className="flex-1 min-h-[44px] max-h-[160px] resize-none py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-[15px] text-slate-900 placeholder:text-slate-400 font-normal leading-relaxed custom-scrollbar"
            rows={1}
            disabled={isLoading || disabled}
          />

          <button
            onClick={handleSend}
            disabled={!hasText || isLoading || disabled}
            aria-label="Send message"
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ml-2 ${
              hasText && !isLoading && !disabled
                ? 'bg-slate-950 hover:bg-slate-800 text-white shadow-sm active:scale-95 cursor-pointer'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Minimal Footer */}
        <p className="text-[11px] text-slate-400 text-center mt-2.5 font-normal select-none">
          Muhammad Zohaib&apos;s AI Digital Twin • Answers grounded in verified portfolio facts
        </p>
      </div>
    </div>
  );
}
