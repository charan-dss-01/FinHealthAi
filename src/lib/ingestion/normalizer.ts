export interface NormalizedTransaction {
  rawDescription: string;
  cleanMerchant: string;
  channel: 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'ATM' | 'POS' | 'CHEQUE' | 'OTHER';
  referenceNumber?: string;
}

export function normalizeTransactionDescription(description: string): NormalizedTransaction {
  if (!description) {
    return {
      rawDescription: '',
      cleanMerchant: 'Unknown',
      channel: 'OTHER',
    };
  }

  const cleanRaw = description.trim();
  let channel: NormalizedTransaction['channel'] = 'OTHER';
  let referenceNumber: string | undefined = undefined;
  let merchant = cleanRaw;

  // Detect UPI transactions: e.g. "UPI/3218491823/Swiggy/swiggy@icici/Pay" or "UPI-SWIGGY-321849"
  if (cleanRaw.toUpperCase().includes('UPI')) {
    channel = 'UPI';
    const parts = cleanRaw.split(/[\/\-\:]/);
    // Find numeric reference number (usually 10-12 digits)
    const refMatch = cleanRaw.match(/\b\d{10,12}\b/);
    if (refMatch) {
      referenceNumber = refMatch[0];
    }

    // Try extracting merchant candidate from split parts
    const candidates = parts.filter(
      (p) =>
        p.length > 2 &&
        !/^UPI$/i.exec(p) &&
        !/^\d+$/.test(p) &&
        !/^PAY$/i.exec(p) &&
        !/^UPIREF$/i.exec(p) &&
        !p.includes('@')
    );
    if (candidates.length > 0) {
      merchant = candidates[0].trim();
    }
  } else if (cleanRaw.toUpperCase().startsWith('NEFT')) {
    channel = 'NEFT';
    const parts = cleanRaw.split(/[\/\-\:]/);
    const candidates = parts.filter((p) => p.length > 2 && !/^NEFT$/i.exec(p) && !/^\d+$/.test(p));
    if (candidates.length > 0) merchant = candidates[0].trim();
  } else if (cleanRaw.toUpperCase().startsWith('IMPS')) {
    channel = 'IMPS';
    const parts = cleanRaw.split(/[\/\-\:]/);
    const candidates = parts.filter((p) => p.length > 2 && !/^IMPS$/i.exec(p) && !/^\d+$/.test(p));
    if (candidates.length > 0) merchant = candidates[0].trim();
  } else if (cleanRaw.toUpperCase().includes('ATM')) {
    channel = 'ATM';
    merchant = 'Cash Withdrawal (ATM)';
  } else if (cleanRaw.toUpperCase().includes('POS')) {
    channel = 'POS';
    const parts = cleanRaw.split(/[\/\-\:]/);
    const candidates = parts.filter((p) => p.length > 2 && !/^POS$/i.exec(p) && !/^\d+$/.test(p));
    if (candidates.length > 0) merchant = candidates[0].trim();
  }

  // Known Indian Merchant Cleaning Map
  const knownMerchants: Record<string, string> = {
    swiggy: 'Swiggy',
    zomato: 'Zomato',
    amazon: 'Amazon',
    flipkart: 'Flipkart',
    uber: 'Uber',
    ola: 'Ola Cabs',
    bescom: 'BESCOM Electricity',
    tatapower: 'Tata Power',
    airtel: 'Airtel Telecom',
    jio: 'Reliance Jio',
    metro: 'Metro Cash & Carry',
    hul: 'HUL Distributor',
    dmart: 'Avenue Supermarts (DMart)',
    paytm: 'PayTM Merchant Settlement',
    phonepe: 'PhonePe Settlement',
    bharatpe: 'BharatPe Settlement',
    lic: 'LIC Insurance Premium',
    sbi: 'State Bank of India',
    hdfc: 'HDFC Bank',
  };

  const lowerMerchant = merchant.toLowerCase();
  for (const [key, cleanName] of Object.entries(knownMerchants)) {
    if (lowerMerchant.includes(key)) {
      merchant = cleanName;
      break;
    }
  }

  // Capitalize nicely if untouched
  if (merchant === cleanRaw && merchant.length > 0) {
    merchant = merchant
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return {
    rawDescription: cleanRaw,
    cleanMerchant: merchant || 'General Transaction',
    channel,
    referenceNumber,
  };
}
