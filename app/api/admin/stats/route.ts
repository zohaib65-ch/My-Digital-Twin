import { NextRequest } from 'next/server';
import { connectToMongoDB, getChunksCollection } from '@/lib/mongodb';
import type { AdminStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 *
 * Returns knowledge base statistics.
 * Protected by ADMIN_SECRET header.
 */
export async function GET(request: NextRequest) {
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

    // ── Query MongoDB ─────────────────────────────────────────
    await connectToMongoDB();
    const collection = getChunksCollection();

    const totalChunks = await collection.countDocuments();

    // Get category breakdown
    const categoryPipeline = [
      {
        $group: {
          _id: '$metadata.category',
          count: { $sum: 1 },
        },
      },
    ];

    const categoryResults = await collection
      .aggregate<{ _id: string; count: number }>(categoryPipeline)
      .toArray();

    const categories: Record<string, number> = {};
    for (const result of categoryResults) {
      categories[result._id] = result.count;
    }

    // Get unique document count
    const uniqueSources = await collection.distinct('metadata.source');

    // Get last ingestion timestamp
    const latestChunk = await collection
      .findOne({}, { sort: { createdAt: -1 }, projection: { createdAt: 1 } });

    const stats: AdminStats = {
      totalChunks,
      totalDocuments: uniqueSources.length,
      categories,
      lastIngestion: latestChunk?.createdAt,
    };

    return Response.json(stats);
  } catch (error) {
    console.error('[Admin Stats Error]', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    return Response.json(
      { error: `Failed to fetch stats: ${message}` },
      { status: 500 }
    );
  }
}
