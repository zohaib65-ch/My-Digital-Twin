import { retrieveContext } from './retrieval';
import { buildPrompt, getAssembledContext } from './prompt';
import { generateAnswer, generateAnswerStream } from './gemini';
import type { RAGResponse, SourceCitation, DebugInfo, ChatMessage, RetrievedChunk } from './types';

/**
 * RAG orchestration layer.
 *
 * Correction #7: If no chunks pass the similarity threshold, do NOT call
 * Gemini with empty context. Return a grounded fallback immediately.
 *
 * Correction #9: SourceCitation now includes the similarity score.
 */

const NO_CONTEXT_FALLBACK =
  "I don't have enough information about that in my knowledge base.";

interface RAGOptions {
  /** Include debug information in the response */
  debug?: boolean;
  /** Conversation history for context continuity */
  history?: ChatMessage[];
  /** Override default topK */
  topK?: number;
}

/**
 * Run the complete RAG pipeline (non-streaming).
 */
export async function ragPipeline(
  question: string,
  options: RAGOptions = {}
): Promise<RAGResponse> {
  const pipelineStart = performance.now();

  // 1. Retrieve relevant context
  const { chunks, detectedCategory, embeddingTimeMs, retrievalTimeMs } =
    await retrieveContext(question, options.topK);

  const totalTimeMs = Math.round(performance.now() - pipelineStart);

  // Correction #7: If no chunks pass threshold, return fallback without calling Gemini
  if (chunks.length === 0) {
    const response: RAGResponse = { answer: NO_CONTEXT_FALLBACK, sources: [] };

    if (options.debug) {
      response.debugInfo = {
        embeddingTimeMs,
        retrievalTimeMs,
        totalTimeMs,
        retrievedCount: 0,
        retrievedChunks: [],
        detectedCategory,
        assembledContext: '',
      };
    }

    return response;
  }

  // 2. Build prompt
  const { systemPrompt, userMessage } = buildPrompt(
    chunks,
    question,
    options.history
  );

  // 3. Generate answer
  const answer = await generateAnswer(systemPrompt, userMessage);

  const finalTimeMs = Math.round(performance.now() - pipelineStart);

  // 4. Extract unique sources with scores
  const sources = extractSources(chunks);

  // 5. Build response
  const response: RAGResponse = { answer, sources };

  if (options.debug) {
    response.debugInfo = {
      embeddingTimeMs,
      retrievalTimeMs,
      totalTimeMs: finalTimeMs,
      retrievedCount: chunks.length,
      retrievedChunks: chunks,
      detectedCategory,
      assembledContext: getAssembledContext(chunks),
    };
  }

  return response;
}

/**
 * Run the RAG pipeline with streaming generation.
 * Returns retrieval results + an async generator for streaming text.
 *
 * Correction #7: If no chunks pass threshold, returns a static
 * fallback generator instead of calling Gemini.
 */
export async function ragPipelineStream(
  question: string,
  options: RAGOptions = {}
): Promise<{
  stream: AsyncGenerator<string>;
  sources: SourceCitation[];
  debugInfo?: DebugInfo;
}> {
  const pipelineStart = performance.now();

  // 1. Retrieve relevant context
  const { chunks, detectedCategory, embeddingTimeMs, retrievalTimeMs } =
    await retrieveContext(question, options.topK);

  const totalTimeMs = Math.round(performance.now() - pipelineStart);

  // Correction #7: No-context fallback — don't call Gemini
  if (chunks.length === 0) {
    async function* fallbackStream(): AsyncGenerator<string> {
      yield NO_CONTEXT_FALLBACK;
    }

    let debugInfo: DebugInfo | undefined;
    if (options.debug) {
      debugInfo = {
        embeddingTimeMs,
        retrievalTimeMs,
        totalTimeMs,
        retrievedCount: 0,
        retrievedChunks: [],
        detectedCategory,
        assembledContext: '',
      };
    }

    return { stream: fallbackStream(), sources: [], debugInfo };
  }

  // 2. Build prompt
  const { systemPrompt, userMessage } = buildPrompt(
    chunks,
    question,
    options.history
  );

  // 3. Create streaming generator
  const stream = generateAnswerStream(systemPrompt, userMessage);

  // 4. Extract unique sources with scores
  const sources = extractSources(chunks);

  // 5. Build debug info if requested
  let debugInfo: DebugInfo | undefined;
  if (options.debug) {
    debugInfo = {
      embeddingTimeMs,
      retrievalTimeMs,
      totalTimeMs,
      retrievedCount: chunks.length,
      retrievedChunks: chunks,
      detectedCategory,
      assembledContext: getAssembledContext(chunks),
    };
  }

  return { stream, sources, debugInfo };
}

/**
 * Extract unique source citations from retrieved chunks.
 * Deduplicates by source filename. Keeps the highest score per source.
 */
function extractSources(chunks: RetrievedChunk[]): SourceCitation[] {
  const sourceMap = new Map<string, SourceCitation>();

  for (const chunk of chunks) {
    const key = chunk.metadata.source;
    const existing = sourceMap.get(key);

    // Keep the highest score for each source
    if (!existing || chunk.score > existing.score) {
      sourceMap.set(key, {
        source: chunk.metadata.source,
        category: chunk.metadata.category,
        score: Math.round(chunk.score * 100) / 100, // 2 decimal places
      });
    }
  }

  return Array.from(sourceMap.values());
}
