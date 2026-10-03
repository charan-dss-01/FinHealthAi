import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseBankStatementCSV } from '@/lib/ingestion/parser';
import { normalizeTransactionDescription } from '@/lib/ingestion/normalizer';
import { classifyTransaction } from '@/lib/ml/classifier';
import { detectComingling } from '@/lib/ingestion/comingling';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let csvContent = '';
    let businessId = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      businessId = (formData.get('businessId') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      csvContent = await file.text();
    } else {
      const body = await req.json();
      csvContent = body.csvContent || '';
      businessId = body.businessId || '';
    }

    if (!csvContent.trim()) {
      return NextResponse.json({ error: 'Bank statement content is empty.' }, { status: 400 });
    }

    // Get active business
    let business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!business) {
      return NextResponse.json({ error: 'No business found to attach statement to.' }, { status: 404 });
    }

    // Get primary bank account
    let bankAccount = await prisma.bankAccount.findFirst({
      where: { businessId: business.id },
    });

    if (!bankAccount) {
      bankAccount = await prisma.bankAccount.create({
        data: {
          businessId: business.id,
          bankName: 'Primary Bank A/c',
          accountNumber: 'XX' + Math.floor(1000 + Math.random() * 9000),
          accountType: 'CURRENT',
        },
      });
    }

    // 1. Parse statement lines
    const parsedRows = parseBankStatementCSV(csvContent);
    if (parsedRows.length === 0) {
      return NextResponse.json({ error: 'Failed to parse any valid transactions from statement.' }, { status: 422 });
    }

    const processedTransactions = [];

    // 2. Process each raw row through Normalizer, ML Classifier, and Co-mingling Detector
    for (const row of parsedRows) {
      const normalized = normalizeTransactionDescription(row.description);
      const classification = classifyTransaction(row.description, normalized.cleanMerchant, row.amount, row.type);
      const comingling = detectComingling(normalized.cleanMerchant, row.description, classification.category);

      const dbTx = await prisma.transaction.create({
        data: {
          accountId: bankAccount.id,
          businessId: business.id,
          merchant: normalized.cleanMerchant,
          description: row.description,
          amount: row.amount,
          type: row.type,
          category: classification.category,
          isBusiness: comingling.isBusiness,
          confidence: classification.confidence,
          channel: normalized.channel,
          reference: normalized.referenceNumber,
          transactionDate: row.date,
        },
      });

      processedTransactions.push(dbTx);
    }

    // 3. Recalculate Business Metric Snapshot after ingestion
    const allTx = await prisma.transaction.findMany({
      where: { businessId: business.id },
    });

    const totalRevenue = allTx.filter((t) => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTx.filter((t) => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalRevenue - totalExpenses;
    const avgDailyExpense = totalExpenses / 30 || 1000;
    const endingBalance = Math.max(100000 + netCashFlow, 10000);
    const cashRunwayDays = Math.max(Math.floor(endingBalance / avgDailyExpense), 1);

    let healthScore = 80;
    if (netCashFlow < 0) healthScore -= 20;
    if (cashRunwayDays < 15) healthScore -= 25;

    await prisma.businessMetric.create({
      data: {
        businessId: business.id,
        periodType: 'MONTHLY',
        periodDate: new Date(),
        totalRevenue,
        totalExpenses,
        netCashFlow,
        endingBalance,
        cashRunwayDays,
        healthScore,
      },
    });

    return NextResponse.json({
      success: true,
      count: processedTransactions.length,
      transactions: processedTransactions.slice(0, 10),
      summary: {
        totalRevenue,
        totalExpenses,
        netCashFlow,
        cashRunwayDays,
        healthScore,
      },
    });
  } catch (error) {
    console.error('Ingestion API Error:', error);
    return NextResponse.json({ error: 'Failed to process bank statement.' }, { status: 500 });
  }
}
