export interface CominglingClassification {
  isBusiness: boolean;
  confidence: number;
  reason: string;
}

const PERSONAL_KEYWORDS = [
  'swiggy',
  'zomato',
  'netflix',
  'hotstar',
  'prime video',
  'bookmyshow',
  'school fees',
  'college fees',
  'tuition',
  'myntra',
  'nykaa',
  'zepto personal',
  'blinkit personal',
  'hospital',
  'pharmacy personal',
  'jewellers',
  'saree',
  'boutique',
  'movie',
  'club',
];

const BUSINESS_KEYWORDS = [
  'distributor',
  'supplier',
  'wholesaler',
  'cash & carry',
  'metro cash',
  'bescom',
  'electricity',
  'shop rent',
  'office rent',
  'salary',
  'staff',
  'payroll',
  'gst',
  'tax payment',
  'commercial loan',
  'emi',
  'freight',
  'transport',
  'logistics',
  'godown',
];

export function detectComingling(
  merchant: string,
  rawDescription: string,
  category: string
): CominglingClassification {
  const text = `${merchant} ${rawDescription} ${category}`.toLowerCase();

  // Check personal keywords
  for (const kw of PERSONAL_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        isBusiness: false,
        confidence: 0.95,
        reason: `Personal spend keyword matched: "${kw}". Co-mingled with business account.`,
      };
    }
  }

  // Check business keywords
  for (const kw of BUSINESS_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        isBusiness: true,
        confidence: 0.92,
        reason: `Business expense keyword matched: "${kw}".`,
      };
    }
  }

  // Default heuristic based on category
  if (['Personal Expense', 'Entertainment', 'Dining Out', 'Personal Care'].includes(category)) {
    return {
      isBusiness: false,
      confidence: 0.85,
      reason: `Category "${category}" indicates personal spending.`,
    };
  }

  return {
    isBusiness: true,
    confidence: 0.75,
    reason: 'Defaulted to business operational transaction.',
  };
}
