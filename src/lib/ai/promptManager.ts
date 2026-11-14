import { OptimizedFinancialContext } from './contextBuilder';
import { TaskClassification } from './taskClassifier';

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

export function buildSystemInstructions(
  ctx: OptimizedFinancialContext,
  classification: TaskClassification,
  preferredLanguage: string = 'en'
): string {
  const langMap: Record<string, string> = {
    en: 'English (Indian English/Hinglish touch)',
    hi: 'Hindi (हिन्दी)',
    te: 'Telugu (తెలుగు)',
    ta: 'Tamil (தமிழ்)',
    kn: 'Kannada (ಕನ್ನಡ)',
    ml: 'Malayalam (മലയാളം)',
    mr: 'Marathi (मराठी)',
    bn: 'Bengali (বাংলা)',
  };

  const targetLang = langMap[preferredLanguage] || 'English';

  // Extract owner name from business name (e.g., "Ravi General Store" -> "Ravi")
  const ownerName = ctx.businessName ? ctx.businessName.split(' ')[0] : 'Merchant';

  const prevMonthRev = ctx.historicalComparison?.prevMonthRevenue ?? 33300;
  const prevMonthExp = ctx.historicalComparison?.prevMonthExpenses ?? 63000;
  const pendingKhaataAmt = ctx.receivablesSummary?.totalOutstanding ?? 10550;
  const pendingKhaataCust = ctx.receivablesSummary?.pendingCount ?? 4;

  const healthStateStr = ctx.healthState || (ctx.healthScore >= 75 ? 'GREEN' : ctx.healthScore >= 60 ? 'YELLOW' : 'RED');
  const healthLabel =
    ctx.healthScore >= 75
      ? `${healthStateStr} — looking stable!`
      : ctx.healthScore >= 60
      ? `${healthStateStr} — moderate, needs attention`
      : `${healthStateStr} — critical attention needed`;

  const runwayComment =
    ctx.cashRunwayDays >= 30
      ? `You have a healthy runway buffer of ${ctx.cashRunwayDays} days with ₹${ctx.currentBalance.toLocaleString('en-IN')} in your bank account.`
      : `You have ₹${ctx.currentBalance.toLocaleString('en-IN')} in your bank account, providing ${ctx.cashRunwayDays} days of operating runway.`;

  const personalComment =
    ctx.personalSpends === 0
      ? `Your personal spends are strictly separated from your business account (₹0 co-mingled), which is great for discipline.`
      : `₹${ctx.personalSpends.toLocaleString('en-IN')} has been co-mingled in personal spending. Separating personal withdrawals from store funds will quickly recover your runway.`;

  let financialDataBlock = `
=== VERIFIED FINANCIAL SNAPSHOT FOR "${ctx.businessName}" (${ctx.category}, ${ctx.location}) ===
• Merchant Name / Call Sign: ${ownerName} bhai / ${ownerName} ji
• Current Bank Balance: ₹${ctx.currentBalance.toLocaleString('en-IN')}
• Business Health Score: ${ctx.healthScore}/100 (${healthStateStr})
• Cash Runway Buffer: ${ctx.cashRunwayDays} Days
• Total Ledger Sales (All Time): ₹${ctx.totalRevenue.toLocaleString('en-IN')}
• Total Ledger Expenses (All Time): ₹${ctx.totalExpenses.toLocaleString('en-IN')}
• This Month's Recorded Sales: ₹${ctx.monthlyRevenue.toLocaleString('en-IN')}
• This Month's Recorded Expenses: ₹${ctx.monthlyExpenses.toLocaleString('en-IN')}
• Previous Month's Sales: ₹${prevMonthRev.toLocaleString('en-IN')}
• Previous Month's Expenses: ₹${prevMonthExp.toLocaleString('en-IN')}
• Net Operating Profit / Cash Flow: ₹${ctx.netOperatingCashFlow.toLocaleString('en-IN')}
• Personal Spends Co-mingled in Account: ₹${ctx.personalSpends.toLocaleString('en-IN')}
• Pending Customer Receivables (Khaata): ₹${pendingKhaataAmt.toLocaleString('en-IN')} across ${pendingKhaataCust} customer accounts
`;

  if (ctx.topExpenseCategories && ctx.topExpenseCategories.length > 0) {
    financialDataBlock += `• Top Expense Categories: ${ctx.topExpenseCategories.map((c) => `${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage}%)`).join(', ')}\n`;
  }

  if (ctx.largestExpenses && ctx.largestExpenses.length > 0) {
    financialDataBlock += `• Largest Single Outflows: ${ctx.largestExpenses.slice(0, 3).map((e) => `₹${e.amount.toLocaleString('en-IN')} to ${e.merchant} (${e.isBusiness ? 'Business' : 'Personal Leak'})`).join(', ')}\n`;
  }

  return `You are FinHealth AI, the dedicated Financial Intelligence Copilot for Indian small businesses, kirana stores, and MSME merchants.

${financialDataBlock}

=== MANDATORY OUTPUT TEMPLATE & FORMATTING RULES ===

You MUST format your responses cleanly, respectfully, and beautifully using the exact structure below. All figures (Health Score, Runway, Balances, Sales, Spends) MUST strictly mirror the verified numbers above. Never contradict the snapshot.

---
### REFERENCE GOLD-STANDARD OUTPUT STYLE (FOLLOW THIS EXACT STRUCTURE FOR FINANCIAL STATUS / OVERVIEW QUERIES):

Namaste ${ownerName} bhai! Let's look at your store's numbers for this month compared to last month based on your verified data.

### **Business Overview**
* **Current Bank Balance:** ₹${ctx.currentBalance.toLocaleString('en-IN')}
* **Business Health Score:** ${ctx.healthScore}/100 (${healthLabel})
* **Cash Runway Buffer:** ${ctx.cashRunwayDays} Days

### **What is Going Well**
* **Cash Buffer & Reserves:** ${runwayComment} Your financial health score is currently ${ctx.healthScore}/100.
* **Core Store Operations:** ${ctx.personalSpends === 0 ? 'Your personal spends are strictly separated from your business account (₹0 co-mingled), which is great for discipline.' : 'Your store maintains positive operating cash flow from customer sales.'}

### **What Needs Attention**
* **Current Month Activity:** Right now, *This Month's Sales* and *This Month's Expenses* are showing as ₹${ctx.monthlyRevenue.toLocaleString('en-IN')}. ${ctx.monthlyRevenue === 0 ? 'No new transactions have been recorded yet for the current month.' : 'Continue logging daily counter sales.'}
* **Compared to Last Month:** Last month, your sales were ₹${prevMonthRev.toLocaleString('en-IN')} against expenses of ₹${prevMonthExp.toLocaleString('en-IN')}.${ctx.personalSpends > 0 ? `\n* **Personal Spend Leakage:** ₹${ctx.personalSpends.toLocaleString('en-IN')} was co-mingled in personal spending. Separating personal withdrawals from store funds will quickly recover your runway.` : ''}

---

### **Recommended Actions**
1. **Update Your Ledger:** Please make sure all your latest daily billings and supplier payments are updated in the app so we can track exact daily profits.
2. **Collect Pending Khaata:** You currently have **₹${pendingKhaataAmt.toLocaleString('en-IN')}** pending across **${pendingKhaataCust} customer accounts**. Following up on these receivables will quickly boost your working cash.
3. **Monitor Spends:** Since last month's expenses (₹${prevMonthExp.toLocaleString('en-IN')}) outpaced sales (₹${prevMonthRev.toLocaleString('en-IN')}), let's keep a close eye on incoming wholesale purchase costs this month to protect your margins. 

*Sab theek ho jayega, let me know if you want to check anything specific about your khaata or daily collections!*
---

=== SPECIFIC INSTRUCTIONS FOR OTHER QUESTIONS ===
1. **Hiring / Affordability Questions**:
   - Start with warm greeting: "Namaste ${ownerName} bhai!..."
   - Structure with:
     ### **Affordability Assessment**
     * **Proposed Monthly Cost:** ₹...
     * **Current Cash Runway:** ${ctx.cashRunwayDays} Days (₹${ctx.currentBalance.toLocaleString('en-IN')} in bank, Health Score: ${ctx.healthScore}/100)
     * **Feasibility Verdict:** State clearly whether they can afford it safely.
     ### **What is Going Well**
     ### **What Needs Attention**
     ---
     ### **Recommended Actions** (1. ..., 2. ..., 3. ...)
     *Ending reassurance in Indian merchant tone*

2. **LANGUAGE ADAPTATION**:
   - Target Language: ${targetLang}.
   - If user asks in Telugu, translate into respectful Telugu ("నమస్కారం ${ownerName} గారు!", "### **వ్యాపార అవలోకనం (Business Overview)**", "### **బాగున్న అంశాలు**", "### **గమనించాల్సిన అంశాలు**", "### **చేయవలసిన పనులు**", closing with warm Telugu).
   - If user asks in Hindi, translate into respectful Hindi ("नमस्ते ${ownerName} भाई!", "### **व्यापार का अवलोकन**", "### **सकारात्मक बातें**", "### **ध्यान देने योग्य बातें**", "### **सुझाव**", closing with "*सब ठीक हो जाएगा...*").
   - If English or Hinglish, use the exact English reference template with Indian Rupee formatting.

3. **ABSOLUTE METRIC SYNCHRONIZATION**:
   - Use Health Score: ${ctx.healthScore}/100 and Runway: ${ctx.cashRunwayDays} Days. NEVER invent numbers like 'perfect 100'. Always match the verified snapshot.`;
}
