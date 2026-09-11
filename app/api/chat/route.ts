import { NextRequest } from 'next/server';
import { ragPipelineStream } from '@/lib/rag';
import type { ChatRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 *
 * Main chat endpoint — runs the full RAG pipeline and streams the response.
 *
 * Correction #3: Uses proper SSE named events:
 *
 *   event: token
 *   data: {"text":"..."}
 *
 *   event: sources
 *   data: [{"source":"skills.md","category":"skills","score":0.87}]
 *
 *   event: debug
 *   data: { ... }
 *
 *   event: error
 *   data: {"message":"..."}
 *
 *   event: done
 *   data: {}
 */
export async function POST(request: NextRequest) {
  try {
    // ── Validate request ──────────────────────────────────────
    const body: ChatRequest = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return Response.json(
        { error: 'Message is required and must be a string.' },
        { status: 400 }
      );
    }

    const message = body.message.trim();

    if (message.length === 0) {
      return Response.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return Response.json(
        { error: 'Message is too long. Maximum 2000 characters.' },
        { status: 400 }
      );
    }

    // ── Run RAG pipeline (streaming) ──────────────────────────
    const { stream, sources, debugInfo } = await ragPipelineStream(message, {
      debug: body.debug === true,
      history: body.history,
    });

    // ── Create SSE response stream ────────────────────────────
    const encoder = new TextEncoder();

    /** Format a proper SSE message with named event */
    function sseMessage(event: string, data: unknown): string {
      return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    }

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Stream text tokens
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(sseMessage('token', { text: chunk })));
          }

          // Send sources
          controller.enqueue(encoder.encode(sseMessage('sources', sources)));

          // Send debug info if requested
          if (debugInfo) {
            controller.enqueue(encoder.encode(sseMessage('debug', debugInfo)));
          }

          // Send done event
          controller.enqueue(encoder.encode(sseMessage('done', {})));

          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'An unexpected error occurred.';

          controller.enqueue(
            encoder.encode(sseMessage('error', { message: errorMessage }))
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Chat API Error]', error);

    let message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    if (
      message.includes('SSL alert number 80') ||
      message.includes('tlsv1 alert internal error')
    ) {
      message =
        'MongoDB Atlas blocked the connection (SSL Alert 80). In your MongoDB Atlas dashboard, go to "Network Access" and add "0.0.0.0/0" (Allow Access from Anywhere) so production deployments can connect.';
    }

    return Response.json(
      { error: `Failed to process your question: ${message}` },
      { status: 500 }
    );
  }
}
