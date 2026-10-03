import categorizerModel from './models/categorizer_model.json';

export interface CategorizationResult {
  category: string;
  confidence: number;
  isBusiness: boolean;
  explanation: string;
}

export function classifyTransaction(
  description: string,
  merchant: string,
  amount: number,
  type: 'CREDIT' | 'DEBIT'
): CategorizationResult {
  const text = `${merchant} ${description}`.toLowerCase();

  // Income heuristic
  if (type === 'CREDIT') {
    return {
      category: 'Customer Revenue',
      confidence: 0.98,
      isBusiness: true,
      explanation: 'Classified as Customer Revenue based on credit transaction flow.',
    };
  }

  // Scoring per category based on ML dictionary keywords
  const keywordsMap = categorizerModel.keywords as Record<string, string[]>;
  let bestCategory = 'Other Expense';
  let maxScore = 0;

  for (const [cat, words] of Object.entries(keywordsMap)) {
    let score = 0;
    for (const w of words) {
      if (text.includes(w.toLowerCase())) {
        score += 1;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  // Determine co-mingled / business tag
  const isPersonal = bestCategory.includes('Personal');
  const confidence = maxScore > 0 ? Math.min(0.70 + maxScore * 0.1, 0.99) : 0.65;

  return {
    category: bestCategory,
    confidence,
    isBusiness: !isPersonal,
    explanation: maxScore > 0
      ? `Matched ML model keywords with score ${maxScore} for category "${bestCategory}".`
      : `Defaulted to "${bestCategory}" based on expense pattern.`,
  };
}
