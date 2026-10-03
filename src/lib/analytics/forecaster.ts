export interface DailyCashProjection {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  projectedBalance: number;
  projectedRevenue: number;
  projectedExpenses: number;
  upperConfidence: number;
  lowerConfidence: number;
}

export interface ForecastSummary {
  currentBalance: number;
  projected30DayBalance: number;
  projected60DayBalance: number;
  projected90DayBalance: number;
  avgDailyRevenue: number;
  avgDailyExpense: number;
  projections: DailyCashProjection[];
}

export function generateCashFlowForecast(
  currentBalance: number,
  total30DayRevenue: number,
  total30DayExpenses: number,
  daysToForecast: number = 90
): ForecastSummary {
  const avgDailyRevenue = total30DayRevenue / 30 || 5000;
  const avgDailyExpense = total30DayExpenses / 30 || 4000;

  const projections: DailyCashProjection[] = [];
  let runningBalance = currentBalance;

  const today = new Date();

  for (let day = 1; day <= daysToForecast; day++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + day);

    // Apply minor weekend seasonality (lower transactions on Sundays)
    const isSunday = futureDate.getDay() === 0;
    const dailyRev = isSunday ? avgDailyRevenue * 0.4 : avgDailyRevenue;
    const dailyExp = isSunday ? avgDailyExpense * 0.5 : avgDailyExpense;

    const netDaily = dailyRev - dailyExp;
    runningBalance += netDaily;

    // Confidence interval widens as we project further into the future (+/- 5% compounding)
    const uncertaintyMargin = runningBalance * (0.02 + day * 0.003);

    projections.push({
      date: futureDate.toISOString().split('T')[0],
      dayNumber: day,
      projectedBalance: Math.round(runningBalance),
      projectedRevenue: Math.round(dailyRev),
      projectedExpenses: Math.round(dailyExp),
      upperConfidence: Math.round(runningBalance + uncertaintyMargin),
      lowerConfidence: Math.round(Math.max(0, runningBalance - uncertaintyMargin)),
    });
  }

  const p30 = projections[29]?.projectedBalance || runningBalance;
  const p60 = projections[59]?.projectedBalance || runningBalance;
  const p90 = projections[89]?.projectedBalance || runningBalance;

  return {
    currentBalance,
    projected30DayBalance: p30,
    projected60DayBalance: p60,
    projected90DayBalance: p90,
    avgDailyRevenue: Math.round(avgDailyRevenue),
    avgDailyExpense: Math.round(avgDailyExpense),
    projections,
  };
}
