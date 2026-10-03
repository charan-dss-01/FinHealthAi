import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/analytics/health';
import { classifyTransaction } from '@/lib/ml/classifier';
import { detectComingling } from '@/lib/ingestion/comingling';

export const dynamic = 'force-dynamic';

async function recalculateBusinessMetrics(businessId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { businessId },
  });

  const totalRevenue = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const personalExpenses = transactions
    .filter((t) => t.type === 'DEBIT' && !t.isBusiness)
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalRevenue - totalExpenses;
  
  // Calculate ending balance from initial baseline + net flow
  const initialBase = 100000;
  const endingBalance = Math.max(initialBase + netCashFlow, 5000);

  const healthBreakdown = calculateFinancialHealthScore(
    totalRevenue,
    totalExpenses,
    endingBalance,
    personalExpenses
  );

  // Update bank account balance
  const bankAccount = await prisma.bankAccount.findFirst({
    where: { businessId },
  });

  if (bankAccount) {
    await prisma.bankAccount.update({
      where: { id: bankAccount.id },
      data: { balance: endingBalance },
    });
  }

  // Create or update latest business metric snapshot
  await prisma.businessMetric.create({
    data: {
      businessId,
      periodType: 'MONTHLY',
      periodDate: new Date(),
      totalRevenue,
      totalExpenses,
      netCashFlow,
      endingBalance,
      cashRunwayDays: healthBreakdown.runwayDays,
      healthScore: healthBreakdown.score,
    },
  });

  return { totalRevenue, totalExpenses, netCashFlow, endingBalance, healthBreakdown };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const filter = searchParams.get('filter'); // 'ALL' | 'BUSINESS' | 'PERSONAL'
    const search = searchParams.get('search') || '';

    let business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!business) {
      return NextResponse.json({ error: 'No business profile found' }, { status: 404 });
    }

    const whereClause: any = { businessId: business.id };

    if (filter === 'BUSINESS') whereClause.isBusiness = true;
    if (filter === 'PERSONAL') whereClause.isBusiness = false;

    if (search) {
      whereClause.OR = [
        { merchant: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { transactionDate: 'desc' },
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Transactions GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      merchant,
      amount,
      type = 'DEBIT',
      category,
      description,
      isBusiness,
      transactionDate,
      businessId,
    } = body;

    if (!amount || !merchant) {
      return NextResponse.json({ error: 'Merchant and amount are required.' }, { status: 400 });
    }

    let business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    let bankAccount = await prisma.bankAccount.findFirst({
      where: { businessId: business.id },
    });

    if (!bankAccount) {
      bankAccount = await prisma.bankAccount.create({
        data: {
          businessId: business.id,
          bankName: 'Primary Current A/c',
          accountNumber: 'XX' + Math.floor(1000 + Math.random() * 9000),
          accountType: 'CURRENT',
          balance: 100000,
        },
      });
    }

    // Determine category and co-mingling if not provided
    const parsedAmount = Number(amount);
    const assignedCategory = category || (type === 'CREDIT' ? 'Customer Revenue' : 'General Store Expense');
    const assignedIsBusiness = isBusiness !== undefined ? Boolean(isBusiness) : !assignedCategory.toLowerCase().includes('personal');

    const transaction = await prisma.transaction.create({
      data: {
        accountId: bankAccount.id,
        businessId: business.id,
        merchant,
        description: description || merchant,
        amount: parsedAmount,
        type: type.toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        category: assignedCategory,
        isBusiness: assignedIsBusiness,
        confidence: 1.0,
        channel: 'MANUAL',
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    });

    // Automatically recalculate metrics
    const updatedMetrics = await recalculateBusinessMetrics(business.id);

    return NextResponse.json({ success: true, transaction, metrics: updatedMetrics });
  } catch (error) {
    console.error('Transactions POST Error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, category, isBusiness, merchant, amount, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (isBusiness !== undefined) updateData.isBusiness = Boolean(isBusiness);
    if (merchant !== undefined) updateData.merchant = merchant;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    // Recalculate metrics
    const updatedMetrics = await recalculateBusinessMetrics(updated.businessId);

    return NextResponse.json({ success: true, transaction: updated, metrics: updatedMetrics });
  } catch (error) {
    console.error('Transactions PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    const deleted = await prisma.transaction.delete({
      where: { id },
    });

    // Recalculate metrics
    const updatedMetrics = await recalculateBusinessMetrics(deleted.businessId);

    return NextResponse.json({ success: true, metrics: updatedMetrics });
  } catch (error) {
    console.error('Transactions DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
