'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { WelcomeScreen } from '@/components/chat/welcome-screen';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import type { ChatMessage, SourceCitation, DebugInfo } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  debugInfo?: DebugInfo;
  isStreaming?: boolean;
}

/**
 * Parse SSE lines from a text buffer.
 */
function parseSSEEvents(buffer: string): {
  events: Array<{ event: string; data: string }>;
  remaining: string;
} {
  const events: Array<{ event: string; data: string }> = [];
  const parts = buffer.split('\n\n');
  const remaining = parts.pop() || '';

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    let eventType = '';
    let dataStr = '';

    for (const line of trimmed.split('\n')) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataStr = line.slice(6);
      }
    }

    if (eventType && dataStr) {
      events.push({ event: eventType, data: dataStr });
    }
  }

  return { events, remaining };
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
  };

  const sendMessage = async (content: string) => {
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const history: ChatMessage[] = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history,
          debug: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSEEvents(buffer);
        buffer = remaining;

        for (const { event, data } of events) {
          try {
            const parsed = JSON.parse(data);

            switch (event) {
              case 'token':
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + (parsed.text as string) }
                      : m
                  )
                );
                break;

              case 'sources':
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, sources: parsed as SourceCitation[] }
                      : m
                  )
                );
                break;

              case 'error':
                setError(parsed.message as string);
                break;

              case 'done':
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, isStreaming: false } : m
                  )
                );
                break;
            }
          } catch {
            // Skip malformed event chunks
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';

      setError(errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-mesh-canvas text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      {/* ── Floating New Chat Action (Only when active chat) ── */}
      {hasMessages && (
        <button
          onClick={handleNewChat}
          className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/95 hover:bg-white border border-slate-200/90 shadow-sm text-slate-700 backdrop-blur-md transition-all cursor-pointer"
          title="Start New Chat"
        >
          <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
          <span>New Chat</span>
        </button>
      )}

      {/* ── Message Area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl sm:max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-32 sm:pb-36">
          {!hasMessages ? (
            <WelcomeScreen onSuggestedQuestion={sendMessage} />
          ) : (
            <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
              {messages
                .filter(
                  (message) =>
                    !(
                      message.role === 'assistant' &&
                      !message.content &&
                      message.isStreaming
                    )
                )
                .map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    sources={message.sources}
                    debugInfo={message.debugInfo}
                    isStreaming={message.isStreaming}
                  />
                ))}

              {isLoading &&
                !messages.some((m) => m.isStreaming && m.content.length > 0) && (
                  <TypingIndicator />
                )}

              {error && (
                <div className="flex justify-center animate-fade-in my-3">
                  <div className="bg-red-50 text-red-700 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-red-200 shadow-xs max-w-md text-center">
                    {error}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Modern Floating Input Dock ───────────────────────── */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
