'use client';

import { useState } from 'react';
import { User, Copy, Check, Sparkles } from 'lucide-react';
import { SourceList } from '@/components/sources/source-list';
import type { SourceCitation, DebugInfo } from '@/lib/types';
import { FormattedMessage } from '@/components/chat/formatted-message';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  debugInfo?: DebugInfo;
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  sources,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div
      className={`flex gap-3 sm:gap-3.5 animate-fade-in group ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar — Muhammad Zohaib (Digital Twin) */}
      {!isUser && (
        <div className="relative flex-shrink-0 w-8.5 h-8.5 mt-1 select-none">
          <img
            src="/zohaib.jpg"
            alt="Muhammad Zohaib"
            className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm ring-1 ring-slate-900/10 border border-white"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`relative ${
          isUser
            ? 'max-w-[88%] sm:max-w-[80%] message-user rounded-2xl sm:rounded-3xl rounded-tr-xs px-4 py-2.5 sm:px-5 sm:py-3.5'
            : 'max-w-[94%] sm:max-w-[85%] message-assistant rounded-2xl sm:rounded-3xl rounded-tl-xs p-3.5 sm:p-5.5'
        }`}
      >
        {/* Assistant Header & Copy Action */}
        {!isUser && (
          <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">Muhammad Zohaib</span>
              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex-shrink-0">
                AI Twin
              </span>
            </div>

            {!isStreaming && content && (
              <button
                onClick={handleCopy}
                className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1 text-[11px] cursor-pointer flex-shrink-0"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Text Content */}
        <div className="leading-relaxed break-words">
          {isUser ? (
            <span className="whitespace-pre-wrap font-normal text-[13px] sm:text-[14.5px] leading-relaxed text-slate-100">{content}</span>
          ) : (
            <FormattedMessage content={content} />
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-indigo-600 ml-1.5 animate-pulse rounded-full align-middle" />
          )}
        </div>

        {/* Verified Sources Badge */}
        {!isUser && sources && sources.length > 0 && !isStreaming && (
          <SourceList sources={sources} />
        )}
      </div>

      {/* Avatar — User */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-200/90 text-slate-700 flex items-center justify-center select-none shadow-2xs mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
