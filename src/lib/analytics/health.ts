export interface HealthScoreBreakdown {
  score: number;
  state: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  runwayDays: number;
  pillars: {
    runwayScore: number; // 35%
    marginScore: number; // 25%
    coCominglingScore: number; // 20%
    bufferScore: number; // 20%
  };
  keyDrivers: string[];
}

export function calculateFinancialHealthScore(
  totalRevenue: number,
  totalExpenses: number,
  endingBalance: number,
  personalExpenses: number
): HealthScoreBreakdown {
  const netCashFlow = totalRevenue - totalExpenses;
  const avgDailyExpense = (totalExpenses - personalExpenses) / 30 || 1000;
  const runwayDays = Math.max(Math.floor(endingBalance / avgDailyExpense), 1);

  // 1. Runway Score (35%)
  let runwayScore = 100;
  if (runwayDays >= 60) runwayScore = 100;
  else if (runwayDays >= 30) runwayScore = 85;
  else if (runwayDays >= 15) runwayScore = 60;
  else if (runwayDays >= 7) runwayScore = 35;
  else runwayScore = 10;

  // 2. Net Cash Margin Score (25%)
  let marginScore = 100;
  if (totalRevenue > 0) {
    const margin = netCashFlow / totalRevenue;
    if (margin >= 0.2) marginScore = 100;
    else if (margin >= 0.1) marginScore = 85;
    else if (margin >= 0) marginScore = 70;
    else if (margin >= -0.15) marginScore = 40;
    else marginScore = 15;
  } else {
    marginScore = 40;
  }

  // 3. Co-mingling Expense Score (20%)
  let coCominglingScore = 100;
  if (totalExpenses > 0) {
    const personalRatio = personalExpenses / totalExpenses;
    if (personalRatio <= 0.02) coCominglingScore = 100;
    else if (personalRatio <= 0.05) coCominglingScore = 85;
    else if (personalRatio <= 0.10) coCominglingScore = 65;
    else if (personalRatio <= 0.20) coCominglingScore = 40;
    else coCominglingScore = 15;
  }

  // 4. Reserve Buffer Score (20%)
  const monthlyFixedExpense = totalExpenses * 0.8;
  let bufferScore = 100;
  if (monthlyFixedExpense > 0) {
    const monthsOfBuffer = endingBalance / monthlyFixedExpense;
    if (monthsOfBuffer >= 2.0) bufferScore = 100;
    else if (monthsOfBuffer >= 1.0) bufferScore = 80;
    else if (monthsOfBuffer >= 0.5) bufferScore = 60;
    else bufferScore = 30;
  }

  // Calculate Weighted Composite Health Score
  const score = Math.round(
    runwayScore * 0.35 +
    marginScore * 0.25 +
    coCominglingScore * 0.20 +
    bufferScore * 0.20
  );

  let state: HealthScoreBreakdown['state'] = 'GREEN';
  if (score >= 75) state = 'GREEN';
  else if (score >= 60) state = 'YELLOW';
  else if (score >= 40) state = 'ORANGE';
  else state = 'RED';

  const keyDrivers: string[] = [];
  if (runwayDays < 30) keyDrivers.push(`Cash runway is low (${runwayDays} days remaining).`);
  if (netCashFlow < 0) keyDrivers.push(`Net cash flow is negative (-INR ${Math.abs(netCashFlow).toLocaleString('en-IN')}).`);
  if (personalExpenses > 5000) keyDrivers.push(`INR ${personalExpenses.toLocaleString('en-IN')} personal spend co-mingled in business account.`);
  if (keyDrivers.length === 0) keyDrivers.push('Healthy operating cash flow and cash runway buffer.');

  return {
    score,
    state,
    runwayDays,
    pillars: {
      runwayScore,
      marginScore,
      coCominglingScore,
      bufferScore,
    },
    keyDrivers,
  };
}
