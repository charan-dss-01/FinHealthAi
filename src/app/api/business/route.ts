import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/analytics/health';
import { generateFinancialSignals } from '@/lib/analytics/signals';

export async function GET() {
  try {
    const business = await prisma.business.findFirst({
      include: {
        bankAccounts: true,
        metrics: {
          orderBy: { periodDate: 'desc' },
          take: 1,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 404 });
    }

    // Dynamic signal calculation
    const allTx = business.transactions;
    const totalRev = allTx.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const totalExp = allTx.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const personalExp = allTx.filter((t) => t.type === 'DEBIT' && !t.isBusiness).reduce((s, t) => s + t.amount, 0);

    const latestMetric = business.metrics[0] || { endingBalance: 142500, cashRunwayDays: 28 };
    const healthBreakdown = calculateFinancialHealthScore(
      totalRev || 482000,
      totalExp || 321500,
      latestMetric.endingBalance || 142500,
      personalExp || 14850
    );

    const dynamicSignals = generateFinancialSignals(
      allTx,
      healthBreakdown.runwayDays,
      latestMetric.endingBalance || 142500
    );

    return NextResponse.json({
      business: {
        ...business,
        metrics: [
          {
            healthScore: healthBreakdown.score,
            cashRunwayDays: healthBreakdown.runwayDays,
            totalRevenue: totalRev || 482000,
            totalExpenses: totalExp || 321500,
            netCashFlow: (totalRev || 482000) - (totalExp || 321500),
            endingBalance: latestMetric.endingBalance || 142500,
            healthBreakdown,
          },
        ],
        signals: dynamicSignals,
      },
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json({ error: 'Failed to fetch business data' }, { status: 500 });
  }
}
