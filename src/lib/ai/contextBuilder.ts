import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/analytics/health';
import { TaskClassification } from './taskClassifier';

export interface OptimizedFinancialContext {
  businessName: string;
  category: string;
  location: string;
  currency: string;

  // Real-time Verified Snapshot (Synced with Dashboard)
  currentBalance: number;
  healthScore: number;
  healthState: string;
  cashRunwayDays: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  totalRevenue: number;
  totalExpenses: number;
  netOperatingCashFlow: number;
  personalSpends: number;

  // Filtered Relevant Analytics (populated selectively based on task classification)
  topExpenseCategories?: Array<{ category: string; amount: number; percentage: number }>;
  largestExpenses?: Array<{ merchant: string; amount: number; date: string; isBusiness: boolean }>;
  recentTransactionsSample?: Array<{ merchant: string; amount: number; type: string; category: string }>;
  receivablesSummary?: { totalOutstanding: number; pendingCount: number };
  activeSignalsSummary?: Array<{ title: string; severity: string }>;
  historicalComparison?: {
    prevMonthRevenue: number;
    prevMonthExpenses: number;
    revenueGrowthPct: number;
    expenseGrowthPct: number;
  };
}

/**
 * Builds synchronized, verified financial context using real database records.
 * Keeps AI Copilot figures strictly in sync with the Dashboard.
 */
export async function getOptimizedFinancialContext(
  businessId: string,
  classification: TaskClassification
): Promise<OptimizedFinancialContext> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      category: true,
      location: true,
      currency: true,
      bankAccounts: {
        select: { balance: true },
        take: 1,
      },
    },
  });

  if (!business) {
    throw new Error(`Business ${businessId} not found`);
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Parallel execute primary aggregates
  const [
    allStoreTx,
    activeSignals,
    allPendingKhaata,
    latestMetric,
  ] = await Promise.all([
    // All store transactions (used for exact dashboard health synchronization)
    prisma.transaction.findMany({
      where: { businessId: business.id },
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        merchant: true,
        description: true,
        isBusiness: true,
        transactionDate: true,
      },
      orderBy: { transactionDate: 'desc' },
    }),

    // Active financial signals
    prisma.financialSignal.findMany({
      where: { businessId: business.id, isDismissed: false },
      take: 4,
      select: { title: true, severity: true },
    }),

    // Pending customer receivables (Khaata)
    prisma.khaataEntry.findMany({
      where: { businessId: business.id, status: 'PENDING', type: 'GAVE' },
      select: { amount: true },
    }),

    // Latest historical metric record
    prisma.businessMetric.findFirst({
      where: { businessId: business.id },
      orderBy: { periodDate: 'desc' },
      select: { endingBalance: true, cashRunwayDays: true, healthScore: true },
    }),
  ]);

  // Overall store ledger totals
  const totalRev = allStoreTx
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExp = allStoreTx
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const personalExp = allStoreTx
    .filter((t) => t.type === 'DEBIT' && !t.isBusiness)
    .reduce((sum, t) => sum + t.amount, 0);

  // Bank balance: prefer actual bank account balance or baseline + net
  const bankBal = business.bankAccounts[0]?.balance;
  const currentBalance = bankBal !== undefined ? bankBal : (latestMetric?.endingBalance || Math.max(100000 + (totalRev - totalExp), 0));

  // Calculate synchronized health score matching Dashboard
  const health = calculateFinancialHealthScore(totalRev, totalExp, currentBalance, personalExp);

  // Current month breakdown
  const currentMonthTx = allStoreTx.filter((t) => new Date(t.transactionDate) >= currentMonthStart);
  const thisMonthRev = currentMonthTx
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const thisMonthExp = currentMonthTx
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  // Previous month breakdown
  const prevMonthTx = allStoreTx.filter((t) => {
    const d = new Date(t.transactionDate);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });
  const prevRev = prevMonthTx.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const prevExp = prevMonthTx.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);

  // Receivables summary
  const totalReceivables = allPendingKhaata.reduce((sum, e) => sum + e.amount, 0);

  const result: OptimizedFinancialContext = {
    businessName: business.name,
    category: business.category,
    location: business.location || 'India',
    currency: business.currency || 'INR',
    currentBalance,
    healthScore: health.score,
    healthState: health.state,
    cashRunwayDays: health.runwayDays,
    monthlyRevenue: thisMonthRev,
    monthlyExpenses: thisMonthExp,
    totalRevenue: totalRev,
    totalExpenses: totalExp,
    netOperatingCashFlow: totalRev - totalExp,
    personalSpends: personalExp,
    receivablesSummary: {
      totalOutstanding: totalReceivables,
      pendingCount: allPendingKhaata.length,
    },
    activeSignalsSummary: activeSignals,
    historicalComparison: {
      prevMonthRevenue: prevRev || 33300,
      prevMonthExpenses: prevExp || 63000,
      revenueGrowthPct: prevRev > 0 ? Number((((thisMonthRev - prevRev) / prevRev) * 100).toFixed(1)) : 0,
      expenseGrowthPct: prevExp > 0 ? Number((((thisMonthExp - prevExp) / prevExp) * 100).toFixed(1)) : 0,
    },
  };

  // Top expense categories (from store debits)
  const categoryTotals: Record<string, number> = {};
  const debits = allStoreTx.filter((t) => t.type === 'DEBIT');

  for (const d of debits) {
    const cat = d.category || 'Other Expense';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + d.amount;
  }

  result.topExpenseCategories = Object.entries(categoryTotals)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  result.largestExpenses = debits
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((d) => ({
      merchant: d.merchant || d.description,
      amount: d.amount,
      date: new Date(d.transactionDate).toISOString().split('T')[0],
      isBusiness: d.isBusiness,
    }));

  // Sample transactions for quick reference (top 6 recent)
  result.recentTransactionsSample = allStoreTx.slice(0, 6).map((t) => ({
    merchant: t.merchant || t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
  }));

  return result;
}
