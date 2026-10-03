import anomalyModel from '../ml/models/anomaly_model.json';

export interface GeneratedSignal {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'POSITIVE';
  title: string;
  description: string;
  score: number;
}

export function generateFinancialSignals(
  transactions: Array<{
    amount: number;
    merchant?: string | null;
    description: string;
    type: string;
    category: string;
    isBusiness: boolean;
    transactionDate: Date | string;
  }>,
  cashRunwayDays: number,
  endingBalance: number
): GeneratedSignal[] {
  const signals: GeneratedSignal[] = [];

  // 1. Cash Runway Alert Signal
  if (cashRunwayDays <= 14) {
    signals.push({
      type: 'RUNWAY_CRITICAL',
      severity: 'HIGH',
      title: '🚨 CRITICAL: Cash Runway Below 15 Days',
      description: `At current burn rate, your business cash reserve will run out in ${cashRunwayDays} days. Consider deferring non-essential purchases.`,
      score: 95,
    });
  } else if (cashRunwayDays <= 30) {
    signals.push({
      type: 'RUNWAY_WARNING',
      severity: 'MEDIUM',
      title: '⚠️ Cash Runway Warning (< 30 Days)',
      description: `Operating cash buffer covers approximately ${cashRunwayDays} days of expenses. Monitor upcoming vendor payments.`,
      score: 70,
    });
  }

  // 2. Personal Spend Co-mingling Leak Detector
  const personalSpends = transactions.filter((t) => !t.isBusiness && t.type === 'DEBIT');
  const totalPersonalAmount = personalSpends.reduce((sum, t) => sum + t.amount, 0);

  if (totalPersonalAmount > 5000) {
    signals.push({
      type: 'COMINGLED_SPEND_ALERT',
      severity: 'HIGH',
      title: `💡 Personal Spending Leakage (INR ${totalPersonalAmount.toLocaleString('en-IN')})`,
      description: `Detected ${personalSpends.length} personal transactions (Swiggy, Amazon, Netflix) paid from current account. Separating these will improve tax clarity.`,
      score: 85,
    });
  }

  // 3. Statistical Z-Score Outlier Expense Spike Signal
  const debitAmounts = transactions.filter((t) => t.type === 'DEBIT').map((t) => t.amount);
  if (debitAmounts.length > 5) {
    const mean = debitAmounts.reduce((a, b) => a + b, 0) / debitAmounts.length;
    const std = Math.sqrt(debitAmounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / debitAmounts.length);

    const spikeTx = transactions.find((t) => t.type === 'DEBIT' && std > 0 && (t.amount - mean) / std > 2.5);
    if (spikeTx) {
      const zScore = ((spikeTx.amount - mean) / std).toFixed(1);
      signals.push({
        type: 'STATISTICAL_EXPENSE_SPIKE',
        severity: 'HIGH',
        title: `🚨 Unusual Supplier Expense Spike (${zScore}x Std Dev)`,
        description: `Payment of INR ${spikeTx.amount.toLocaleString('en-IN')} to "${spikeTx.merchant || spikeTx.description}" is significantly higher than your typical transaction average.`,
        score: 90,
      });
    }
  }

  // 4. Revenue Growth & Positive Operating Signal
  const creditTx = transactions.filter((t) => t.type === 'CREDIT');
  const totalIncome = creditTx.reduce((sum, t) => sum + t.amount, 0);
  if (totalIncome > 200000) {
    signals.push({
      type: 'REVENUE_STABILITY',
      severity: 'POSITIVE',
      title: '✅ Robust Monthly Customer Settlements',
      description: `Total customer UPI & digital settlements reached INR ${(totalIncome / 100000).toFixed(2)} Lakhs this period.`,
      score: 40,
    });
  }

  // Sort signals by urgency score
  return signals.sort((a, b) => b.score - a.score);
}
