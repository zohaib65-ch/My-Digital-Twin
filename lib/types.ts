/** Metadata attached to every document chunk */
export interface ChunkMetadata {
  /** Knowledge category: skills, projects, experience, etc. */
  category: string;
  /** Source filename, e.g. "skills.md" */
  source: string;
  /** Section title extracted from the document */
  title: string;
  /** Index of this chunk within its source document */
  chunkIndex: number;
}

/** A processed document chunk ready for storage */
export interface DocumentChunk {
  /** The text content of the chunk */
  content: string;
  /** Gemini embedding vector */
  embedding: number[];
  /** Chunk metadata for filtering and display */
  metadata: ChunkMetadata;
  /** MD5 hash of content for deduplication */
  contentHash: string;
  /** Unique identifier: source-chunkIndex */
  chunkId: string;
  /** ISO timestamp of when the chunk was created */
  createdAt: string;
}

/** A chunk retrieved from vector search with similarity score */
export interface RetrievedChunk {
  content: string;
  metadata: ChunkMetadata;
  score: number;
}

/** Source citation displayed to the user (correction #9: includes score) */
export interface SourceCitation {
  source: string;
  category: string;
  score: number;
}

/** Debug information for RAG pipeline inspection */
export interface DebugInfo {
  /** Question embedding generation time in ms */
  embeddingTimeMs: number;
  /** Vector search time in ms */
  retrievalTimeMs: number;
  /** Total pipeline time in ms */
  totalTimeMs: number;
  /** Number of chunks retrieved from vector search */
  retrievedCount: number;
  /** Chunks with similarity scores */
  retrievedChunks: RetrievedChunk[];
  /** Detected category filter, if any */
  detectedCategory: string | null;
  /** The assembled context sent to Gemini */
  assembledContext: string;
}

/** Full RAG pipeline response */
export interface RAGResponse {
  answer: string;
  sources: SourceCitation[];
  debugInfo?: DebugInfo;
}

/** Chat message in conversation history */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Chat API request body */
export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  debug?: boolean;
}

/** Chat API response (non-streaming) */
export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  debugInfo?: DebugInfo;
}

/** SSE event types for streaming (correction #3: proper named events) */
export type SSEEventType = 'token' | 'sources' | 'debug' | 'error' | 'done';

/** Raw knowledge document before processing */
export interface KnowledgeDocument {
  /** Source filename */
  filename: string;
  /** Raw markdown content */
  content: string;
  /** Category derived from filename */
  category: string;
}

/** Ingestion statistics */
export interface IngestionStats {
  totalDocuments: number;
  totalChunks: number;
  newChunks: number;
  skippedChunks: number;
  deletedChunks: number;
  errors: string[];
}

/** Admin stats response */
export interface AdminStats {
  totalChunks: number;
  totalDocuments: number;
  categories: Record<string, number>;
  lastIngestion?: string;
}
