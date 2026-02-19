import { Injectable } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { ParsedTransactionForDb } from "./cibc.types";

@Injectable()
export class CibcCsvParserService {
 
  parse(buffer: Buffer): ParsedTransactionForDb[] {
    const rows: unknown[][] = parse(buffer, {
      columns: false,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    });

    const out: ParsedTransactionForDb[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const dateStr = this.asString(row[0]);
      const description = this.asString(row[1]);
      const debitStr = this.asString(row[2]);
      const creditStr = this.asString(row[3]);
      const maskedCard = this.asString(row[4]);

      const transactionDate = this.parseDateYYYYMMDD(dateStr, i);

      const debit = this.parseMoneyOrNull(debitStr);
      const credit = this.parseMoneyOrNull(creditStr);

      if (debit == null && credit == null) {
        throw new Error(`Row ${i + 1}: missing both debit and credit`);
      }
      if (debit != null && credit != null) {
        throw new Error(`Row ${i + 1}: both debit and credit present`);
      }

      const signed = debit != null ? -debit : +credit!;
      const transactionType: "DEBIT" | "CREDIT" = signed < 0 ? "DEBIT" : "CREDIT";

      out.push({
        transactionDate,


        description,

        amount: this.toDecimalString2(signed),
        currency: "CAD",

        transactionType,
        source: "CSV",

        spendCategory: "UNCATEGORIZED",
        cardLast4: this.extractLast4(maskedCard),

        balanceAfter: null,
      });
    }

    return out;
  }

  private asString(v: unknown): string {
    if (v === null || v === undefined) return "";
    return String(v).trim();
  }

  private parseMoneyOrNull(v: string): number | null {
    const s = v.trim();
    if (!s) return null;
    const normalized = s.replace(/[$,]/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  private toDecimalString2(n: number): string {
    return n.toFixed(2);
  }

  private parseDateYYYYMMDD(value: string, rowIndex: number): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) throw new Error(`Row ${rowIndex + 1}: invalid date "${value}"`);
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private extractLast4(masked: string): string | null {
    const digits = masked.replace(/\D/g, "");
    if (digits.length < 4) return null;
    return digits.slice(-4);
  }
}
