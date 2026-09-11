import { GoogleGenAI } from '@google/genai';
import { RAG_CONFIG } from './config';

/**
 * Embedding generation — server-side only.
 * Uses the centralized model config so document embeddings
 * and query embeddings always use the same model + dimensions.
 */

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not defined. Add it to your .env.local file.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate an embedding vector for a single text.
 * Used for both document chunks (during ingestion) and user queries (at runtime).
 *
 * Validates that the returned embedding has exactly the configured dimensions.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = getGeminiClient();

  const response = await ai.models.embedContent({
    model: RAG_CONFIG.embedding.model,
    contents: text,
    config: {
      outputDimensionality: RAG_CONFIG.embedding.dimensions,
    },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || embedding.length === 0) {
    throw new Error('Failed to generate embedding: empty response from Gemini');
  }

  // Correction #1: Validate embedding dimensions match configuration
  if (embedding.length !== RAG_CONFIG.embedding.dimensions) {
    throw new Error(
      `Embedding dimension mismatch: expected ${RAG_CONFIG.embedding.dimensions}, ` +
      `but Gemini returned ${embedding.length}. ` +
      `Update RAG_CONFIG.embedding.dimensions to match the actual model output, ` +
      `then recreate the MongoDB Atlas Vector Search index with the correct numDimensions.`
    );
  }

  return embedding;
}

/**
 * Generate embeddings for multiple texts with rate limiting.
 * Processes in batches to respect API limits.
 */
export async function generateEmbeddings(
  texts: string[],
  batchSize = 5,
  delayMs = 200
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );

    embeddings.push(...batchResults);

    // Rate-limit between batches (skip delay on last batch)
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return embeddings;
}
