/**
 * Centralized configuration for the RAG system.
 * Change model names, dimensions, or thresholds here —
 * every other module reads from this single source of truth.
 */

export const RAG_CONFIG = {
  /** ── Gemini Models ─────────────────────────────── */
  embedding: {
    /** Embedding model identifier */
    model: 'gemini-embedding-001',
    /** Output vector dimensions (768 is a good balance of quality & cost) */
    dimensions: 768,
  },

  generation: {
    /** Generative model identifier */
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    /** Fallback models confirmed to exist and support streaming generation */
    fallbackModels: ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'],
    /** Maximum tokens in generated response */
    maxOutputTokens: 2048,
    /** Sampling temperature */
    temperature: 0.7,
  },

  /** ── Chunking ──────────────────────────────────── */
  chunking: {
    /** Target chunk size in characters */
    chunkSize: 800,
    /** Overlap between consecutive chunks in characters */
    chunkOverlap: 200,
    /** Minimum chunk size — discard chunks smaller than this */
    minChunkSize: 100,
  },

  /** ── Vector Search ─────────────────────────────── */
  retrieval: {
    /** Number of candidates for MongoDB vector search */
    numCandidates: 50,
    /** Number of results to return */
    topK: 8,
    /** Minimum similarity score (0-1) to include a result */
    similarityThreshold: 0.65,
  },

  /** ── MongoDB ───────────────────────────────────── */
  mongodb: {
    /** Database name */
    database: process.env.MONGODB_DB || 'ask-my-twin',
    /** Collection name for document chunks */
    collection: 'chunks',
    /** Vector search index name */
    vectorIndex: 'vector_index',
  },

  /** ── Knowledge Base ────────────────────────────── */
  knowledge: {
    /** Directory containing knowledge markdown files */
    directory: 'knowledge',
    /** Supported file extension */
    extension: '.md',
  },
} as const;
