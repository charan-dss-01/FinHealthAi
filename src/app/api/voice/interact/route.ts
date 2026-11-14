import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeVoiceFinancialTool } from '@/lib/voice/tools';
import { executeCopilotPipeline } from '@/lib/ai/copilotService';
import { classifyFinancialTask } from '@/lib/ai/taskClassifier';
import { getOptimizedFinancialContext } from '@/lib/ai/contextBuilder';
import Groq, { toFile } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let query = body.query?.trim() || '';
    const { audioBase64, mimeType = 'audio/webm', language = 'en', businessId: reqBusinessId } = body;

    // Server-side STT: If client sent raw microphone audio, transcribe with Groq Whisper or Gemini Flash
    if (!query && audioBase64) {
      if (process.env.GROQ_API_KEY) {
        try {
          const buffer = Buffer.from(audioBase64, 'base64');
          const cleanMime = mimeType?.split(';')[0] || 'audio/webm';
          const file = await toFile(buffer, 'mic_query.webm', { type: cleanMime });
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
          const transcriptionParams: any = {
            file,
            model: 'whisper-large-v3-turbo',
          };
          if (language && language !== 'en') {
            transcriptionParams.language = language;
          }
          const transcription = await groq.audio.transcriptions.create(transcriptionParams);
          query = transcription.text?.trim() || '';
        } catch (groqErr) {
          console.warn('[VoiceInteract] Groq Whisper transcription error:', groqErr);
        }
      }

      if (!query && process.env.GEMINI_API_KEY) {
        try {
          const cleanMime = mimeType?.split(';')[0] || 'audio/webm';
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const gRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType: cleanMime, data: audioBase64 } },
                  { text: 'Transcribe what the merchant said in this audio. Return ONLY the plain transcription text, with no explanation.' },
                ],
              }],
            }),
          });
          const gData = await gRes.json();
          const candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            query = candidateText.trim();
          }
        } catch (gErr) {
          console.warn('[VoiceInteract] Gemini audio transcription error:', gErr);
        }
      }
    }

    if (!query) {
      return NextResponse.json({
        success: true,
        query: '(No words detected)',
        transcript: {
          id: `cfo-${Date.now()}`,
          speaker: 'CFO',
          text: "I couldn't hear clearly. Please tap the microphone and speak your question again!",
          spokenText: "I couldn't hear clearly. Please tap the microphone and speak your question again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });
    }

    let businessId = reqBusinessId;
    if (!businessId) {
      const b = await prisma.business.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true },
      });
      if (b) businessId = b.id;
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found.' }, { status: 404 });
    }

    const classification = classifyFinancialTask(query, false);
    const qLower = query.toLowerCase();

    let toolExecuted: { name: string; summary: string } | undefined;

    // Detect if a specific high-confidence financial tool should be invoked directly
    if (qLower.includes('khaata') || qLower.includes('udhar') || qLower.includes('pending customer') || qLower.includes('ఖాతా') || qLower.includes('बकाया')) {
      const toolRes = await executeVoiceFinancialTool(businessId, 'get_customer_khaata_balances');
      if (toolRes.success) {
        toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
      }
    } else if (qLower.includes('overdue') || qLower.includes('past due') || qLower.includes('గడువు')) {
      const toolRes = await executeVoiceFinancialTool(businessId, 'get_overdue_payments');
      if (toolRes.success) {
        toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
      }
    } else if (qLower.includes('runway') || qLower.includes('how long') || qLower.includes('రన్‌వే') || qLower.includes('दिन चलेगी')) {
      const toolRes = await executeVoiceFinancialTool(businessId, 'get_cash_runway');
      if (toolRes.success) {
        toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
      }
    } else if (qLower.includes('health') || qLower.includes('score') || qLower.includes('ఆరోగ్య') || qLower.includes('स्कोर')) {
      const toolRes = await executeVoiceFinancialTool(businessId, 'get_financial_health_score');
      if (toolRes.success) {
        toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
      }
    } else if (qLower.includes('hire') || qLower.includes('helper') || qLower.includes('salary') || qLower.includes('afford')) {
      const salaryMatch = query.match(/\d{4,6}/);
      const staffSalary = salaryMatch ? parseInt(salaryMatch[0], 10) : 18000;
      const toolRes = await executeVoiceFinancialTool(businessId, 'run_what_if_simulation', {
        newMonthlyStaffCost: staffSalary,
      });
      if (toolRes.success) {
        toolExecuted = { name: toolRes.toolName, summary: toolRes.voiceSummary };
      }
    }

    // Execute standard Copilot pipeline (Gemini Primary -> Groq Fallback -> Deterministic engine)
    const copilotRes = await executeCopilotPipeline({
      businessId,
      query,
      language,
    });

    // Generate concise speech text suitable for natural voice response
    const rawReply = copilotRes.reply;
    
    // Clean reply for spoken audio: strip markdown syntax, hashes, asterisks
    let spokenText = rawReply
      .replace(/###\s+\*\*.*?\*\*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/•|\*|-/g, '')
      .replace(/---/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    // If tool was executed, prepend or prioritize the direct verified spoken answer
    if (toolExecuted) {
      spokenText = `${toolExecuted.summary} ${spokenText.slice(0, 300)}`;
    }

    return NextResponse.json({
      success: true,
      query,
      transcript: {
        id: `cfo-${Date.now()}`,
        speaker: 'CFO',
        text: rawReply,
        spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecuted,
      },
      provider: copilotRes.provider,
      modelUsed: copilotRes.modelUsed,
      toolExecuted,
      latencyMs: copilotRes.latencyMs,
    });
  } catch (err: any) {
    console.error('[VoiceInteract API Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'Failed to process voice interaction.',
      details: err.message,
    }, { status: 500 });
  }
}
