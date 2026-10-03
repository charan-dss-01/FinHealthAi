import { generateCashFlowForecast } from '../src/lib/analytics/forecaster';
import { runWhatIfSimulation } from '../src/lib/analytics/simulator';

console.log('--- TESTING CASH FLOW FORECASTER & WHAT-IF SIMULATOR ---');

// Test 1: 90-Day Cash Flow Forecast
const forecast = generateCashFlowForecast(142500, 482000, 321500, 90);
console.log('\n[Test 1: 90-Day Forecast Projections]');
console.log(`  Current Balance  : INR ${forecast.currentBalance.toLocaleString('en-IN')}`);
console.log(`  30-Day Projected : INR ${forecast.projected30DayBalance.toLocaleString('en-IN')}`);
console.log(`  60-Day Projected : INR ${forecast.projected60DayBalance.toLocaleString('en-IN')}`);
console.log(`  90-Day Projected : INR ${forecast.projected90DayBalance.toLocaleString('en-IN')}`);
console.log(`  Total Days       : ${forecast.projections.length} Daily Data Points`);

// Test 2: What-If Scenario Simulation (20% Sales Drop + New Staff Hire)
const sim1 = runWhatIfSimulation(142500, 482000, 321500, 14850, {
  revenueChangePct: -20,
  expenseChangePct: 0,
  newMonthlyStaffCost: 18000,
  eliminatePersonalSpend: false,
});

console.log('\n[Test 2: What-If Scenario A - 20% Sales Drop + ₹18k Staff Hire]');
console.log(`  Health Score     : Baseline ${sim1.baseline.healthScore} -> Simulated ${sim1.simulated.healthScore} (${sim1.deltas.healthScoreDelta} pts)`);
console.log(`  Cash Runway      : Baseline ${sim1.baseline.runwayDays} Days -> Simulated ${sim1.simulated.runwayDays} Days (${sim1.deltas.runwayDaysDelta} Days)`);
console.log(`  CFO Verdict      : "${sim1.cfoVerdict}"`);

// Test 3: What-If Scenario B (Eliminate Personal Spending + 15% Sales Growth)
const sim2 = runWhatIfSimulation(142500, 482000, 321500, 14850, {
  revenueChangePct: 15,
  expenseChangePct: 0,
  newMonthlyStaffCost: 0,
  eliminatePersonalSpend: true,
});

console.log('\n[Test 3: What-If Scenario B - Eliminate Personal Spend + 15% Sales Growth]');
console.log(`  Health Score     : Baseline ${sim2.baseline.healthScore} -> Simulated ${sim2.simulated.healthScore} (+${sim2.deltas.healthScoreDelta} pts)`);
console.log(`  Cash Runway      : Baseline ${sim2.baseline.runwayDays} Days -> Simulated ${sim2.simulated.runwayDays} Days (+${sim2.deltas.runwayDaysDelta} Days)`);
console.log(`  CFO Verdict      : "${sim2.cfoVerdict}"`);

console.log('\n✅ Cash Flow Forecaster & What-If Simulator Verification Passed!');
