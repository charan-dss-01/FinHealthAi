'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn';

export interface LanguageOption {
  code: LanguageCode;
  nativeTitle: string;
  englishTitle: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeTitle: 'English', englishTitle: 'English' },
  { code: 'te', nativeTitle: 'తెలుగు', englishTitle: 'Telugu' },
  { code: 'hi', nativeTitle: 'हिन्दी', englishTitle: 'Hindi' },
  { code: 'ta', nativeTitle: 'தமிழ்', englishTitle: 'Tamil' },
  { code: 'kn', nativeTitle: 'ಕನ್ನಡ', englishTitle: 'Kannada' },
  { code: 'ml', nativeTitle: 'മലയാളം', englishTitle: 'Malayalam' },
  { code: 'mr', nativeTitle: 'मराठी', englishTitle: 'Marathi' },
  { code: 'bn', nativeTitle: 'বাংলা', englishTitle: 'Bengali' },
];

// Dictionary type
type TranslationDictionary = Record<string, string>;

// Embedded Core Dictionaries for instant zero-lag translation
const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    'nav.home': 'Home Overview',
    'nav.history': 'Money History',
    'nav.watch': 'Things to Watch',
    'nav.test': 'Test a Decision',
    'nav.upload': 'Add Bank Statement',
    'nav.chat': 'Ask AI Assistant',
    'nav.new_setup': 'New Store Setup',
    'dash.welcome': 'Good morning',
    'dash.subtitle': 'Here is what is happening in your business today in simple plain language.',
    'dash.health_title': 'Business Health',
    'dash.health_tooltip': 'A simple 0-100 score showing how stable your business is based on sales, spending, and money available.',
    'dash.doing_well': '🟢 Doing Well',
    'dash.needs_attention': '🟡 Needs Attention',
    'dash.at_risk': '🟠 At Risk',
    'dash.critical': '🔴 Critical Action Required',
    'dash.money_available': 'Money Available',
    'dash.sales_earned': 'Sales Earned',
    'dash.money_spent': 'Money Spent',
    'dash.money_leftover': 'Money Left Over',
    'dash.money_duration': 'Money Duration',
    'dash.how_health_works': 'How Business Health works (3-Step Simple Guide)',
    'dash.important_alerts': 'Important Things to Know',
    'dash.sales_chart_title': 'Are my sales improving?',
    'dash.ask_assistant': 'Ask AI Assistant About This Alert →',
  },
  te: {
    'nav.home': 'హోమ్ ఓవర్‌వ్యూ',
    'nav.history': 'డబ్బుల హిస్టరీ',
    'nav.watch': 'గమనించాల్సిన విషయాలు',
    'nav.test': 'వ్యాపార నిర్ణయాన్ని పరీక్షించండి',
    'nav.upload': 'బ్యాంక్ స్టేట్‌మెంట్ జోడించండి',
    'nav.chat': 'AI అసిస్టెంట్‌ని అడగండి',
    'nav.new_setup': 'కొత్త షాపు సెటప్',
    'dash.welcome': 'శుభోదయం',
    'dash.subtitle': 'ఈరోజు మీ వ్యాపారంలో ఏం జరుగుతుందో సులువైన భాషలో ఇక్కడ చూడండి.',
    'dash.health_title': 'వ్యాపార ఆరోగ్యం (Business Health)',
    'dash.health_tooltip': 'అమ్మకాలు, ఖర్చులు మరియు అందుబాటులో ఉన్న డబ్బు ఆధారంగా మీ వ్యాపార స్థిరత్వాన్ని తెలిపే 0-100 స్కోరు.',
    'dash.doing_well': '🟢 బాగుంది (Doing Well)',
    'dash.needs_attention': '🟡 శ్రద్ధ వహించండి',
    'dash.at_risk': '🟠 ప్రమాదంలో ఉంది',
    'dash.critical': '🔴 వెంటనే చర్య తీసుకోండి',
    'dash.money_available': 'అందుబాటులో ఉన్న డబ్బు',
    'dash.sales_earned': 'వచ్చిన అమ్మకాలు (Sales)',
    'dash.money_spent': 'చేసిన ఖర్చులు',
    'dash.money_leftover': 'మిగిలిన నికర లాభం',
    'dash.money_duration': 'డబ్బులు ఎంతకాలం వస్తాయి',
    'dash.how_health_works': 'వ్యాపార ఆరోగ్యం ఎలా లెక్కించబడుతుంది (3 సులభమైన దశలు)',
    'dash.important_alerts': 'ముఖ్యమైన అలర్టులు & విషయాలు',
    'dash.sales_chart_title': 'నా అమ్మకాలు పెరుగుతున్నాయా?',
    'dash.ask_assistant': 'ఈ అలర్ట్ గురించి AI అసిస్టెంట్‌ని అడగండి →',
  },
  hi: {
    'nav.home': 'होम ओवरव्यू',
    'nav.history': 'पैसों का इतिहास',
    'nav.watch': 'ध्यान देने योग्य बातें',
    'nav.test': 'बिजनेस फैसले का परीक्षण',
    'nav.upload': 'बैंक स्टेटमेंट जोड़ें',
    'nav.chat': 'AI असिस्टेंट से पूछें',
    'nav.new_setup': 'नई दुकान सेटअप',
    'dash.welcome': 'शुभप्रभात',
    'dash.subtitle': 'आज आपके व्यवसाय में क्या हो रहा है, आसान भाषा में यहाँ देखें।',
    'dash.health_title': 'बिजनेस हेल्थ',
    'dash.health_tooltip': 'बिक्री, खर्च और उपलब्ध पैसों के आधार पर 0-100 का आसान बिजनेस स्कोर।',
    'dash.doing_well': '🟢 बढ़िया चल रहा है',
    'dash.needs_attention': '🟡 ध्यान देने की आवश्यकता',
    'dash.at_risk': '🟠 जोखिम में',
    'dash.critical': '🔴 तुरंत कार्रवाई करें',
    'dash.money_available': 'उपलब्ध पैसा',
    'dash.sales_earned': 'कुल बिक्री',
    'dash.money_spent': 'कुल खर्च',
    'dash.money_leftover': 'बचा हुआ लाभ',
    'dash.money_duration': 'पैसा कितने दिन चलेगा',
    'dash.how_health_works': 'बिजनेस हेल्थ कैसे काम करता है (3 आसान चरण)',
    'dash.important_alerts': 'महत्वपूर्ण अलर्ट्स और बातें',
    'dash.sales_chart_title': 'क्या मेरी बिक्री बढ़ रही है?',
    'dash.ask_assistant': 'इस अलर्ट के बारे में AI असिस्टेंट से पूछें →',
  },
  ta: {
    'nav.home': 'முகப்பு பார்வை',
    'nav.history': 'பண வரலாறு',
    'nav.watch': 'கவனிக்க வேண்டியவை',
    'nav.test': 'முடிவை சோதிக்கவும்',
    'nav.upload': 'வங்கி அறிக்கை சேர்க்கவும்',
    'nav.chat': 'AI உதவியாளரிடம் கேட்கவும்',
    'nav.new_setup': 'புதிய கடை அமைப்பு',
    'dash.welcome': 'காலை வணக்கம்',
    'dash.subtitle': 'இன்று உங்கள் தொழிலில் என்ன நடக்கிறது என்பதை எளிய தமிழில் பார்க்கவும்.',
    'dash.health_title': 'வியாபார ஆரோக்கியம்',
    'dash.health_tooltip': 'விற்பனை மற்றும் செலவுகளின் அடிப்படையில் உங்கள் தொழிலின் 0-100 நிலை.',
    'dash.doing_well': '🟢 நன்றாக உள்ளது',
    'dash.needs_attention': '🟡 கவனம் தேவை',
    'dash.at_risk': '🟠 ஆபத்தில் உள்ளது',
    'dash.critical': '🔴 உடனடியாக நடவடிக்கை எடுக்கவும்',
    'dash.money_available': 'இருப்பில் உள்ள பணம்',
    'dash.sales_earned': 'மொத்த விற்பனை',
    'dash.money_spent': 'செய்த செலவு',
    'dash.money_leftover': 'மீதமுள்ள லாபம்',
    'dash.money_duration': 'பணம் எத்தனை நாள் வரும்',
    'dash.how_health_works': 'வியாபார ஆரோக்கியம் எப்படி கணக்கிடப்படுகிறது (3 எளிய படிகள்)',
    'dash.important_alerts': 'முக்கியமான எச்சரிக்கைகள்',
    'dash.sales_chart_title': 'என் விற்பனை உயர்கிறதா?',
    'dash.ask_assistant': 'AI உதவியாளரிடம் கேட்கவும் →',
  },
  kn: {
    'nav.home': 'ಮುಖಪುಟ ನೋಟ',
    'nav.history': 'ಹಣದ ಇತಿಹಾಸ',
    'nav.watch': 'ಗಮನಿಸಬೇಕಾದ ಸಂಗತಿಗಳು',
    'nav.test': 'ವ್ಯವಹಾರ ನಿರ್ಧಾರ ಪರೀಕ್ಷಿಸಿ',
    'nav.upload': 'ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಸೇರಿಸಿ',
    'nav.chat': 'AI ಸಹಾಯಕರನ್ನು ಕೇಳಿ',
    'nav.new_setup': 'ಹೊಸ ಅಂಗಡಿ ಸ್ಥಾಪನೆ',
    'dash.welcome': 'ಶುಭೋದಯ',
    'dash.subtitle': 'ಇಂದು ನಿಮ್ಮ ವ್ಯವಹಾರದಲ್ಲಿ ಏನಾಗುತ್ತಿದೆ ಎಂಬುದನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ನೋಡಿ.',
    'dash.health_title': 'ವ್ಯವಹಾರದ ಆರೋಗ್ಯ',
    'dash.health_tooltip': 'ಮಾರಾಟ ಮತ್ತು ವೆಚ್ಚದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ವ್ಯವಹಾರದ 0-100 ಸ್ಥಿತಿ.',
    'dash.doing_well': '🟢 ಉತ್ತಮವಾಗಿದೆ',
    'dash.needs_attention': '🟡 ಗಮನ ಹರಿಸಬೇಕಾಗಿದೆ',
    'dash.at_risk': '🟠 ಅಪಾಯದಲ್ಲಿದೆ',
    'dash.critical': '🔴 ತಕ್ಷಣದ ಕ್ರಮ ಅಗತ್ಯವಿದೆ',
    'dash.money_available': 'ಲಭ್ಯವಿರುವ ಹಣ',
    'dash.sales_earned': 'ಒಟ್ಟು ಮಾರಾಟ',
    'dash.money_spent': 'ಮಾಡಿದ ವೆಚ್ಚ',
    'dash.money_leftover': 'ಉಳಿದ ಲಾಭ',
    'dash.money_duration': 'ಹಣ ಎಷ್ಟು ದಿನ ಬರಲಿದೆ',
    'dash.how_health_works': 'ವ್ಯವಹಾರದ ಆರೋಗ್ಯ ಹೇಗೆ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ (3 ಸರಳ ಹಂತಗಳು)',
    'dash.important_alerts': 'ಪ್ರಮುಖ ಎಚ್ಚರಿಕೆಗಳು',
    'dash.sales_chart_title': 'ನನ್ನ ಮಾರಾಟ ಹೆಚ್ಚುತ್ತಿದೆಯೇ?',
    'dash.ask_assistant': 'AI ಸಹಾಯಕರನ್ನು ಕೇಳಿ →',
  },
  ml: {
    'nav.home': 'ഹോം കാഴ്ച',
    'nav.history': 'പണത്തിന്റെ ചരിത്രം',
    'nav.watch': 'ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ',
    'nav.test': 'തീരുമാനം പരീക്ഷിക്കുക',
    'nav.upload': 'ബാങ്ക് സ്റ്റേറ്റ്മെന്റ് ചേർക്കുക',
    'nav.chat': 'AI അസിസ്റ്റന്റിനോട് ചോദിക്കുക',
    'nav.new_setup': 'പുതിയ സ്റ്റോർ ക്രമീകരണം',
    'dash.welcome': 'സുപ്രഭാതം',
    'dash.subtitle': 'ഇന്ന് നിങ്ങളുടെ ബിസിനസ്സിൽ എന്ത് സംഭവിക്കുന്നു എന്ന് ലളിതമായി കാണുക.',
    'dash.health_title': 'ബിസിനസ്സ് ആരോഗ്യം',
    'dash.health_tooltip': 'വില്പനയും ചെലവും അടിസ്ഥാനമാക്കിയുള്ള 0-100 ബിസിനസ്സ് സ്കോർ.',
    'dash.doing_well': '🟢 നന്നായി പോകുന്നു',
    'dash.needs_attention': '🟡 ശ്രദ്ധ ആവശ്യമാണ്',
    'dash.at_risk': '🟠 അപകടസാധ്യതയിൽ',
    'dash.critical': '🔴 ഉടൻ നടപടി എടുക്കുക',
    'dash.money_available': 'ലഭ്യമായ പണം',
    'dash.sales_earned': 'ആകെ വില്പന',
    'dash.money_spent': 'ആകെ ചെലവ്',
    'dash.money_leftover': 'ബാക്കിയുള്ള ലാഭം',
    'dash.money_duration': 'പണം എത്ര ദിവസം ഉണ്ടാകും',
    'dash.how_health_works': 'ബിസിനസ്സ് ആരോഗ്യം എങ്ങനെ കണക്കാക്കുന്നു (3 ലളിതമായ ഘട്ടങ്ങൾ)',
    'dash.important_alerts': 'പ്രധാനപ്പെട്ട അറിയിപ്പുകൾ',
    'dash.sales_chart_title': 'എന്റെ വില്പന മെച്ചപ്പെടുന്നുണ്ടോ?',
    'dash.ask_assistant': 'AI അസിസ്റ്റന്റിനോട് ചോദിക്കുക →',
  },
  mr: {
    'nav.home': 'मुख्य मुख्यपृष्ठ',
    'nav.history': 'पैशांचा इतिहास',
    'nav.watch': 'लक्ष देण्यासारख्या गोष्टी',
    'nav.test': 'व्यवसाय निर्णयाची चाचणी',
    'nav.upload': 'बँक स्टेटमेंट जोडा',
    'nav.chat': 'AI असिस्टंटला विचारा',
    'nav.new_setup': 'नवीन दुकान सेटअप',
    'dash.welcome': 'शुभ सकाळ',
    'dash.subtitle': 'आज तुमच्या व्यवसायात काय घडत आहे ते सोप्या भाषेत पहा.',
    'dash.health_title': 'बिजनेस हेल्थ',
    'dash.health_tooltip': 'विक्री आणि खर्चाच्या आधारावर 0-100 बिजनेस स्कोअर.',
    'dash.doing_well': '🟢 उत्तम चालले आहे',
    'dash.needs_attention': '🟡 लक्ष देणे गरजेचे',
    'dash.at_risk': '🟠 धोक्यात',
    'dash.critical': '🔴 ताबडतोब कारवाई करा',
    'dash.money_available': 'उपलब्ध रक्कम',
    'dash.sales_earned': 'एकूण विक्री',
    'dash.money_spent': 'एकूण खर्च',
    'dash.money_leftover': 'उरलेला नफा',
    'dash.money_duration': 'पैसे किती दिवस पुरतील',
    'dash.how_health_works': 'बिजनेस हेल्थ कसे मोजले जाते (3 सोप्या पायऱ्या)',
    'dash.important_alerts': 'महत्त्वाचे इशारे',
    'dash.sales_chart_title': 'माझी विक्री वाढत आहे का?',
    'dash.ask_assistant': 'AI असिस्टंटला विचारा →',
  },
  bn: {
    'nav.home': 'হোম ওভারভিউ',
    'nav.history': 'টাকার ইতিহাস',
    'nav.watch': 'লক্ষ্য রাখার মতো বিষয়',
    'nav.test': 'ব্যবসার সিদ্ধান্ত পরীক্ষা করুন',
    'nav.upload': 'ব্যাংক স্টেটমেন্ট যোগ করুন',
    'nav.chat': 'AI অ্যাসিস্ট্যান্টকে জিজ্ঞাসা করুন',
    'nav.new_setup': 'নতুন দোকান সেটআপ',
    'dash.welcome': 'শুভ সকাল',
    'dash.subtitle': 'আজ আপনার ব্যবসায় কী ঘটছে তা সহজ বাংলায় দেখুন।',
    'dash.health_title': 'বিজনেস হেলথ',
    'dash.health_tooltip': 'বিক্রি ও খরচের ওপর ভিত্তি করে ০-১০০ সহজ স্কোর।',
    'dash.doing_well': '🟢 খুব ভালো চলছে',
    'dash.needs_attention': '🟡 নজর দেওয়া প্রয়োজন',
    'dash.at_risk': '🟠 ঝুঁকিতে রয়েছে',
    'dash.critical': '🔴 অবিলম্বে ব্যবস্থা নিন',
    'dash.money_available': 'গচ্ছিত টাকা',
    'dash.sales_earned': 'মোট বিক্রি',
    'dash.money_spent': 'মোট খরচ',
    'dash.money_leftover': 'অবশিষ্ট লাভ',
    'dash.money_duration': 'টাকা কতদিন চলবে',
    'dash.how_health_works': 'বিজনেস হেলথ কীভাবে গণনা করা হয় (৩টি সহজ ধাপ)',
    'dash.important_alerts': 'গুরুত্বপূর্ণ অ্যালার্ট',
    'dash.sales_chart_title': 'আমার বিক্রি কি বাড়ছে?',
    'dash.ask_assistant': 'AI অ্যাসিস্ট্যান্টকে জিজ্ঞাসা করুন →',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  formatIndianCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  formatIndianCurrency: (val) => `₹${val.toLocaleString('en-IN')}`,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('finhealth_lang') as LanguageCode;
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('finhealth_lang', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key]) return dict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict[key]) return enDict[key];
    return fallback || key;
  };

  const formatIndianCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatIndianCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
