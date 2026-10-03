export interface LoanAssessment {
  readinessScore: number;
  readinessGrade: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  maxSafeLoanAmount: number;
  maxMonthlyEmi: number;
  dscr: number;
  factors: {
    revenueConsistency: number; // 0-100
    profitMarginScore: number; // 0-100
    runwayBufferScore: number; // 0-100
    businessSeparationScore: number; // 0-100
  };
  checklist: Array<{
    title: string;
    description: string;
    passed: boolean;
    recommendation?: string;
  }>;
}

export function calculateLoanAssessment(
  monthlyRevenue: number,
  monthlyExpenses: number,
  endingBalance: number,
  cashRunwayDays: number,
  personalSpendRatio: number = 0.05
): LoanAssessment {
  const netMonthlyProfit = Math.max(0, monthlyRevenue - monthlyExpenses);
  const profitMargin = monthlyRevenue > 0 ? (netMonthlyProfit / monthlyRevenue) * 100 : 0;

  // Max safe monthly EMI is capped at 35% of net monthly operating surplus
  const maxMonthlyEmi = Math.round(netMonthlyProfit * 0.35);

  // Assuming a standard 36-month loan tenure at 12% annual interest (1% monthly)
  // Loan Amount P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
  const monthlyRate = 0.12 / 12;
  const tenureMonths = 36;
  const emiFactor = (Math.pow(1 + monthlyRate, tenureMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));
  const maxSafeLoanAmount = Math.round(maxMonthlyEmi * emiFactor);

  // Pillar scores (0-100)
  const revenueScore = monthlyRevenue >= 200000 ? 90 : monthlyRevenue >= 100000 ? 75 : 55;
  const marginScore = profitMargin >= 20 ? 95 : profitMargin >= 10 ? 80 : profitMargin >= 5 ? 60 : 35;
  const runwayScore = cashRunwayDays >= 45 ? 95 : cashRunwayDays >= 25 ? 80 : cashRunwayDays >= 15 ? 55 : 30;
  const separationScore = personalSpendRatio <= 0.03 ? 95 : personalSpendRatio <= 0.08 ? 75 : 45;

  const readinessScore = Math.round(
    revenueScore * 0.35 +
    marginScore * 0.25 +
    runwayScore * 0.25 +
    separationScore * 0.15
  );

  let readinessGrade: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' = 'POOR';
  if (readinessScore >= 80) readinessGrade = 'EXCELLENT';
  else if (readinessScore >= 65) readinessGrade = 'GOOD';
  else if (readinessScore >= 50) readinessGrade = 'MODERATE';

  const dscr = monthlyExpenses > 0 ? Number(((monthlyRevenue - (monthlyExpenses - maxMonthlyEmi)) / (maxMonthlyEmi || 1)).toFixed(2)) : 1.5;

  const checklist = [
    {
      title: 'Stable Monthly Revenue',
      description: `Customer sales exceed ₹1.5 Lakhs/month (Current: ₹${(monthlyRevenue / 100000).toFixed(2)}L).`,
      passed: monthlyRevenue >= 150000,
      recommendation: monthlyRevenue < 150000 ? 'Increase UPI digital settlement volume to build verifiable bank trail.' : undefined,
    },
    {
      title: 'Healthy Cash Runway Buffer',
      description: `Store has ≥20 days operating buffer (Current: ${cashRunwayDays} days).`,
      passed: cashRunwayDays >= 20,
      recommendation: cashRunwayDays < 20 ? 'Maintain minimum 25-day operating cash in current account.' : undefined,
    },
    {
      title: 'Positive Net Profit Margin',
      description: `Net earnings exceed 8% of sales (Current: ${profitMargin.toFixed(1)}%).`,
      passed: profitMargin >= 8,
      recommendation: profitMargin < 8 ? 'Negotiate supplier trade discounts to boost net operating margin.' : undefined,
    },
    {
      title: 'Clean Business & Personal Separation',
      description: 'Under 5% personal food/entertainment spending from store account.',
      passed: personalSpendRatio <= 0.05,
      recommendation: personalSpendRatio > 0.05 ? 'Stop Swiggy/personal payments from store account to satisfy bank underwriting.' : undefined,
    },
  ];

  return {
    readinessScore,
    readinessGrade,
    maxSafeLoanAmount,
    maxMonthlyEmi,
    dscr,
    factors: {
      revenueConsistency: revenueScore,
      profitMarginScore: marginScore,
      runwayBufferScore: runwayScore,
      businessSeparationScore: separationScore,
    },
    checklist,
  };
}

export function calculateEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = (annualRatePct / 100) / 12;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}
