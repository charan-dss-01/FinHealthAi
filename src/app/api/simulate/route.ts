import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runWhatIfSimulation, SimulationParams } from '@/lib/analytics/simulator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      revenueChangePct = 0,
      expenseChangePct = 0,
      newMonthlyStaffCost = 0,
      eliminatePersonalSpend = false,
      businessId,
    } = body;

    let business = businessId
      ? await prisma.business.findUnique({
          where: { id: businessId },
          include: {
            metrics: { orderBy: { periodDate: 'desc' }, take: 1 },
            transactions: true,
          },
        })
      : await prisma.business.findFirst({
          orderBy: { createdAt: 'desc' },
          include: {
            metrics: { orderBy: { periodDate: 'desc' }, take: 1 },
            transactions: true,
          },
        });

    if (!business) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 404 });
    }

    const transactions = business.transactions;
    const totalRev = transactions.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0) || 482000;
    const totalExp = transactions.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0) || 321500;
    const personalExp = transactions.filter((t) => t.type === 'DEBIT' && !t.isBusiness).reduce((s, t) => s + t.amount, 0) || 14850;

    const latestMetric = business.metrics[0] || { endingBalance: 142500 };
    const currentBalance = latestMetric.endingBalance || 142500;

    const params: SimulationParams = {
      revenueChangePct: Number(revenueChangePct),
      expenseChangePct: Number(expenseChangePct),
      newMonthlyStaffCost: Number(newMonthlyStaffCost),
      eliminatePersonalSpend: Boolean(eliminatePersonalSpend),
    };

    const simulationResult = runWhatIfSimulation(
      currentBalance,
      totalRev,
      totalExp,
      personalExp,
      params
    );

    return NextResponse.json({ success: true, simulation: simulationResult });
  } catch (error) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ error: 'Failed to run scenario simulation' }, { status: 500 });
  }
}
