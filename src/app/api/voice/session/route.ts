import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { VOICE_FINANCIAL_TOOL_DECLARATIONS } from '@/lib/voice/tools';
import { createVoiceSession } from '@/lib/voice/sessionStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('finhealth_session')?.value;

    let userId: string | undefined;
    let businessId: string | undefined;

    if (sessionCookie) {
      try {
        const parsed = JSON.parse(sessionCookie);
        userId = parsed.userId;
        businessId = parsed.businessId;
      } catch {}
    }

    // Resolve business
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { owner: true },
      });
    }

    if (!business) {
      // Fallback for development/demo: take the latest business
      business = await prisma.business.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { owner: true },
      });
    }

    if (!business) {
      return NextResponse.json({ error: 'No business account found for voice session' }, { status: 404 });
    }

    const effectiveUserId = userId || business.ownerId || 'demo-user';
    const effectiveBusinessId = business.id;

    // Generate secure session token using shared sessionStore
    const { token, sessionId } = createVoiceSession(effectiveBusinessId, effectiveUserId);

    const ownerName = business.name.split(' ')[0] || 'Merchant';
    const preferredLang = business.owner?.preferredLanguage || 'en';

    // Check Gemini Live readiness
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
    const mode = hasGeminiKey ? 'GEMINI_LIVE' : 'DEGRADED_FALLBACK';

    return NextResponse.json({
      success: true,
      sessionId,
      token,
      businessId: effectiveBusinessId,
      businessName: business.name,
      merchantName: ownerName,
      preferredLanguage: preferredLang,
      voiceName: 'Puck', // Natural conversational voice
      mode,
      tools: VOICE_FINANCIAL_TOOL_DECLARATIONS,
      wsPort: 3001,
      wsPath: `/voice?token=${token}`,
    });
  } catch (error: any) {
    console.error('[VoiceSession] Error creating voice session:', error);
    return NextResponse.json({ error: 'Failed to initialize voice session' }, { status: 500 });
  }
}
