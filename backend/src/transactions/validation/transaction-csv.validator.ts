import { BadRequestException } from '@nestjs/common';
import { CibcRawRow } from './transaction-csv.parser';

export type ValidRow = {
  transactionDate: Date;
  // Keep raw merchant internally if you want later:
  // description: string;

  // generic label (no merchant leak)
  label: 'CARD TRANSACTION' | 'SUBSCRIPTION' | 'TRANSFER' | 'INCOME' | 'OTHER';

  amount: string; // signed decimal string
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
  const digits = (masked ?? "").replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

function makeLabel(desc: string): ValidRow['label'] {
  const d = (desc ?? '').toLowerCase();

  // You can expand these rules any time:
  if (d.includes('openai') || d.includes('netflix') || d.includes('spotify') || d.includes('subscr')) {
    return 'SUBSCRIPTION';
  }
  if (d.includes('e-transfer') || d.includes('etransfer') || d.includes('transfer')) {
    return 'TRANSFER';
  }
  if (d.includes('payroll') || d.includes('salary') || d.includes('deposit')) {
    return 'INCOME';
  }
  if (!d.trim()) return 'OTHER';
  return 'CARD TRANSACTION';
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
      label: makeLabel(row.description),
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
