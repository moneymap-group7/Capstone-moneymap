// backend/src/parsing/extraction/cibc-credit-extractor.service.ts

import { Injectable } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";

export type NormalizedTransaction = {
  transactionDate: Date;
  description: string;
  amount: Decimal; // always positive; direction via transactionType
  currency: "CAD";
  transactionType: "DEBIT" | "CREDIT";
  source: "CSV";
  cardLast4: string | null;
};

@Injectable()
export class CibcCreditExtractorService {
  /**
   * CIBC Credit Card CSV rows (no headers):
   * [0] Transaction Date (YYYY-MM-DD)
   * [1] Description
   * [2] Amount
   * [3] (blank)
   * [4] Masked card number (e.g., 4505********9691)
   */
  extract(rows: string[][]): NormalizedTransaction[] {
    const out: NormalizedTransaction[] = [];

    for (const [i, row] of rows.entries()) {
      if (!row || row.length < 3) continue;

      const dateRaw = (row[0] ?? "").trim();
      const descRaw = (row[1] ?? "").trim();
      const amountRaw = (row[2] ?? "").trim();
      const cardRaw = (row[4] ?? "").trim();

      // skip empty lines
      if (!dateRaw && !descRaw && !amountRaw) continue;

      const transactionDate = this.parseLocalISODate(dateRaw, `row ${i} col 0`);
      const { amount, transactionType } = this.parseAmountAndType(amountRaw, `row ${i} col 2`);
      const description = descRaw.replace(/\s+/g, " ").trim();
      const cardLast4 = this.extractLast4(cardRaw);

      out.push({
        transactionDate,
        description,
        amount,
        currency: "CAD",
        transactionType,
        source: "CSV",
        cardLast4,
      });
    }

    return out;
  }

  // Avoid timezone shifting issues
  private parseLocalISODate(value: string, ctx: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) throw new Error(`Invalid date (${ctx}): "${value}"`);
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  // Supports "$1,234.56", "-12.34", "(12.34)"
  private parseAmountAndType(value: string, ctx: string): {
    amount: Decimal;
    transactionType: "DEBIT" | "CREDIT";
  } {
    const raw = value.trim();
    if (!raw) throw new Error(`Missing amount (${ctx})`);

    const isParenNegative = raw.startsWith("(") && raw.endsWith(")");
    const cleaned = raw.replace(/[(),$]/g, "").replace(/,/g, "").trim();

    const n = Number(cleaned);
    if (!Number.isFinite(n)) throw new Error(`Invalid amount (${ctx}): "${value}"`);

    const signed = isParenNegative ? -n : n;

    return signed < 0
      ? { amount: new Decimal(Math.abs(signed)), transactionType: "CREDIT" }
      : { amount: new Decimal(signed), transactionType: "DEBIT" };
  }

  private extractLast4(cardMasked: string): string | null {
    if (!cardMasked) return null;
    const digits = cardMasked.replace(/\D/g, "");
    return digits.length >= 4 ? digits.slice(-4) : null;
  }
}
