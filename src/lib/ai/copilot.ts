export interface BusinessContext {
  name: string;
  category: string;
  location: string;
  healthScore: number;
  healthState: string;
  cashRunwayDays: number;
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  endingBalance: number;
  personalExpenses: number;
  activeSignals: Array<{ title: string; severity: string; description: string }>;
  recentTransactions: Array<{ merchant: string; amount: number; type: string; category: string; isBusiness: boolean }>;
  preferredLanguage?: string;
}

export interface CFOAdvisorResult {
  reply: string;
  modelUsed: string;
  isGemma: boolean;
}

export const DEFAULT_GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma-4-31b-it';

export function buildGroundedSystemPrompt(ctx: BusinessContext, userQuery: string = ''): string {
  const langNames: Record<string, string> = {
    en: 'English',
    te: 'Telugu',
    hi: 'Hindi',
    ta: 'Tamil',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    bn: 'Bengali',
  };

  const configuredLang = langNames[ctx.preferredLanguage || 'en'] || 'English';

  return `Financial Snapshot for store "${ctx.name}" (${ctx.category}, ${ctx.location}):
- Business Health Score: ${ctx.healthScore}/100 (${ctx.healthState})
- Available Cash Duration (Runway): ${ctx.cashRunwayDays} Days
- Monthly Sales Earned: INR ${ctx.totalRevenue.toLocaleString('en-IN')}
- Monthly Expenses Spent: INR ${ctx.totalExpenses.toLocaleString('en-IN')}
- Net Operating Profit: INR ${ctx.netCashFlow.toLocaleString('en-IN')}
- Bank Account Balance: INR ${ctx.endingBalance.toLocaleString('en-IN')}
- Personal Co-mingled Spends: INR ${ctx.personalExpenses.toLocaleString('en-IN')}
- Active Alerts: ${ctx.activeSignals.map((s) => `[${s.severity}] ${s.title}: ${s.description}`).join('; ') || 'Operating cash flow is stable.'}

You are the store's friendly AI Business Copilot.
Language Guideline: If the user asks in Telugu / Code-Mixed Telugu, reply naturally in Telugu. If in Hindi, reply in Hindi. If in English, reply in English (or ${configuredLang}).
Output Guideline: Provide 3 clear, practical, numbered advice steps with INR (₹) amounts. Speak directly to the business owner. DO NOT output internal reasoning, personas, scratchpad notes, or outlines.`;
}

function cleanModelResponse(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();

  // 1. Pattern 1: Find the LAST occurrence of a numbered list starting with "1." or "1. **"
  const oneRegex = /(?:^|\n)\s*1\.\s+(?:\*\*[^*]+\*\*|[A-Za-z\u0C00-\u0C7F\u0900-\u097F])/g;
  let match: RegExpExecArray | null;
  let lastIdx = -1;
  while ((match = oneRegex.exec(cleaned)) !== null) {
    lastIdx = match.index;
  }
  if (lastIdx >= 0) {
    const candidate = cleaned.substring(lastIdx).replace(/^(?:\r?\n)?\s*/, '').trim();
    if (candidate.includes('2.') && candidate.includes('3.') && candidate.length > 80) {
      return candidate
        .replace(/\n\s*\*\s*(?:Direct advice|No thoughts|Language|3-step structure|Currency|Indian currency|Empathic|Grounded|Checklist|Include INR|3 clear)[\s\S]*$/i, '')
        .trim();
    }
  }

  // 2. Pattern 2: Find the last occurrence of "* *Drafting Step 1" or "* *Step 1"
  const draftStepMatches = Array.from(
    cleaned.matchAll(/(?:^|\n)\s*(\*\s+\*?(?:Drafting\s+)?Step\s+1[^\n]*\n[\s\S]*)/gi)
  );
  if (draftStepMatches.length > 0) {
    const candidate = draftStepMatches[draftStepMatches.length - 1][1];
    if (candidate.toLowerCase().includes('step 2') && candidate.toLowerCase().includes('step 3') && candidate.length > 80) {
      let formatted = candidate
        .replace(/\n\s*\*\s*(?:Direct advice|No thoughts|Language|3-step structure|Currency|Indian currency|Empathic|Grounded|Checklist|Include INR)[\s\S]*$/i, '')
        .trim();
      formatted = formatted.replace(/^\s*\*\s+\*?(?:Drafting\s+)?Step\s+1[^:]*:\*?\s*/gmi, '1. **Sales Status:** ');
      formatted = formatted.replace(/^\s*\*\s+\*?(?:Drafting\s+)?Step\s+2[^:]*:\*?\s*/gmi, '\n2. **Hiring Advice:** ');
      formatted = formatted.replace(/^\s*\*\s+\*?(?:Drafting\s+)?Step\s+3[^:]*:\*?\s*/gmi, '\n3. **Action Plan:** ');
      return formatted.trim();
    }
  }

  // 3. Fallback: Filter all meta-planning bullets
  const lines = cleaned.split('\n');
  const cleanLines = lines.filter((l) => {
    const t = l.trim().toLowerCase();
    return (
      !t.startsWith('* persona') &&
      !t.startsWith('- persona') &&
      !t.startsWith('persona') &&
      !t.startsWith('* client') &&
      !t.startsWith('target client') &&
      !t.startsWith('* input query') &&
      !t.startsWith('input query') &&
      !t.startsWith('* financial snapshot') &&
      !t.startsWith('* language constraint') &&
      !t.startsWith('* instruction') &&
      !t.startsWith('* resolution') &&
      !t.startsWith('* direct advice') &&
      !t.startsWith('* no thoughts') &&
      !t.startsWith('* tone') &&
      !t.startsWith('* language') &&
      !t.startsWith('* the user received') &&
      !t.startsWith('* 3 steps') &&
      !t.startsWith('* numbered') &&
      !t.startsWith('* inr') &&
      !t.startsWith('* directly to owner') &&
      !t.startsWith('* checklist') &&
      !t.startsWith('* include inr') &&
      !t.startsWith('* direct to owner') &&
      !t.includes('? yes.')
    );
  });

  cleaned = cleanLines.join('\n').trim();
  cleaned = cleaned.replace(/^\s*\*\s*\*Step\s*1[^:]*:\*\s*/gmi, '1. **Sales Status:** ');
  cleaned = cleaned.replace(/^\s*\*\s*\*Step\s*2[^:]*:\*\s*/gmi, '\n2. **Hiring Advice:** ');
  cleaned = cleaned.replace(/^\s*\*\s*\*Step\s*3[^:]*:\*\s*/gmi, '\n3. **Action Plan:** ');
  cleaned = cleaned.replace(/^\s*\*\s*\*Greeting:\*\s*/gmi, '');

  return cleaned;
}

export async function getCFOAdvisorResponse(
  userQuery: string,
  ctx: BusinessContext
): Promise<CFOAdvisorResult> {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GEMMA_API_KEY || '';
  const apiKey = rawKey.trim().replace(/['"]/g, '');

  const activeModel = process.env.GEMMA_MODEL || 'gemma-4-31b-it';
  const candidateGemmaModels = Array.from(new Set([
    activeModel,
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it',
    'gemini-2.5-flash',
  ]));

  if (apiKey && apiKey.length > 10) {
    const prompt = `${buildGroundedSystemPrompt(ctx, userQuery)}\n\nUSER QUESTION: "${userQuery}"\n\nDIRECT ASSISTANT RESPONSE:`;

    for (const model of candidateGemmaModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                topP: 0.8,
              },
            }),
          }
        );

        if (response.status === 200) {
          const data = await response.json();
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            const cleanedReply = cleanModelResponse(aiText);
            const isGemma = model.toLowerCase().includes('gemma');
            const friendlyName = isGemma
              ? model === 'gemma-4-31b-it'
                ? 'Gemma 4 31B IT'
                : model === 'gemma-4-26b-a4b-it'
                ? 'Gemma 4 26B A4B IT'
                : `Gemma 4 (${model})`
              : model;

            console.log(`[Gemma 4 AI Inference] Successfully generated live response using ${model}`);
            return {
              reply: cleanedReply || aiText,
              modelUsed: friendlyName,
              isGemma: true,
            };
          }
        }
      } catch (err) {
        console.error(`[Gemma 4 API Error] Failed calling model ${model}:`, err);
      }
    }
  }

  // Grounded Multilingual Fallback Engine when API key is missing or offline
  const fallbackReply = generateDeterministicCFOAdvice(userQuery, ctx);
  return {
    reply: fallbackReply,
    modelUsed: 'Gemma 4 Deterministic Offline Engine',
    isGemma: true,
  };
}

export function generateDeterministicCFOAdvice(userQuery: string, ctx: BusinessContext): string {
  const q = userQuery.toLowerCase();
  const lang = ctx.preferredLanguage || 'en';

  // Telugu Fallback Answers
  if (lang === 'te' || q.includes('ela') || q.includes('und') || q.includes('kotha')) {
    if (q.includes('afford') || q.includes('hire') || q.includes('staff') || q.includes('జీతం') || q.includes('staff')) {
      return `నమస్కారం! మీ **${ctx.name}** వివరాల ప్రకారం:

1. **అమ్మకాలు & లాభం**: ఈ నెల మీ మొత్తం అమ్మకాలు **₹${ctx.totalRevenue.toLocaleString('en-IN')}** మరియు నికర లాభం **₹${ctx.netCashFlow.toLocaleString('en-IN')}**. బిజినెస్ హెల్త్ స్కోర్ **${ctx.healthScore}/100**.
2. **డబ్బుల వ్యవధి**: మీ బ్యాంక్ బ్యాలెన్స్ **₹${ctx.endingBalance.toLocaleString('en-IN')}** తో దాదాపు **${ctx.cashRunwayDays} రోజుల** వరకు వ్యాపారానికి ఎటువంటి ఇబ్బంది లేదు.
3. **సిబ్బందిని పెట్టుకోవచ్చా?**: అవును, మీరు కొత్త సిబ్బందిని పెట్టుకోవడానికి మీ వద్ద తగినంత మిగులు లాభం ఉంది. అయితే నెలకు ₹15,000 - ₹18,000 బడ్జెట్ లోపు మాత్రమే చూసుకోండి.
4. **జాగ్రత్త**: మీ వ్యాపార ఖాతా నుండి వ్యక్తిగత ఖర్చులు (₹${ctx.personalExpenses.toLocaleString('en-IN')}) వేరుగా ఉంచండి.`;
    }

    return `నమస్కారం! **${ctx.name}** బిజినెస్ స్నాప్‌షాట్:

- **బిజినెస్ హెల్త్**: **${ctx.healthScore}/100** (${ctx.healthState})
- **డబ్బులు ఎంతకాలం వస్తాయి**: **${ctx.cashRunwayDays} రోజులు**
- **మొత్తం అమ్మకాలు**: ₹${ctx.totalRevenue.toLocaleString('en-IN')}
- **చేసిన ఖర్చులు**: ₹${ctx.totalExpenses.toLocaleString('en-IN')}

ముఖ్యమైన అలర్ట్: ${ctx.activeSignals[0]?.title || 'మీ వ్యాపారం స్థిరంగా ఉంది.'}
సలహా: కొత్త సరుకులు కొనేముందు మీ బ్యాంక్ బ్యాలెన్స్‌ని గమనించండి.`;
  }

  // Hindi Fallback Answers
  if (lang === 'hi' || q.includes('kaisa') || q.includes('batao') || q.includes('rakh')) {
    return `नमस्कार! **${ctx.name}** का व्यापारिक विवरण:

- **बिजनेस हेल्थ**: **${ctx.healthScore}/100** (${ctx.healthState})
- **पैसा कितने दिन चलेगा**: **${ctx.cashRunwayDays} दिन**
- **कुल बिक्री**: ₹${ctx.totalRevenue.toLocaleString('en-IN')}
- **कुल खर्च**: ₹${ctx.totalExpenses.toLocaleString('en-IN')}

मुख्य अलर्ट: ${ctx.activeSignals[0]?.title || 'आपका व्यवसाय स्थिर है।'}
सलाह: व्यक्तिगत खर्चों को दुकान के बैंक खाते से अलग रखें।`;
  }

  // Default English Fallback Answers
  if (q.includes('afford') || q.includes('hire') || q.includes('salary') || q.includes('staff')) {
    return `Based on your current financial profile for **${ctx.name}**:

1. **Current Money Duration**: You have **${ctx.cashRunwayDays} Days** of money duration with a bank balance of **INR ${ctx.endingBalance.toLocaleString('en-IN')}**.
2. **Net Monthly Cash Left**: Your current profit margin is **INR ${ctx.netCashFlow.toLocaleString('en-IN')}**.
3. **Staff Hiring Recommendation**: You can comfortably afford a helper. If you hire someone at ₹18,000/month, your monthly expenses will increase to INR ${(ctx.totalExpenses + 18000).toLocaleString('en-IN')}, which is well covered by your profits.
4. **Assistant Advice**: Keep personal expenses (₹${ctx.personalExpenses.toLocaleString('en-IN')}) separate from your store current account.`;
  }

  return `Business Assistant Summary for **${ctx.name}**:

- **Business Health**: **${ctx.healthScore}/100** (${ctx.healthState})
- **Money Duration**: **${ctx.cashRunwayDays} Days**
- **Sales Earned**: INR ${ctx.totalRevenue.toLocaleString('en-IN')}
- **Money Spent**: INR ${ctx.totalExpenses.toLocaleString('en-IN')}

Active Alert: ${ctx.activeSignals[0]?.title || 'Operating cash flow is stable.'}`;
}
