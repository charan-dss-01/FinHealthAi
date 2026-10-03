import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/analytics/health';
import { generateFinancialSignals } from '@/lib/analytics/signals';

export const dynamic = 'force-dynamic';

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
          orderBy: { transactionDate: 'desc' },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 404 });
    }

    const allTx = business.transactions;
    const hasTransactions = allTx.length > 0;

    const totalRev = allTx
      .filter((t) => t.type === 'CREDIT')
      .reduce((s, t) => s + t.amount, 0);

    const totalExp = allTx
      .filter((t) => t.type === 'DEBIT')
      .reduce((s, t) => s + t.amount, 0);

    const personalExp = allTx
      .filter((t) => t.type === 'DEBIT' && !t.isBusiness)
      .reduce((s, t) => s + t.amount, 0);

    const bankAccount = business.bankAccounts[0];
    const initialBase = bankAccount?.balance ?? (hasTransactions ? 100000 + (totalRev - totalExp) : 0);
    const endingBalance = Math.max(initialBase, 0);

    const healthBreakdown = calculateFinancialHealthScore(
      totalRev,
      totalExp,
      endingBalance,
      personalExp
    );

    const dynamicSignals = hasTransactions
      ? generateFinancialSignals(allTx, healthBreakdown.runwayDays, endingBalance)
      : [];

    // Group transactions into real weekly buckets for charts
    const weeklyData: Record<string, { sales: number; spending: number }> = {
      'Week 1': { sales: 0, spending: 0 },
      'Week 2': { sales: 0, spending: 0 },
      'Week 3': { sales: 0, spending: 0 },
      'Week 4': { sales: 0, spending: 0 },
    };

    if (hasTransactions) {
      const now = new Date();
      for (const tx of allTx) {
        const txDate = new Date(tx.transactionDate);
        const daysDiff = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
        let weekKey = 'Week 4';
        if (daysDiff > 21) weekKey = 'Week 1';
        else if (daysDiff > 14) weekKey = 'Week 2';
        else if (daysDiff > 7) weekKey = 'Week 3';

        if (tx.type === 'CREDIT') {
          weeklyData[weekKey].sales += tx.amount;
        } else {
          weeklyData[weekKey].spending += tx.amount;
        }
      }
    }

    const chartTrendData = Object.entries(weeklyData).map(([month, val]) => ({
      month,
      sales: val.sales,
      spending: val.spending,
    }));

    return NextResponse.json({
      business: {
        ...business,
        hasTransactions,
        chartTrendData,
        metrics: [
          {
            healthScore: hasTransactions ? healthBreakdown.score : 0,
            cashRunwayDays: hasTransactions ? healthBreakdown.runwayDays : 0,
            totalRevenue: totalRev,
            totalExpenses: totalExp,
            netCashFlow: totalRev - totalExp,
            endingBalance,
            personalExpenses: personalExp,
            hasData: hasTransactions,
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
