'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
}

/**
 * Parse an inline string into React nodes supporting:
 * - Markdown links: [text](url)
 * - Raw URLs: https://...
 * - Bold text: **text**
 * - Inline code: `code`
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\[[^\]]+\]\([^\)]+\)|https?:\/\/[^\s\)\],]+|\*\*[^*]+\*\*|`[^`]+`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('[') && token.includes('](')) {
      // Markdown link [Label](url)
      const rawLabel = token.slice(1, token.indexOf(']('));
      const rawUrl = token.slice(token.indexOf('](') + 2, -1);
      nodes.push(
        <a
          key={match.index}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 my-0.5 rounded-lg bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/70 font-semibold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer align-baseline"
        >
          <span>{parseInlineMarkdown(rawLabel)}</span>
          <ExternalLink className="w-3 h-3 opacity-70 inline flex-shrink-0" />
        </a>
      );
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      // Raw URL
      let cleanUrl = token;
      let trailing = '';
      while (cleanUrl.endsWith('.') || cleanUrl.endsWith(',') || cleanUrl.endsWith(')')) {
        trailing = cleanUrl.slice(-1) + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
      }
      nodes.push(
        <a
          key={match.index}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 my-0.5 rounded-lg bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/70 font-mono text-xs transition-all break-all cursor-pointer align-baseline"
        >
          <span>{cleanUrl}</span>
          <ExternalLink className="w-3 h-3 opacity-70 inline flex-shrink-0" />
        </a>
      );
      if (trailing) {
        nodes.push(trailing);
      }
    } else if (token.startsWith('**') && token.endsWith('**')) {
      // Bold **text**
      const inner = token.slice(2, -2);
      nodes.push(
        <strong key={match.index} className="font-semibold text-slate-950">
          {parseInlineMarkdown(inner)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      // Code `text`
      const inner = token.slice(1, -1);
      nodes.push(
        <code
          key={match.index}
          className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 border border-slate-200/80"
        >
          {inner}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-2.5 text-[14.5px] leading-relaxed text-slate-800 font-normal">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2.5 flex-shrink-0" />
              <div className="flex-1 text-slate-800 leading-relaxed">{parseInlineMarkdown(bulletText)}</div>
            </div>
          );
        }

        // Numbered item (e.g. "1. ")
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] mt-0.5 flex-shrink-0 border border-indigo-200/60">
                {num}
              </span>
              <div className="flex-1 text-slate-800 leading-relaxed">{parseInlineMarkdown(itemText)}</div>
            </div>
          );
        }

        // Heading markdown
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-slate-950 text-sm mt-4 mb-1.5 tracking-tight">
              {parseInlineMarkdown(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-slate-950 text-base mt-5 mb-2 tracking-tight">
              {parseInlineMarkdown(trimmed.slice(3))}
            </h3>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}
