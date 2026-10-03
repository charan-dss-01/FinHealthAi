import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCFOAdvisorResponse, BusinessContext } from '@/lib/ai/copilot';
import { calculateFinancialHealthScore } from '@/lib/analytics/health';
import { generateFinancialSignals } from '@/lib/analytics/signals';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, businessId, language = 'en' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    let business = businessId
      ? await prisma.business.findUnique({
          where: { id: businessId },
          include: {
            metrics: { orderBy: { periodDate: 'desc' }, take: 1 },
            transactions: { orderBy: { transactionDate: 'desc' }, take: 30 },
          },
        })
      : await prisma.business.findFirst({
          orderBy: { createdAt: 'desc' },
          include: {
            metrics: { orderBy: { periodDate: 'desc' }, take: 1 },
            transactions: { orderBy: { transactionDate: 'desc' }, take: 30 },
          },
        });

    if (!business) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 404 });
    }

    const transactions = business.transactions;
    const totalRev = transactions.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0) || 482000;
    const totalExp = transactions.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0) || 321500;
    const personalExp = transactions.filter((t) => t.type === 'DEBIT' && !t.isBusiness).reduce((s, t) => s + t.amount, 0) || 14850;

    const latestMetric = business.metrics[0] || { endingBalance: 142500, cashRunwayDays: 28 };
    const health = calculateFinancialHealthScore(totalRev, totalExp, latestMetric.endingBalance || 142500, personalExp);
    const signals = generateFinancialSignals(transactions, health.runwayDays, latestMetric.endingBalance || 142500);

    const ctx: BusinessContext = {
      name: business.name,
      category: business.category,
      location: business.location || 'India',
      healthScore: health.score,
      healthState: health.state,
      cashRunwayDays: health.runwayDays,
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netCashFlow: totalRev - totalExp,
      endingBalance: latestMetric.endingBalance || 142500,
      personalExpenses: personalExp,
      activeSignals: signals.map((s) => ({ title: s.title, severity: s.severity, description: s.description })),
      recentTransactions: transactions.map((t) => ({
        merchant: t.merchant || t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        isBusiness: t.isBusiness,
      })),
      preferredLanguage: language,
    };

    // Generate AI CFO response in selected language using Gemma 4
    const result = await getCFOAdvisorResponse(message, ctx);

    // Save conversation history to SQLite DB
    try {
      let conversation = await prisma.aIConversation.findFirst({
        where: { businessId: business.id },
      });

      if (!conversation) {
        conversation = await prisma.aIConversation.create({
          data: {
            businessId: business.id,
            title: 'Multilingual CFO Consultation',
          },
        });
      }

      await prisma.aIMessage.createMany({
        data: [
          { conversationId: conversation.id, role: 'user', content: message },
          { conversationId: conversation.id, role: 'assistant', content: result.reply },
        ],
      });
    } catch (dbErr) {
      console.warn('Could not persist chat history:', dbErr);
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      modelUsed: result.modelUsed,
      isGemma: result.isGemma,
      contextSnapshot: {
        healthScore: health.score,
        runwayDays: health.runwayDays,
        healthState: health.state,
      },
    });
  } catch (error) {
    console.error('Copilot API Error:', error);
    return NextResponse.json({ error: 'Failed to process copilot query' }, { status: 500 });
  }
}
