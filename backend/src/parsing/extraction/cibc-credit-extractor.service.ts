import { Injectable } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { TransactionSource, TransactionType } from "@prisma/client";

export type NormalizedTransaction = {
  transactionDate: Date;
  postedDate: Date | null;
  description: string;
  amount: Decimal; // stored as positive; type tells direction
  currency: string;
  transactionType: TransactionType;
  source: TransactionSource;
};

@Injectable()
export class CibcCreditExtractorService {
  /**
   * Accepts CSV rows as arrays:
   * [date, description, amount, empty, cardRef]
   */
  extract(rows: string[][]): NormalizedTransaction[] {
    const out: NormalizedTransaction[] = [];

    for (const [i, row] of rows.entries()) {
      if (!row || row.length < 3) continue;

      const dateRaw = (row[0] ?? "").trim();
      const descRaw = (row[1] ?? "").trim();
      const amountRaw = (row[2] ?? "").trim();

      // skip totally empty lines
      if (!dateRaw && !descRaw && !amountRaw) continue;

      const transactionDate = this.parseISODate(dateRaw, `row ${i} col 0`);
      const { amount, transactionType } = this.parseAmountAndType(amountRaw, `row ${i} col 2`);

      // minimal hardening
      const description = descRaw.replace(/\s+/g, " ").trim();
      if (!description) {
        // if description missing, still keep but mark as placeholder
        // (or you can throw; depends on your validation strategy)
      }

      out.push({
        transactionDate,
        postedDate: null,
        description,
        amount,
        currency: "CAD",
        transactionType,
        source: TransactionSource.CSV,
      });
    }

    return out;
  }

  private parseISODate(value: string, ctx: string): Date {
    // expects YYYY-MM-DD (your CIBC file uses this)
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Invalid date (${ctx}): "${value}"`);
    }
    return d;
  }

  private parseAmountAndType(value: string, ctx: string): {
    amount: Decimal;
    transactionType: TransactionType;
  } {
    // allow "$1,234.56" just in case
    const cleaned = value.replace(/[$,]/g, "").trim();
    const n = Number(cleaned);
    if (!Number.isFinite(n)) {
      throw new Error(`Invalid amount (${ctx}): "${value}"`);
    }

    if (n < 0) {
      return { amount: new Decimal(Math.abs(n)), transactionType: TransactionType.CREDIT };
    }
    return { amount: new Decimal(n), transactionType: TransactionType.DEBIT };
  }
}
