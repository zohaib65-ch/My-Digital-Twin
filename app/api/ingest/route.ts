import { NextRequest } from 'next/server';
import { processAllDocuments } from '@/lib/documents';
import { generateEmbeddings } from '@/lib/embeddings';
import { connectToMongoDB, getChunksCollection, closeMongoDB } from '@/lib/mongodb';
import type { DocumentChunk } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for ingestion

/**
 * POST /api/ingest
 *
 * Trigger document ingestion from the admin UI.
 * Protected by ADMIN_SECRET header.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Validate admin secret ─────────────────────────────────
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = request.headers.get('x-admin-secret');

    if (!adminSecret || providedSecret !== adminSecret) {
      return Response.json(
        { error: 'Unauthorized. Invalid admin secret.' },
        { status: 401 }
      );
    }

    // ── Process documents ─────────────────────────────────────
    const { chunks, stats } = processAllDocuments();

    // ── Connect to MongoDB ────────────────────────────────────
    await connectToMongoDB();
    const collection = getChunksCollection();

    // ── Check for existing chunks ─────────────────────────────
    const existingChunks = await collection
      .find({}, { projection: { contentHash: 1, chunkId: 1 } })
      .toArray();
    const existingHashes = new Set(existingChunks.map((c) => c.contentHash));
    const existingIds = new Set(existingChunks.map((c) => c.chunkId));

    const newChunks = chunks.filter((c) => !existingHashes.has(c.contentHash));

    if (newChunks.length > 0) {
      // Generate embeddings for new chunks
      const texts = newChunks.map((c) => c.content);
      const embeddings = await generateEmbeddings(texts, 5, 500);

      const documentsToInsert: DocumentChunk[] = newChunks.map((chunk, i) => ({
        content: chunk.content,
        embedding: embeddings[i],
        metadata: chunk.metadata,
        contentHash: chunk.contentHash,
        chunkId: chunk.chunkId,
        createdAt: new Date().toISOString(),
      }));

      // Remove any existing records with the same chunkId to avoid duplicates
      const newChunkIds = newChunks.map((c) => c.chunkId);
      await collection.deleteMany({ chunkId: { $in: newChunkIds } });

      await collection.insertMany(documentsToInsert);
    }

    // Clean up stale chunks
    const currentIds = new Set(chunks.map((c) => c.chunkId));
    const staleIds = [...existingIds].filter((id) => !currentIds.has(id));

    if (staleIds.length > 0) {
      await collection.deleteMany({ chunkId: { $in: staleIds } });
    }

    return Response.json({
      success: true,
      stats: {
        totalDocuments: stats.totalDocuments,
        totalChunks: stats.totalChunks,
        newChunks: newChunks.length,
        skippedChunks: chunks.length - newChunks.length,
        deletedChunks: staleIds.length,
      },
    });
  } catch (error) {
    console.error('[Ingest API Error]', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    return Response.json(
      { error: `Ingestion failed: ${message}` },
      { status: 500 }
    );
  }
}
