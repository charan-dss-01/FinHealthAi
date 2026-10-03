import { parseBankStatementCSV } from '../src/lib/ingestion/parser';
import { normalizeTransactionDescription } from '../src/lib/ingestion/normalizer';
import { classifyTransaction } from '../src/lib/ml/classifier';
import { detectComingling } from '../src/lib/ingestion/comingling';

const sampleStatement = `Date,Description,Credit,Debit
01/08/2026,UPI/3218491823/Swiggy Food Order,,480
02/08/2026,UPI/981244/HUL DISTRIBUTOR BANGALORE,,45000
03/08/2026,BHARATPE SETTLEMENT CREDIT,12500,
04/08/2026,BESCOM ELECTRICITY BILL,,4200
05/08/2026,NETFLIX MONTHLY SUBSCRIPTION,,649`;

console.log('--- TESTING BANK STATEMENT INGESTION & ML CLASSIFIER ---');

const parsed = parseBankStatementCSV(sampleStatement);
console.log(`Parsed ${parsed.length} raw transactions.`);

parsed.forEach((tx, idx) => {
  const norm = normalizeTransactionDescription(tx.description);
  const cls = classifyTransaction(tx.description, norm.cleanMerchant, tx.amount, tx.type);
  const com = detectComingling(norm.cleanMerchant, tx.description, cls.category);

  console.log(`\n[Row ${idx + 1}]`);
  console.log(`  Raw Text   : "${tx.description}"`);
  console.log(`  Clean Name : "${norm.cleanMerchant}" (Channel: ${norm.channel})`);
  console.log(`  ML Category: "${cls.category}" (Confidence: ${cls.confidence * 100}%)`);
  console.log(`  Tag        : ${com.isBusiness ? 'BUSINESS EXPENSE' : '⚠️ PERSONAL CO-MINGLED SPEND'}`);
});

console.log('\n✅ Ingestion & ML Pipeline Verification Complete!');
