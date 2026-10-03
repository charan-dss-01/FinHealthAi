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
};

async function testLiveGeminiCopilot() {
  console.log('--- TESTING LIVE GEMINI AI CFO ADVISOR ---');
  const query = 'What should I prioritize to increase my cash runway to 45 days?';
  console.log(`User Query: "${query}"\n`);

  const response = await getCFOAdvisorResponse(query, mockCtx);
  console.log('--- LIVE GEMINI RESPONSE RECEIVED ---');
  console.log(response);
  console.log('\n✅ Live Gemini AI CFO Copilot Verification Successful!');
}

testLiveGeminiCopilot();
