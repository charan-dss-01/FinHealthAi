import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeCopilotPipeline, streamCopilotPipeline } from '@/lib/ai/copilotService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, businessId, language = 'en', image, stream = false } = body;

    if ((!message || !message.trim()) && !image) {
      return NextResponse.json({ error: 'Message or image cannot be empty.' }, { status: 400 });
    }

    // Resolve target business
    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const b = await prisma.business.findFirst({ orderBy: { createdAt: 'desc' }, select: { id: true } });
      if (b) targetBusinessId = b.id;
    }

    if (!targetBusinessId) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 404 });
    }

    const effectiveQuery = message || 'Please analyze this uploaded receipt/invoice document in detail.';

    // Check if client requested streaming
    if (stream) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          for await (const chunk of streamCopilotPipeline({
            businessId: targetBusinessId,
            query: effectiveQuery,
            language,
            image: image ? { mimeType: image.mimeType, data: image.base64 || image.data } : undefined,
          })) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          await writer.write(encoder.encode(`data: [DONE]\n\n`));
        } catch (err: any) {
          console.error('[Copilot Stream Error]:', err);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        } finally {
          await writer.close();
        }
      })();

      return new Response(responseStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Normal non-streamed execution
    const result = await executeCopilotPipeline({
      businessId: targetBusinessId,
      query: effectiveQuery,
      language,
      image: image ? { mimeType: image.mimeType, data: image.base64 || image.data } : undefined,
    });

    // Save conversation history to SQLite DB in background
    (async () => {
      try {
        let conversation = await prisma.aIConversation.findFirst({
          where: { businessId: targetBusinessId },
        });

        if (!conversation) {
          conversation = await prisma.aIConversation.create({
            data: {
              businessId: targetBusinessId,
              title: 'Multilingual CFO Consultation',
            },
          });
        }

        await prisma.aIMessage.createMany({
          data: [
            { conversationId: conversation.id, role: 'user', content: effectiveQuery },
            { conversationId: conversation.id, role: 'assistant', content: result.reply },
          ],
        });
      } catch (dbErr) {
        console.warn('Could not persist chat history:', dbErr);
      }
    })();

    return NextResponse.json({
      success: true,
      reply: result.reply,
      modelUsed: result.modelUsed,
      provider: result.provider,
      latencyMs: result.latencyMs,
      cached: result.cached,
      taskCategory: result.taskCategory,
      extractedReceipt: result.extractedReceipt,
      contextSnapshot: result.contextSnapshot,
    });
  } catch (error: any) {
    console.error('Copilot API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process copilot query' }, { status: 500 });
  }
}
