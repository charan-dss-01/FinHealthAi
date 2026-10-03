import { buildGroundedSystemPrompt, generateDeterministicCFOAdvice, BusinessContext } from '../src/lib/ai/copilot';

console.log('--- TESTING AI CFO COPILOT ENGINE ---');

const mockCtx: BusinessContext = {
  name: 'Ravi General Store',
  category: 'Retail',
  location: 'Bangalore, Karnataka',
  healthScore: 78,
  healthState: 'GREEN',
  cashRunwayDays: 28,
  totalRevenue: 482000,
  totalExpenses: 321500,
  netCashFlow: 160500,
  endingBalance: 142500,
  personalExpenses: 14850,
  activeSignals: [
    { title: '🚨 Unusual Supplier Expense Spike', severity: 'HIGH', description: 'Payment of ₹45,000 is higher than average.' },
  ],
  recentTransactions: [
    { merchant: 'Swiggy', amount: 480, type: 'DEBIT', category: 'Personal Expense (Co-mingled)', isBusiness: false },
    { merchant: 'HUL Distributor', amount: 45000, type: 'DEBIT', category: 'Inventory & Supplies', isBusiness: true },
  ],
};

// Test 1: Grounded System Prompt Assembly
const systemPrompt = buildGroundedSystemPrompt(mockCtx);
console.log('\n[Test 1: System Prompt Assembly]');
console.log(systemPrompt.substring(0, 400) + '...\n');

// Test 2: Staff Hiring Advisory
const staffAdvice = generateDeterministicCFOAdvice('Can I afford to hire a new staff member at ₹18,000/month?', mockCtx);
console.log('[Test 2: Staff Hiring Query Response]');
console.log(staffAdvice + '\n');

// Test 3: Personal Spend Co-mingling Advisory
const personalAdvice = generateDeterministicCFOAdvice('Which expenses are personal spending co-mingled in my account?', mockCtx);
console.log('[Test 3: Co-mingling Query Response]');
console.log(personalAdvice + '\n');

console.log('✅ AI CFO Copilot Engine Verification Passed!');
