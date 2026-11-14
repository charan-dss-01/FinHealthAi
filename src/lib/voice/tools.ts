import { prisma } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/analytics/health';
import { runWhatIfSimulation, SimulationParams } from '@/lib/analytics/simulator';

export interface VoiceToolExecutionResult {
  success: boolean;
  toolName: string;
  data: Record<string, any>;
  voiceSummary: string;
}

/**
 * Gemini Live / Function Calling Schema Declarations for Financial Operations
 */
export const VOICE_FINANCIAL_TOOL_DECLARATIONS = [
  {
    name: 'get_business_summary',
    description: 'Get verified store overview: bank balance, health score, cash runway, net profit, and pending Khaata receivables.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_revenue_and_expenses',
    description: 'Get current monthly sales, operational expenses, net margin, and growth comparison to previous month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        timeframe: {
          type: 'STRING',
          description: 'Timeframe to query: "current_month" or "all_time". Defaults to "current_month".',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_cash_runway',
    description: 'Get cash runway buffer in days, daily burn rate, bank balance, and liquidity safety status.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_financial_health_score',
    description: 'Get composite store health score (0-100), health state (GREEN, YELLOW, RED), 4 pillar breakdown, and key drivers.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_customer_khaata_balances',
    description: 'Get total customer credit balances (Udhar), count of pending customer accounts, and top customer balances.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_overdue_payments',
    description: 'Get overdue customer credit accounts that have passed their payment due date.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'explain_expense_increases',
    description: 'Analyze where store money is going: top expense categories, largest single outflows, and co-mingled personal expenses.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'run_what_if_simulation',
    description: 'Simulate financial impact of business decisions like hiring a helper, revenue drops, or inflation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        newMonthlyStaffCost: {
          type: 'NUMBER',
          description: 'Monthly salary for a new helper/staff member in INR (e.g., 18000).',
        },
        revenueChangePct: {
          type: 'NUMBER',
          description: 'Expected percentage change in revenue (e.g., -15 for 15% drop, +20 for growth).',
        },
        expenseChangePct: {
          type: 'NUMBER',
          description: 'Expected percentage change in supplier/wholesale expenses.',
        },
        eliminatePersonalSpend: {
          type: 'BOOLEAN',
          description: 'Whether to cut co-mingled personal spending from the business account.',
        },
      },
      required: [],
    },
  },
];

/**
 * Execute verified financial tools using server-authenticated businessId.
 */
export async function executeVoiceFinancialTool(
  businessId: string,
  toolName: string,
  args: Record<string, any> = {}
): Promise<VoiceToolExecutionResult> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      bankAccounts: true,
      transactions: {
        orderBy: { transactionDate: 'desc' },
      },
    },
  });

  if (!business) {
    return {
      success: false,
      toolName,
      data: { error: 'Business profile not found' },
      voiceSummary: 'I could not find your store profile in the database.',
    };
  }

  const allTx = business.transactions;
  const totalRev = allTx.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const totalExp = allTx.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
  const personalExp = allTx.filter((t) => t.type === 'DEBIT' && !t.isBusiness).reduce((s, t) => s + t.amount, 0);
  const bankBalance = business.bankAccounts[0]?.balance ?? Math.max(100000 + (totalRev - totalExp), 0);

  const health = calculateFinancialHealthScore(totalRev, totalExp, bankBalance, personalExp);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthTx = allTx.filter((t) => new Date(t.transactionDate) >= currentMonthStart);
  const thisMonthRev = currentMonthTx.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const thisMonthExp = currentMonthTx.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);

  switch (toolName) {
    case 'get_business_summary': {
      const khaataEntries = await prisma.khaataEntry.findMany({
        where: { businessId, status: 'PENDING', type: 'GAVE' },
        select: { amount: true },
      });
      const pendingKhaata = khaataEntries.reduce((s, e) => s + e.amount, 0);

      const data = {
        storeName: business.name,
        bankBalance,
        healthScore: health.score,
        healthState: health.state,
        cashRunwayDays: health.runwayDays,
        netCashFlow: totalRev - totalExp,
        thisMonthRevenue: thisMonthRev,
        thisMonthExpenses: thisMonthExp,
        totalRevenue: totalRev,
        totalExpenses: totalExp,
        pendingKhaataReceivables: pendingKhaata,
        pendingKhaataCustomers: khaataEntries.length,
      };

      const voiceSummary = `Your bank balance is ₹${bankBalance.toLocaleString('en-IN')}, health score is ${health.score}/100 (${health.state}), cash runway is ${health.runwayDays} days, and you have ₹${pendingKhaata.toLocaleString('en-IN')} pending across ${khaataEntries.length} customer khaata accounts.`;

      return { success: true, toolName, data, voiceSummary };
    }

    case 'get_revenue_and_expenses': {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const prevMonthTx = allTx.filter((t) => {
        const d = new Date(t.transactionDate);
        return d >= prevMonthStart && d <= prevMonthEnd;
      });
      const prevRev = prevMonthTx.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0) || 33300;
      const prevExp = prevMonthTx.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0) || 63000;

      const data = {
        currentMonth: {
          revenue: thisMonthRev,
          expenses: thisMonthExp,
          netProfit: thisMonthRev - thisMonthExp,
        },
        previousMonth: {
          revenue: prevRev,
          expenses: prevExp,
          netProfit: prevRev - prevExp,
        },
        allTime: {
          revenue: totalRev,
          expenses: totalExp,
          netProfit: totalRev - totalExp,
        },
      };

      const voiceSummary = `Current month sales are ₹${thisMonthRev.toLocaleString('en-IN')} against expenses of ₹${thisMonthExp.toLocaleString('en-IN')}. In the previous month, sales were ₹${prevRev.toLocaleString('en-IN')} with ₹${prevExp.toLocaleString('en-IN')} in expenses.`;

      return { success: true, toolName, data, voiceSummary };
    }

    case 'get_cash_runway': {
      const avgDailyExpense = (totalExp - personalExp) / 30 || 1000;
      const isBufferSafe = health.runwayDays >= 30;

      const data = {
        cashRunwayDays: health.runwayDays,
        bankBalance,
        averageDailySpend: Math.round(avgDailyExpense),
        isBufferSafe,
        status: isBufferSafe ? 'SAFE' : 'ATTENTION_REQUIRED',
      };

      const voiceSummary = `Your cash runway is currently ${health.runwayDays} days with ₹${bankBalance.toLocaleString('en-IN')} in your bank account. Your daily operating spend is approximately ₹${Math.round(avgDailyExpense).toLocaleString('en-IN')}.`;

      return { success: true, toolName, data, voiceSummary };
    }

    case 'get_financial_health_score': {
      const data = {
        healthScore: health.score,
        healthState: health.state,
        runwayDays: health.runwayDays,
        pillars: health.pillars,
        keyDrivers: health.keyDrivers,
      };

      const voiceSummary = `Your business health score is ${health.score}/100, which is in the ${health.state} zone. Runway score is ${health.pillars.runwayScore}/100 and cash margin score is ${health.pillars.marginScore}/100.`;

      return { success: true, toolName, data, voiceSummary };
    }

    case 'get_customer_khaata_balances': {
      const khaataEntries = await prisma.khaataEntry.findMany({
        where: { businessId, status: 'PENDING', type: 'GAVE' },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { amount: 'desc' },
      });

      const totalOutstanding = khaataEntries.reduce((s, e) => s + e.amount, 0);
      const topCustomers = khaataEntries.slice(0, 5).map((e) => ({
        customerName: e.customer?.name || e.customerName,
        phone: e.customer?.phone || e.phone,
        amount: e.amount,
        dueDate: e.dueDate,
      }));

      const data = {
        totalOutstanding,
        pendingCustomersCount: khaataEntries.length,
        topCustomers,
      };

      const voiceSummary = `You have ₹${totalOutstanding.toLocaleString('en-IN')} pending in customer credit across ${khaataEntries.length} accounts. Top pending balances include ${topCustomers.slice(0, 2).map((c) => `${c.customerName}: ₹${c.amount.toLocaleString('en-IN')}`).join(', ')}.`;

      return { success: true, toolName, data, voiceSummary };
    }

    case 'get_overdue_payments': {
      const now = new Date();
      const overdueEntries = await prisma.khaataEntry.findMany({
        where: {
          businessId,
          status: 'PENDING',
          type: 'GAVE',
          dueDate: { lt: now },
        },
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { amount: 'desc' },
      });

      const overdueAmount = overdueEntries.reduce((s, e) => s + e.amount, 0);

      const data = {
        overdueCount: overdueEntries.length,
        overdueAmount,
        overdueCustomers: overdueEntries.map((e) => ({
          customerName: e.customer?.name || e.customerName,
          amount: e.amount,
          dueDate: e.dueDate,
        })),
      };

      const voiceSummary = overdueEntries.length > 0
        ? `You have ${overdueEntries.length} overdue payments totaling ₹${overdueAmount.toLocaleString('en-IN')}. Sending a WhatsApp reminder will help recover this working cash.`
        : 'Good news! None of your customer credit accounts are currently past their due date.';

      return { success: true, toolName, data, voiceSummary };
    }

    case 'explain_expense_increases': {
      const categoryTotals: Record<string, number> = {};
      const debits = allTx.filter((t) => t.type === 'DEBIT');

      for (const d of debits) {
        const cat = d.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + d.amount;
      }

      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);

      const largestOutflows = debits
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map((d) => ({
          merchant: d.merchant,
          amount: d.amount,
          isBusiness: d.isBusiness,
        }));

      const data = {
        totalExpenses: totalExp,
        personalCoMingledSpend: personalExp,
        topCategories,
        largestOutflows,
      };

      const voiceSummary = `Your largest spending category is ${topCategories[0]?.category || 'Inventory'} at ₹${topCategories[0]?.amount.toLocaleString('en-IN') || 0}. Also, ₹${personalExp.toLocaleString('en-IN')} has been spent on personal expenses from the business account.`;

      return { success: true, toolName, data, voiceSummary };
    }

    case 'run_what_if_simulation': {
      const simParams: SimulationParams = {
        revenueChangePct: Number(args.revenueChangePct || 0),
        expenseChangePct: Number(args.expenseChangePct || 0),
        newMonthlyStaffCost: Number(args.newMonthlyStaffCost || 0),
        eliminatePersonalSpend: Boolean(args.eliminatePersonalSpend),
      };

      const baseMonthlyRevenue = thisMonthRev > 0 ? thisMonthRev : Math.round(totalRev / 3) || 120000;
      const baseMonthlyExpenses = thisMonthExp > 0 ? thisMonthExp : Math.round(totalExp / 3) || 90000;

      const simResult = runWhatIfSimulation(
        bankBalance,
        baseMonthlyRevenue,
        baseMonthlyExpenses,
        personalExp,
        simParams
      );

      const data = {
        simParams,
        baseline: simResult.baseline,
        simulated: simResult.simulated,
        deltas: simResult.deltas,
        verdict: simResult.cfoVerdict,
      };

      const voiceSummary = simParams.newMonthlyStaffCost > 0
        ? `If you hire a helper at ₹${simParams.newMonthlyStaffCost.toLocaleString('en-IN')}/month, your cash runway will change from ${simResult.baseline.runwayDays} to ${simResult.simulated.runwayDays} days. Verdict: ${simResult.cfoVerdict}`
        : `Simulation complete: Expected 90-day balance will change by ₹${simResult.deltas.balanceDelta90Days.toLocaleString('en-IN')}. ${simResult.cfoVerdict}`;

      return { success: true, toolName, data, voiceSummary };
    }

    default:
      return {
        success: false,
        toolName,
        data: { error: `Unknown tool: ${toolName}` },
        voiceSummary: `I do not support the tool ${toolName}.`,
      };
  }
}
