'use client';

import { ChevronDown, ChevronUp, Clock, Search, FileText, Cpu } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { DebugInfo } from '@/lib/types';

interface DebugPanelProps {
  debugInfo: DebugInfo;
}

export function DebugPanel({ debugInfo }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-brand-light hover:bg-brand/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-medium">RAG Debug Info</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 text-xs animate-fade-in">
          {/* Timing Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-[10px] bg-muted/50">
              <Clock className="w-3 h-3" />
              Embedding: {debugInfo.embeddingTimeMs}ms
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px] bg-muted/50">
              <Search className="w-3 h-3" />
              Retrieval: {debugInfo.retrievalTimeMs}ms
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px] bg-muted/50">
              <Clock className="w-3 h-3" />
              Total: {debugInfo.totalTimeMs}ms
            </Badge>
          </div>

          {/* Category Filter */}
          {debugInfo.detectedCategory && (
            <div>
              <span className="text-muted-foreground">Category filter: </span>
              <Badge variant="secondary" className="text-[10px]">
                {debugInfo.detectedCategory}
              </Badge>
            </div>
          )}

          {/* Retrieved Chunks */}
          <div>
            <p className="text-muted-foreground mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Retrieved {debugInfo.retrievedCount} chunks:
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
              {debugInfo.retrievedChunks.map((chunk, i) => (
                <div
                  key={i}
                  className="rounded-md bg-muted/30 p-2 border border-border/30"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      {chunk.metadata.source}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      score: {chunk.score.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Assembled Context Preview */}
          <div>
            <p className="text-muted-foreground mb-1">Assembled context:</p>
            <div className="rounded-md bg-muted/30 p-2 border border-border/30 max-h-40 overflow-y-auto custom-scrollbar">
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {debugInfo.assembledContext || '(empty — no relevant context found)'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
