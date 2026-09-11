/**
 * Document Ingestion Script
 *
 * Usage: npm run ingest
 *
 * Reads knowledge markdown files → processes → chunks → embeds → stores in MongoDB.
 * Uses content hashes for deduplication — safe to run repeatedly.
 */

import 'dotenv/config';
import { processAllDocuments } from '../lib/documents';
import { generateEmbeddings } from '../lib/embeddings';
import { connectToMongoDB, getChunksCollection, closeMongoDB } from '../lib/mongodb';
import type { DocumentChunk } from '../lib/types';

async function ingest() {
  console.log('\n🚀 Starting document ingestion pipeline...\n');

  // ── Step 1: Validate environment ────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in .env.local');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  // ── Step 2: Connect to MongoDB ──────────────────────────────
  console.log('📡 Connecting to MongoDB Atlas...');
  await connectToMongoDB();
  const collection = getChunksCollection();
  console.log('✅ Connected to MongoDB Atlas\n');

  // ── Step 3: Process documents ───────────────────────────────
  console.log('📄 Reading and processing knowledge documents...');
  const { documents, chunks, stats } = processAllDocuments();
  console.log(`   Found ${stats.totalDocuments} documents`);
  console.log(`   Generated ${stats.totalChunks} chunks\n`);

  for (const doc of documents) {
    console.log(`   📝 ${doc.filename} (${doc.category})`);
  }
  console.log('');

  // ── Step 4: Check existing chunks for deduplication ─────────
  console.log('🔍 Checking for existing chunks (deduplication)...');
  const existingChunks = await collection
    .find({}, { projection: { contentHash: 1, chunkId: 1 } })
    .toArray();
  const existingHashes = new Set(existingChunks.map((c) => c.contentHash));
  const existingIds = new Set(existingChunks.map((c) => c.chunkId));

  const newChunks = chunks.filter((c) => !existingHashes.has(c.contentHash));
  const skippedCount = chunks.length - newChunks.length;

  console.log(`   ${skippedCount} chunks already exist (skipped)`);
  console.log(`   ${newChunks.length} new chunks to process\n`);

  if (newChunks.length === 0) {
    console.log('✨ All chunks are up to date. Nothing to ingest.\n');

    // Clean up stale chunks (from deleted/modified documents)
    const currentIds = new Set(chunks.map((c) => c.chunkId));
    const staleIds = [...existingIds].filter((id) => !currentIds.has(id));

    if (staleIds.length > 0) {
      console.log(`🗑️  Removing ${staleIds.length} stale chunks...`);
      await collection.deleteMany({ chunkId: { $in: staleIds } });
      console.log('✅ Stale chunks removed\n');
    }

    await closeMongoDB();
    console.log('✅ Ingestion complete!\n');
    return;
  }

  // ── Step 5: Generate embeddings ─────────────────────────────
  console.log('🧠 Generating Gemini embeddings...');
  console.log(`   Model: gemini-embedding-001 (768 dimensions)`);
  console.log(`   Processing ${newChunks.length} chunks in batches...\n`);

  const texts = newChunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts, 5, 500);

  console.log(`   ✅ Generated ${embeddings.length} embeddings\n`);

  // ── Step 6: Store in MongoDB ────────────────────────────────
  console.log('💾 Storing chunks and embeddings in MongoDB Atlas...');

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
  console.log(`   ✅ Inserted ${documentsToInsert.length} chunks\n`);

  // ── Step 7: Clean up stale chunks ───────────────────────────
  const currentIds = new Set(chunks.map((c) => c.chunkId));
  const staleIds = [...existingIds].filter((id) => !currentIds.has(id));

  if (staleIds.length > 0) {
    console.log(`🗑️  Removing ${staleIds.length} stale chunks...`);
    await collection.deleteMany({ chunkId: { $in: staleIds } });
    console.log('✅ Stale chunks removed\n');
  }

  // ── Step 8: Ensure Vector Search Index exists in Atlas ────
  try {
    const existingSearchIndexes = await collection.listSearchIndexes().toArray();
    const hasVectorIndex = existingSearchIndexes.some(
      (idx) => idx.name === 'vector_index'
    );

    if (!hasVectorIndex) {
      console.log('⚡ Creating Vector Search index in MongoDB Atlas...');
      await collection.createSearchIndex({
        name: 'vector_index',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 768,
              similarity: 'cosine',
            },
            {
              type: 'filter',
              path: 'metadata.category',
            },
          ],
        },
      });
      console.log('   ✅ Vector Search index created (will take ~1 min to become queryable)\n');
    } else {
      console.log('⚡ Vector Search index is present in MongoDB Atlas\n');
    }
  } catch (err) {
    console.warn('⚠️  Could not automatically verify/create search index:', (err as Error).message);
  }

  // ── Done ────────────────────────────────────────────────────
  await closeMongoDB();

  console.log('═══════════════════════════════════════════');
  console.log('✅ Ingestion Complete!');
  console.log('═══════════════════════════════════════════');
  console.log(`   📄 Documents processed: ${stats.totalDocuments}`);
  console.log(`   📦 Total chunks: ${stats.totalChunks}`);
  console.log(`   🆕 New chunks inserted: ${newChunks.length}`);
  console.log(`   ⏭️  Chunks skipped: ${skippedCount}`);
  console.log(`   🗑️  Stale chunks removed: ${staleIds.length}`);
  console.log('═══════════════════════════════════════════\n');
}

ingest().catch((error) => {
  console.error('\n❌ Ingestion failed:', error.message || error);
  process.exit(1);
});
