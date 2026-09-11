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
      {/* Avatar — Digital Twin */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold text-xs shadow-xs select-none mt-1 ring-1 ring-white/20">
          MZ
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`relative max-w-[92%] sm:max-w-[85%] ${
          isUser
            ? 'message-user rounded-3xl rounded-tr-xs px-5 py-3.5'
            : 'message-assistant rounded-3xl rounded-tl-xs p-5 sm:p-6'
        }`}
      >
        {/* Assistant Header & Copy Action */}
        {!isUser && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Muhammad Zohaib</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                AI Digital Twin
              </span>
            </div>

            {!isStreaming && content && (
              <button
                onClick={handleCopy}
                className="opacity-50 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Text Content */}
        <div className="leading-relaxed break-words">
          {isUser ? (
            <span className="whitespace-pre-wrap font-normal text-[14.5px] text-slate-100">{content}</span>
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
