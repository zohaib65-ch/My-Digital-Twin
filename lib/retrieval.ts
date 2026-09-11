import { getChunksCollection } from './mongodb';
import { generateEmbedding } from './embeddings';
import { RAG_CONFIG } from './config';
import type { RetrievedChunk } from './types';

/**
 * Retrieval layer — vector search + optional metadata filtering.
 *
 * Correction #4: Only apply metadata category filters when confidence is HIGH.
 * Prefer pure semantic retrieval and only use metadata when the question
 * unambiguously targets a single category.
 */

/**
 * Category detection rules — each entry requires a minimum number of
 * keyword hits before we consider the category "high confidence".
 *
 * A single generic keyword match (score = 1) is NOT enough.
 * The threshold is set to 2 so the question must contain multiple
 * category-specific keywords before a filter is applied.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  skills: ['skill', 'skills', 'technology', 'technologies', 'tech stack', 'programming language', 'framework', 'tools'],
  projects: ['project', 'projects', 'portfolio', 'built', 'developed', 'application'],
  experience: ['experience', 'work experience', 'job', 'career', 'company', 'position', 'employment'],
  services: ['service', 'services', 'offer', 'provides', 'consulting', 'freelance', 'hire'],
  education: ['education', 'degree', 'university', 'college', 'studied', 'graduated'],
  certifications: ['certification', 'certifications', 'certified', 'certificate', 'credential'],
  achievements: ['achievement', 'achievements', 'award', 'awards', 'recognition'],
  contact: ['contact', 'email', 'phone', 'linkedin', 'github', 'reach out'],
  personal: ['who is', 'about zohaib', 'introduction', 'bio', 'background'],
  faq: ['faq', 'frequently asked'],
};

/** Minimum keyword hits required to apply a category filter */
const CATEGORY_CONFIDENCE_THRESHOLD = 2;

/**
 * Detect a high-confidence category from a question.
 * Returns null if the category is uncertain — in that case,
 * plain semantic vector search will be used instead.
 */
export function detectCategory(question: string): string | null {
  const lower = question.toLowerCase();
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Only apply a filter when confidence is high (>= 2 keyword hits)
  return bestScore >= CATEGORY_CONFIDENCE_THRESHOLD ? bestCategory : null;
}

/**
 * Perform MongoDB Atlas Vector Search.
 * The optional category filter is applied directly inside $vectorSearch
 * so MongoDB can use it efficiently (pre-filter) rather than post-filtering.
 */
export async function vectorSearch(
  queryEmbedding: number[],
  topK: number = RAG_CONFIG.retrieval.topK,
  category?: string | null
): Promise<RetrievedChunk[]> {
  const collection = getChunksCollection();

  // Build the $vectorSearch stage
  const vectorSearchStage: Record<string, unknown> = {
    index: RAG_CONFIG.mongodb.vectorIndex,
    path: 'embedding',
    queryVector: queryEmbedding,
    numCandidates: RAG_CONFIG.retrieval.numCandidates,
    limit: topK,
  };

  // Add metadata filter only when we have high confidence
  if (category) {
    vectorSearchStage.filter = {
      'metadata.category': category,
    };
  }

  const pipeline = [
    { $vectorSearch: vectorSearchStage },
    {
      $project: {
        _id: 0,
        content: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  try {
    const results = await collection.aggregate<RetrievedChunk>(pipeline).toArray();
    return results;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('index not found') || message.includes('vectorSearch') || message.includes('PlanExecutor')) {
      throw new Error(
        `MongoDB Atlas Vector Search index '${RAG_CONFIG.mongodb.vectorIndex}' is not ready or has not been created yet on '${RAG_CONFIG.mongodb.database}.${RAG_CONFIG.mongodb.collection}'. ` +
        `Please create the Vector Search index in MongoDB Atlas with 768 dimensions (cosine similarity). See README.md for instructions.`
      );
    }
    if (
      message.includes('SSL alert number 80') ||
      message.includes('tlsv1 alert internal error') ||
      message.includes('MongoServerSelectionError')
    ) {
      throw new Error(
        `MongoDB connection blocked (SSL Alert 80 / TLS internal error). In MongoDB Atlas, go to "Network Access" and ensure you have added "0.0.0.0/0" (Allow Access from Anywhere) so your production server can connect.`
      );
    }
    throw error;
  }
}

/**
 * Full retrieval pipeline:
 *
 *   Question → Embedding → $vectorSearch (+ optional filter) → Threshold → Ranked Results
 *
 * If a high-confidence category is detected, it is applied as a pre-filter
 * inside $vectorSearch. If the filtered search returns too few results,
 * we fall back to unfiltered semantic search.
 */
export async function retrieveContext(
  question: string,
  topK: number = RAG_CONFIG.retrieval.topK,
  threshold: number = RAG_CONFIG.retrieval.similarityThreshold
): Promise<{ chunks: RetrievedChunk[]; detectedCategory: string | null; embeddingTimeMs: number; retrievalTimeMs: number }> {
  // 1. Detect category (only when confidence is high)
  const detectedCategory = detectCategory(question);

  // 2. Generate query embedding
  const embeddingStart = performance.now();
  const queryEmbedding = await generateEmbedding(question);
  const embeddingTimeMs = Math.round(performance.now() - embeddingStart);

  // 3. Vector search — with optional category filter
  const retrievalStart = performance.now();
  let results = await vectorSearch(queryEmbedding, topK, detectedCategory);

  // 4. If filtered search returns too few results, fall back to unfiltered
  if (detectedCategory && results.length < 2) {
    const unfilteredResults = await vectorSearch(queryEmbedding, topK, null);
    // Merge and deduplicate
    const seen = new Set(results.map((r) => r.content));
    for (const r of unfilteredResults) {
      if (!seen.has(r.content)) {
        results.push(r);
        seen.add(r.content);
      }
    }
    // Re-sort by score descending
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, topK);
  }

  const retrievalTimeMs = Math.round(performance.now() - retrievalStart);

  // 5. Apply similarity threshold
  const filteredResults = results.filter((r) => r.score >= threshold);

  return {
    chunks: filteredResults,
    detectedCategory,
    embeddingTimeMs,
    retrievalTimeMs,
  };
}
