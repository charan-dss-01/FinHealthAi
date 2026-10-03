import { generateCashFlowForecast, DailyCashProjection } from './forecaster';
import { calculateFinancialHealthScore } from './health';

export interface SimulationParams {
  revenueChangePct: number; // e.g. -20 for 20% drop, +15 for 15% growth
  expenseChangePct: number; // e.g. +15 for 15% supplier inflation
  newMonthlyStaffCost: number; // e.g. 18000
  eliminatePersonalSpend: boolean; // true to cut co-mingled personal expenses
}

export interface SimulationResult {
  params: SimulationParams;
  baseline: {
    healthScore: number;
    healthState: string;
    runwayDays: number;
    ending30DayBalance: number;
    ending90DayBalance: number;
  };
  simulated: {
    healthScore: number;
    healthState: string;
    runwayDays: number;
    ending30DayBalance: number;
    ending90DayBalance: number;
  };
  deltas: {
    runwayDaysDelta: number;
    healthScoreDelta: number;
    balanceDelta90Days: number;
  };
  simulatedProjections: Array<{
    date: string;
    baselineBalance: number;
    simulatedBalance: number;
  }>;
  cfoVerdict: string;
}

export function runWhatIfSimulation(
  currentBalance: number,
  baseMonthlyRevenue: number,
  baseMonthlyExpenses: number,
  currentPersonalExpenses: number,
  params: SimulationParams
): SimulationResult {
  // 1. Baseline Calculations
  const baseForecast = generateCashFlowForecast(currentBalance, baseMonthlyRevenue, baseMonthlyExpenses, 90);
  const baseHealth = calculateFinancialHealthScore(
    baseMonthlyRevenue,
    baseMonthlyExpenses,
    currentBalance,
    currentPersonalExpenses
  );

  // 2. Simulated Revenue & Expenses
  let simRevenue = baseMonthlyRevenue * (1 + params.revenueChangePct / 100);
  let simExpenses = baseMonthlyExpenses * (1 + params.expenseChangePct / 100);

  // Add new staff cost
  simExpenses += params.newMonthlyStaffCost;

  // Eliminate personal spend if toggled
  let simPersonalExpenses = currentPersonalExpenses;
  if (params.eliminatePersonalSpend) {
    simExpenses -= currentPersonalExpenses;
    simPersonalExpenses = 0;
  }

  // Ensure non-negative
  simRevenue = Math.max(0, simRevenue);
  simExpenses = Math.max(0, simExpenses);

  // 3. Simulated Forecast & Health Score
  const simForecast = generateCashFlowForecast(currentBalance, simRevenue, simExpenses, 90);
  const simHealth = calculateFinancialHealthScore(
    simRevenue,
    simExpenses,
    currentBalance,
    simPersonalExpenses
  );

  // 4. Calculate Combined Projection Curves for Charting
  const combinedProjections = baseForecast.projections.map((bp, idx) => ({
    date: bp.date,
    baselineBalance: bp.projectedBalance,
    simulatedBalance: simForecast.projections[idx]?.projectedBalance || bp.projectedBalance,
  }));

  // 5. Compute Deltas
  const runwayDaysDelta = simHealth.runwayDays - baseHealth.runwayDays;
  const healthScoreDelta = simHealth.score - baseHealth.score;
  const balanceDelta90Days = simForecast.projected90DayBalance - baseForecast.projected90DayBalance;

  // 6. Generate Executive CFO Verdict
  let cfoVerdict = '';
  if (simHealth.score > baseHealth.score) {
    cfoVerdict = `Positive decision! This scenario improves your Financial Health Score by +${healthScoreDelta} points and extends cash runway by +${runwayDaysDelta} days.`;
  } else if (simHealth.score < baseHealth.score) {
    cfoVerdict = `Caution advised! This scenario reduces cash runway by ${Math.abs(runwayDaysDelta)} days and lowers Health Score by ${healthScoreDelta} points.`;
  } else {
    cfoVerdict = `Neutral impact. Cash runway remains steady at ${simHealth.runwayDays} days.`;
  }

  return {
    params,
    baseline: {
      healthScore: baseHealth.score,
      healthState: baseHealth.state,
      runwayDays: baseHealth.runwayDays,
      ending30DayBalance: baseForecast.projected30DayBalance,
      ending90DayBalance: baseForecast.projected90DayBalance,
    },
    simulated: {
      healthScore: simHealth.score,
      healthState: simHealth.state,
      runwayDays: simHealth.runwayDays,
      ending30DayBalance: simForecast.projected30DayBalance,
      ending90DayBalance: simForecast.projected90DayBalance,
    },
    deltas: {
      runwayDaysDelta,
      healthScoreDelta,
      balanceDelta90Days,
    },
    simulatedProjections: combinedProjections,
    cfoVerdict,
  };
}
