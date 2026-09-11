'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full bg-brand animate-typing-dot"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand animate-typing-dot"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-brand animate-typing-dot"
          style={{ animationDelay: '400ms' }}
        />
      </div>
      <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
    </div>
  );
}
