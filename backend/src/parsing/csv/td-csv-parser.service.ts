import { TdCsvRow } from "./td.types";

/**
 * TD CSV Parser
 *
 * Supports BOTH:
 *
 * 1. Header-based CSV:
 *    Date,Description,Withdrawal,Deposit,Balance
 *
 * 2. Headerless TD account activity exports like:
 *    "2026-02-05","SEND E-TFR ***JSx","3000",,"77035.05"
 */
export class TdCsvParserService {
  parse(csvText: string): TdCsvRow[] {
    const lines = this.toLines(csvText);
    if (lines.length === 0) return [];

    const firstRow = this.splitCsvLine(lines[0]).map((c) => c.trim());

    if (this.looksLikeHeader(firstRow)) {
      return this.parseHeaderBased(lines);
    }

    if (this.looksLikeHeaderlessTdData(firstRow)) {
      return this.parseHeaderlessTd(lines);
    }

    throw new Error(
      "Unsupported TD CSV format. Expected TD header row or TD account activity rows."
    );
  }

  private parseHeaderBased(lines: string[]): TdCsvRow[] {
    if (lines.length < 2) return [];

    const headers = this.splitCsvLine(lines[0]).map((h) => this.norm(h));
    const index = (name: string) => headers.findIndex((h) => h === this.norm(name));

    const iDate = index("Date");
    const iDesc = index("Description");
    const iWith = index("Withdrawal");
    const iDep = index("Deposit");
    const iBal = index("Balance");

    if (iDate === -1 || iDesc === -1) {
      throw new Error("TD CSV missing required headers: Date, Description");
    }

    const rows: TdCsvRow[] = [];

    for (let r = 1; r < lines.length; r++) {
      const cols = this.splitCsvLine(lines[r]).map((c) => c.trim());

      if (cols.length === 0 || cols.every((c) => this.norm(c) === "")) continue;

      rows.push({
        date: cols[iDate] ?? "",
        description: cols[iDesc] ?? "",
        withdrawal: iWith >= 0 ? this.emptyToUndefined(cols[iWith]) : undefined,
        deposit: iDep >= 0 ? this.emptyToUndefined(cols[iDep]) : undefined,
        balance: iBal >= 0 ? this.emptyToUndefined(cols[iBal]) : undefined,
      });
    }

    return rows;
  }

  private parseHeaderlessTd(lines: string[]): TdCsvRow[] {
    const rows: TdCsvRow[] = [];

    for (const line of lines) {
      const cols = this.splitCsvLine(line).map((c) => c.trim());

      if (cols.length === 0 || cols.every((c) => this.norm(c) === "")) continue;

      // Expected TD account activity shape:
      // [date, description, withdrawal, deposit, balance]
      if (cols.length < 5) {
        continue;
      }

      const date = cols[0] ?? "";
      const description = cols[1] ?? "";
      const withdrawal = this.emptyToUndefined(cols[2]);
      const deposit = this.emptyToUndefined(cols[3]);
      const balance = this.emptyToUndefined(cols[4]);

      if (!this.isIsoDate(date) || !description) {
        continue;
      }

      rows.push({
        date,
        description,
        withdrawal,
        deposit,
        balance,
      });
    }

    return rows;
  }

  private looksLikeHeader(row: string[]): boolean {
    const normalized = row.map((c) => this.norm(c));

    return (
      normalized.includes("date") &&
      normalized.includes("description") &&
      (
        normalized.includes("withdrawal") ||
        normalized.includes("deposit") ||
        normalized.includes("balance")
      )
    );
  }

  private looksLikeHeaderlessTdData(row: string[]): boolean {
    // Typical TD account activity export:
    // "2026-02-05","SEND E-TFR ***JSx","3000",,"77035.05"
    if (row.length < 5) return false;

    const [date, description, withdrawal, deposit, balance] = row;

    const looksLikeDate = this.isIsoDate(date);
    const hasDescription = !!description?.trim();
    const hasAmountColumn =
      this.isAmount(withdrawal) || this.isAmount(deposit) || this.isAmount(balance);

    const tdKeywords = [
      "td atm dep",
      "td mortgage",
      "acct bal rebate",
      "monthly account fee",
      "send e-tfr",
      "cad draft",
      "pts to:",
    ];

    const descNorm = this.norm(description);
    const hasTdKeyword = tdKeywords.some((k) => descNorm.includes(k));

    return looksLikeDate && hasDescription && hasAmountColumn && hasTdKeyword;
  }

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test((value ?? "").trim());
  }

  private isAmount(value: string | undefined): boolean {
    const v = (value ?? "").trim();
    if (!v) return false;
    return /^-?\d+(\.\d+)?$/.test(v.replace(/,/g, ""));
  }

  private emptyToUndefined(value: string | undefined): string | undefined {
    const v = (value ?? "").trim();
    return v === "" ? undefined : v;
  }

  private toLines(text: string): string[] {
    const cleaned = text
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    return cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  private norm(s: string): string {
    return (s ?? "").trim().toLowerCase();
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        const next = line[i + 1];

        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }

      cur += ch;
    }

    out.push(cur);
    return out;
  }
}