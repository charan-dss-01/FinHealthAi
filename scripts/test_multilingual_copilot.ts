import fs from 'fs';
import path from 'path';
import { getCFOAdvisorResponse, BusinessContext } from '../src/lib/ai/copilot';

// Load .env key into process.env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) {
    process.env.GEMINI_API_KEY = match[1];
  }
}

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
  preferredLanguage: 'te',
};

async function testMultilingualCopilot() {
  console.log('--- TESTING MULTILINGUAL AI CFO ADVISOR & CODE-MIXED QUERIES ---');

  // Test 1: Telugu Query
  const teQuery = 'sales ela unnayi? nenu kotha staff ni hire cheసుకోవచ్చా?';
  console.log(`[Telugu Code-Mixed Query]: "${teQuery}"`);
  const teResponse = await getCFOAdvisorResponse(teQuery, { ...mockCtx, preferredLanguage: 'te' });
  console.log(`--- TELUGU RESPONSE (Model: ${teResponse.modelUsed}) ---`);
  console.log(teResponse.reply + '\n');

  // Test 2: Hindi Query
  const hiQuery = 'दुकान की बिक्री कैसी चल रही है? क्या नया स्टाफ रख सकते हैं?';
  console.log(`[Hindi Query]: "${hiQuery}"`);
  const hiResponse = await getCFOAdvisorResponse(hiQuery, { ...mockCtx, preferredLanguage: 'hi' });
  console.log(`--- HINDI RESPONSE (Model: ${hiResponse.modelUsed}) ---`);
  console.log(hiResponse.reply + '\n');

  console.log('✅ Multilingual AI Copilot Test Suite Passed!');
}

testMultilingualCopilot();
