import { BadRequestException } from '@nestjs/common';
import { CibcRawRow } from './transaction-csv.parser';

export type ValidRow = {
  transactionDate: Date;
  // Keep raw merchant internally if you want later:
  // description: string;

  description: string;


  amount: string; 
  transactionType: 'DEBIT' | 'CREDIT';
  cardLast4: string | null;
  currency: 'CAD';
  source: 'CSV';
};

function isValidIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function to2(n: string) {
  const x = Number(n);
  if (!Number.isFinite(x)) throw new Error('NaN');
  return x.toFixed(2);
}

function last4(masked: string): string | null {
  const digits = (masked ?? '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

function cleanMerchant(desc: string): string {
  const original = (desc ?? "").replace(/\s+/g, " ").trim();
  if (!original) return "Card Transaction";

  let s = original;

  // normalize common noise prefixes
  s = s.replace(/^(pos\s+purchase|purchase|pos|preauth)\s+/i, "");

  // normalize UBER variants aggressively
  if (/^uber\b/i.test(s)) return "UBER TRIP";

  // 1) always drop trailing province/state like ", ON"
  s = s.replace(/,\s*[A-Z]{2}\s*$/i, "").trim();

  // 2) now trailing phone will be at end if it existed
  s = s.replace(/\s+(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\s*$/g, "").trim();

  // 3) remove trailing reference-like blobs
  s = s.replace(/\s+(ref|reference|auth|approval)\s*#?\s*[\w-]{6,}$/i, "").trim();

  // 4) optional: remove trailing city token(s) if present (keep conservative)
  // only remove the *last* 1-2 words if they look like a location and result stays meaningful
  const beforeCity = s.replace(/\s+[A-Za-z.'-]+(?:\s+[A-Za-z.'-]+)?\s*$/i, "").trim();
  if (beforeCity.split(/\s+/).length >= 2 && beforeCity.length >= 8) {
    // if original had ", XX" we assume last words might be city; apply reduction
    s = beforeCity;
  }

  s = s.replace(/\s+/g, " ").trim();

  // guard against meaningless leftovers
  const upper = s.toUpperCase();
  if (!s || upper.length < 3 || ["THE", "ON", "CA"].includes(upper)) {
    return "Card Transaction";
  }

  return s;
}




export function validateCibcRows(rows: CibcRawRow[]): ValidRow[] {
  const errors: string[] = [];
  const out: ValidRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // date
    if (!row.date || !isValidIsoDate(row.date)) {
      errors.push(`Row ${rowNum}: invalid date "${row.date}" (expected YYYY-MM-DD)`);
      continue;
    }
    const transactionDate = new Date(`${row.date}T00:00:00.000Z`);
    if (Number.isNaN(transactionDate.getTime())) {
      errors.push(`Row ${rowNum}: invalid date value "${row.date}"`);
      continue;
    }

    const debit = (row.debit ?? '').trim();
    const credit = (row.credit ?? '').trim();
    const hasDebit = debit !== '';
    const hasCredit = credit !== '';

    if (hasDebit && hasCredit) {
      errors.push(`Row ${rowNum}: both debit and credit filled`);
      continue;
    }
    if (!hasDebit && !hasCredit) {
      errors.push(`Row ${rowNum}: both debit and credit empty`);
      continue;
    }

    let transactionType: 'DEBIT' | 'CREDIT';
    let amount: string;

    try {
      if (hasDebit) {
        transactionType = 'DEBIT';
        const d = to2(debit);
        if (Number(d) <= 0) throw new Error('debit <=0');
        amount = d;
      } else {
        transactionType = 'CREDIT';
        const c = to2(credit);
        if (Number(c) <= 0) throw new Error('credit <=0');
        amount = c;
      }
    } catch {
      errors.push(`Row ${rowNum}: invalid amount (debit="${debit}", credit="${credit}")`);
      continue;
    }

    out.push({
      transactionDate,
      description: cleanMerchant(row.description),
      amount,
      transactionType,
      cardLast4: last4(row.cardMasked),
      currency: 'CAD',
      source: 'CSV',
    });
  }

  if (errors.length) {
    throw new BadRequestException({
      message: 'CIBC CSV validation failed',
      totalErrors: errors.length,
      errors: errors.slice(0, 10),
    });
  }

  return out;
}
