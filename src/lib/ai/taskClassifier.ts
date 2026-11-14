export interface TaskClassification {
  category:
    | 'GENERAL_FINANCIAL_QUESTION'
    | 'TRANSACTION_ANALYSIS'
    | 'CASH_FLOW_ANALYSIS'
    | 'EXPENSE_ANALYSIS'
    | 'REVENUE_ANALYSIS'
    | 'BUSINESS_GROWTH_ADVICE'
    | 'FINANCIAL_FORECASTING'
    | 'WHAT_IF_SIMULATION'
    | 'REPORT_SUMMARY'
    | 'GENERAL_CONVERSATION';
  complexity: 'SIMPLE' | 'COMPLEX';
  recommendedModelType: 'FAST' | 'REASONING';
  requiresHistoricalComparison: boolean;
  requiresTransactionDrilldown: boolean;
}

/**
 * High-speed deterministic rule-based task classifier (<1ms execution).
 * Avoids calling expensive LLMs just to classify intent.
 */
export function classifyFinancialTask(query: string, hasImage: boolean = false): TaskClassification {
  const q = (query || '').toLowerCase().trim();

  if (hasImage) {
    return {
      category: 'TRANSACTION_ANALYSIS',
      complexity: 'COMPLEX',
      recommendedModelType: 'FAST', // Fast multimodal works best
      requiresHistoricalComparison: false,
      requiresTransactionDrilldown: true,
    };
  }

  // 1. What-If Simulation & Hiring
  if (
    q.includes('what if') ||
    q.includes('afford') ||
    q.includes('hire') ||
    q.includes('salary') ||
    q.includes('helper') ||
    q.includes('purchase') ||
    q.includes('buy') ||
    q.includes('జీతం') ||
    q.includes('కొత్త') ||
    q.includes('नौकरी')
  ) {
    return {
      category: 'WHAT_IF_SIMULATION',
      complexity: 'COMPLEX',
      recommendedModelType: 'REASONING',
      requiresHistoricalComparison: true,
      requiresTransactionDrilldown: false,
    };
  }

  // 2. Financial Forecasting & Runway Risk
  if (
    q.includes('forecast') ||
    q.includes('predict') ||
    q.includes('runway') ||
    q.includes('next month') ||
    q.includes('next 30') ||
    q.includes('future') ||
    q.includes('risk') ||
    q.includes('ఎంతకాలం') ||
    q.includes('कितने दिन')
  ) {
    return {
      category: 'FINANCIAL_FORECASTING',
      complexity: 'COMPLEX',
      recommendedModelType: 'REASONING',
      requiresHistoricalComparison: true,
      requiresTransactionDrilldown: false,
    };
  }

  // 3. Expense Analysis & Leaks
  if (
    q.includes('expense') ||
    q.includes('spend') ||
    q.includes('spending') ||
    q.includes('leak') ||
    q.includes('personal') ||
    q.includes('cost') ||
    q.includes('swiggy') ||
    q.includes('zomato') ||
    q.includes('ఖర్చు') ||
    q.includes('खर्च')
  ) {
    const isComparison = q.includes('why') || q.includes('increased') || q.includes('higher') || q.includes('పెరిగింది') || q.includes('बढ़');
    return {
      category: 'EXPENSE_ANALYSIS',
      complexity: isComparison ? 'COMPLEX' : 'SIMPLE',
      recommendedModelType: isComparison ? 'REASONING' : 'FAST',
      requiresHistoricalComparison: isComparison,
      requiresTransactionDrilldown: true,
    };
  }

  // 4. Revenue & Sales Analysis
  if (
    q.includes('revenue') ||
    q.includes('sales') ||
    q.includes('income') ||
    q.includes('earning') ||
    q.includes('collection') ||
    q.includes('అమ్మకాలు') ||
    q.includes('बिक्री')
  ) {
    const isComparison = q.includes('compare') || q.includes('improving') || q.includes('trend') || q.includes('బాగుందా');
    return {
      category: 'REVENUE_ANALYSIS',
      complexity: isComparison ? 'COMPLEX' : 'SIMPLE',
      recommendedModelType: isComparison ? 'REASONING' : 'FAST',
      requiresHistoricalComparison: isComparison,
      requiresTransactionDrilldown: false,
    };
  }

  // 5. Cash Flow Analysis & Loss Investigation
  if (
    q.includes('cash flow') ||
    q.includes('losing money') ||
    q.includes('loss') ||
    q.includes('profit') ||
    q.includes('margin') ||
    q.includes('లాభం') ||
    q.includes('मुनाफा') ||
    q.includes('घाटा')
  ) {
    return {
      category: 'CASH_FLOW_ANALYSIS',
      complexity: 'COMPLEX',
      recommendedModelType: 'REASONING',
      requiresHistoricalComparison: true,
      requiresTransactionDrilldown: true,
    };
  }

  // 6. Business Growth Advice
  if (
    q.includes('increase') ||
    q.includes('grow') ||
    q.includes('advice') ||
    q.includes('improve') ||
    q.includes('ways to') ||
    q.includes('strategy') ||
    q.includes('ఎలా పెంచాలి') ||
    q.includes('कैसे बढ़ाएं')
  ) {
    return {
      category: 'BUSINESS_GROWTH_ADVICE',
      complexity: 'COMPLEX',
      recommendedModelType: 'REASONING',
      requiresHistoricalComparison: true,
      requiresTransactionDrilldown: false,
    };
  }

  // 7. General Financial Overview
  if (
    q.includes('how is my business') ||
    q.includes('overview') ||
    q.includes('summary') ||
    q.includes('health') ||
    q.includes('ela undi') ||
    q.includes('kaisa chal raha')
  ) {
    return {
      category: 'GENERAL_FINANCIAL_QUESTION',
      complexity: 'SIMPLE',
      recommendedModelType: 'FAST',
      requiresHistoricalComparison: false,
      requiresTransactionDrilldown: false,
    };
  }

  // Default fallback
  return {
    category: 'GENERAL_CONVERSATION',
    complexity: 'SIMPLE',
    recommendedModelType: 'FAST',
    requiresHistoricalComparison: false,
    requiresTransactionDrilldown: false,
  };
}
