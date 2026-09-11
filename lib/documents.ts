import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { RAG_CONFIG } from './config';
import type { KnowledgeDocument, ChunkMetadata } from './types';

/**
 * Document processing pipeline:
 * Read → Extract → Clean → Chunk → Metadata → Hash
 */

/** Read all knowledge markdown files from the knowledge directory */
export function readKnowledgeFiles(): KnowledgeDocument[] {
  const knowledgeDir = join(process.cwd(), 'knowledge');
  const files = readdirSync(/* turbopackIgnore: true */ knowledgeDir).filter(
    (f) => extname(f) === RAG_CONFIG.knowledge.extension
  );

  return files.map((filename) => ({
    filename,
    content: readFileSync(/* turbopackIgnore: true */ join(knowledgeDir, filename), 'utf-8'),
    category: basename(filename, RAG_CONFIG.knowledge.extension),
  }));
}

/** Clean markdown text for embedding — strip excessive formatting but preserve meaning */
export function cleanText(markdown: string): string {
  return (
    markdown
      // Remove markdown image/link syntax but keep text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove markdown emphasis markers (**, *, __, _)
      .replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')
      // Remove markdown headers markers but keep text
      .replace(/^#{1,6}\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Remove code block markers
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Collapse multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim()
  );
}

/**
 * Extract a title from a markdown section.
 * Looks for the first H1 or H2 heading, or uses the first line.
 */
export function extractTitle(text: string): string {
  const headingMatch = text.match(/^#{1,2}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  // Fall back to first non-empty line
  const firstLine = text.split('\n').find((line) => line.trim().length > 0);
  return firstLine?.trim().slice(0, 80) ?? 'Untitled';
}

/**
 * Chunk text using a sliding window approach.
 * Splits on paragraph boundaries first, then combines into chunks
 * of approximately `chunkSize` characters with `overlap`.
 */
export function chunkText(
  text: string,
  chunkSize: number = RAG_CONFIG.chunking.chunkSize,
  overlap: number = RAG_CONFIG.chunking.chunkOverlap,
  minSize: number = RAG_CONFIG.chunking.minChunkSize
): string[] {
  // Split into paragraphs (double newline boundaries)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    // If adding this paragraph would exceed chunkSize, finalize current chunk
    if (currentChunk.length + trimmed.length + 2 > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap from end of previous
      if (overlap > 0 && currentChunk.length > overlap) {
        currentChunk = currentChunk.slice(-overlap) + '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
    } else {
      currentChunk = currentChunk
        ? currentChunk + '\n\n' + trimmed
        : trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Filter out chunks that are too small to be useful
  return chunks.filter((chunk) => chunk.length >= minSize);
}

/**
 * Generate metadata for a chunk based on its content and source.
 */
export function generateChunkMetadata(
  content: string,
  source: string,
  category: string,
  chunkIndex: number
): ChunkMetadata {
  return {
    category,
    source,
    title: extractTitle(content),
    chunkIndex,
  };
}

/**
 * Generate a content hash for deduplication.
 * Uses MD5 which is fast and sufficient for content comparison.
 */
export function hashContent(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Process a single knowledge document into chunks with metadata.
 * Returns an array of { content, metadata, contentHash, chunkId }.
 */
export function processDocument(doc: KnowledgeDocument) {
  const cleaned = cleanText(doc.content);
  const chunks = chunkText(cleaned);

  return chunks.map((content, index) => ({
    content,
    metadata: generateChunkMetadata(content, doc.filename, doc.category, index),
    contentHash: hashContent(content),
    chunkId: `${doc.category}-${index}`,
  }));
}

/**
 * Process all knowledge documents.
 * Returns all processed chunks ready for embedding and storage.
 */
export function processAllDocuments() {
  const documents = readKnowledgeFiles();
  const allChunks = documents.flatMap((doc) => processDocument(doc));

  return {
    documents,
    chunks: allChunks,
    stats: {
      totalDocuments: documents.length,
      totalChunks: allChunks.length,
    },
  };
}
