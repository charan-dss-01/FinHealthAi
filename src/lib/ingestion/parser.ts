export interface ParsedRawTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balance?: number;
}

export function parseBankStatementCSV(csvContent: string): ParsedRawTransaction[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const transactions: ParsedRawTransaction[] = [];

  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let creditCol = -1;
  let debitCol = -1;
  let amountCol = -1;
  let typeCol = -1;

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const cols = lines[i].split(/[,;\t]/).map((c) => c.replace(/["']/g, '').trim().toLowerCase());

    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      if (col.includes('date') || col.includes('txn') || col.includes('dt')) dateCol = c;
      if (col.includes('description') || col.includes('narration') || col.includes('particulars') || col.includes('remark') || col.includes('detail')) descCol = c;
      if (col.includes('credit') || col.includes('deposit') || col.includes('cr')) creditCol = c;
      if (col.includes('debit') || col.includes('withdrawal') || col.includes('dr')) debitCol = c;
      if (col.includes('amount') || col.includes('val')) amountCol = c;
      if (col.includes('type') || col.includes('cr/dr')) typeCol = c;
    }

    if (dateCol !== -1 || descCol !== -1 || creditCol !== -1 || debitCol !== -1 || amountCol !== -1) {
      headerIndex = i;
      break;
    }
  }

  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const row = lines[i].split(/[,;\t]/).map((c) => c.replace(/["']/g, '').trim());
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    // Find date column or fallback
    let dateStr = dateCol !== -1 && row[dateCol] ? row[dateCol] : row[0];
    let descStr = descCol !== -1 && row[descCol] ? row[descCol] : row[1] || row[0];

    // If header row skipped
    if (descStr.toLowerCase().includes('description') || descStr.toLowerCase().includes('narration')) continue;

    let parsedDate = parseIndianDate(dateStr);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      parsedDate = new Date(); // Fallback to current date
    }

    let amount = 0;
    let type: 'CREDIT' | 'DEBIT' = 'DEBIT';

    if (creditCol !== -1 && debitCol !== -1 && row.length > Math.max(creditCol, debitCol)) {
      const creditVal = parseFloat(row[creditCol]?.replace(/[^0-9.]/g, '') || '0');
      const debitVal = parseFloat(row[debitCol]?.replace(/[^0-9.]/g, '') || '0');

      if (creditVal > 0) {
        amount = creditVal;
        type = 'CREDIT';
      } else if (debitVal > 0) {
        amount = debitVal;
        type = 'DEBIT';
      }
    }

    if (amount === 0) {
      // Look for any numerical amount in remaining columns
      for (let c = row.length - 1; c >= 0; c--) {
        const val = parseFloat(row[c]?.replace(/[^0-9.]/g, '') || '0');
        if (!isNaN(val) && val > 0 && c !== dateCol) {
          amount = val;
          if (row[c]?.toUpperCase().includes('CR') || row.join(' ').toUpperCase().includes('CREDIT')) {
            type = 'CREDIT';
          }
          break;
        }
      }
    }

    if (amount > 0 && descStr) {
      transactions.push({
        date: parsedDate,
        description: descStr,
        amount,
        type,
      });
    }
  }

  return transactions;
}

function parseIndianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return new Date(dateStr);
    }
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      let year = parseInt(ddmmyyyy[3], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }

    const ddMmmYyyy = dateStr.match(/^(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{2,4})/);
    if (ddMmmYyyy) {
      const day = parseInt(ddMmmYyyy[1], 10);
      let year = parseInt(ddMmmYyyy[3], 10);
      if (year < 100) year += 2000;
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };
      const month = monthMap[ddMmmYyyy[2].toLowerCase()] ?? 0;
      return new Date(year, month, day);
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
