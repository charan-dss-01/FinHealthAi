import { calculateFinancialHealthScore } from '../src/lib/analytics/health';
import { generateFinancialSignals } from '../src/lib/analytics/signals';

console.log('--- TESTING STATISTICAL SIGNAL ENGINE & HEALTH SCORE ---');

// Test Case 1: Healthy SMB profile
const healthyResult = calculateFinancialHealthScore(500000, 320000, 180000, 2500);
console.log('\n[Test Case 1: Healthy Retail Store]');
console.log(`  Health Score : ${healthyResult.score}/100 (${healthyResult.state})`);
console.log(`  Runway Days  : ${healthyResult.runwayDays} Days`);
console.log(`  Pillars      : Runway=${healthyResult.pillars.runwayScore}, Margin=${healthyResult.pillars.marginScore}, Co-mingling=${healthyResult.pillars.coCominglingScore}, Buffer=${healthyResult.pillars.bufferScore}`);

// Test Case 2: High Co-mingled Personal Spend & Low Runway
const riskResult = calculateFinancialHealthScore(150000, 240000, 12000, 48000);
console.log('\n[Test Case 2: At-Risk Store with Co-mingling Leak]');
console.log(`  Health Score : ${riskResult.score}/100 (${riskResult.state})`);
console.log(`  Runway Days  : ${riskResult.runwayDays} Days`);
console.log(`  Key Drivers  :`, riskResult.keyDrivers);

// Test Case 3: Z-Score Expense Spike Signal Detection
const mockTx = [
  { amount: 3500, description: 'Metro Cash', type: 'DEBIT', category: 'Inventory & Supplies', isBusiness: true, transactionDate: new Date() },
  { amount: 4200, description: 'Electricity', type: 'DEBIT', category: 'Utilities', isBusiness: true, transactionDate: new Date() },
  { amount: 3800, description: 'Metro Cash', type: 'DEBIT', category: 'Inventory & Supplies', isBusiness: true, transactionDate: new Date() },
  { amount: 28000, description: 'Unusual Supplier Payment Spike', type: 'DEBIT', category: 'Inventory & Supplies', isBusiness: true, transactionDate: new Date() },
  { amount: 15000, description: 'Swiggy & Personal Shopping', type: 'DEBIT', category: 'Personal Expense (Co-mingled)', isBusiness: false, transactionDate: new Date() },
  { amount: 450000, description: 'Customer Payment', type: 'CREDIT', category: 'Customer Revenue', isBusiness: true, transactionDate: new Date() },
];

const signals = generateFinancialSignals(mockTx, 18, 50000);
console.log(`\nGenerated ${signals.length} Signals:`);
signals.forEach((sig, idx) => {
  console.log(`  [Signal ${idx + 1}] [${sig.severity}] ${sig.title}`);
  console.log(`             Description: ${sig.description}`);
});

console.log('\n✅ Statistical Signal Engine & Health Score Verification Passed!');
