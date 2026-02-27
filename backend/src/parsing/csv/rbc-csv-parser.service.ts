import { RbcCsvRow } from "./rbc.types";

/**
 * RBC CSV Parser
 *
 * Supports BOTH common RBC export formats:
 * 1) Transaction Date,Description,Withdrawals,Deposits,Balance
 * 2) Account Type,Account Number,Transaction Date,Cheque Number,Description 1,Description 2,CAD$,USD$
 *
 * Required:
 * - Transaction Date
 * - Description (or Description 1)
 */
export class RbcCsvParserService {
  parse(csvText: string): RbcCsvRow[] {
    const lines = this.toLines(csvText);
    if (lines.length < 2) return [];

    const headersRaw = this.splitCsvLine(lines[0]);
    const headers = headersRaw.map((h) => this.norm(h));
    const index = (name: string) => headers.findIndex((h) => h === this.norm(name));

    // Required
    const iDate = index("Transaction Date");

    // Description can be either "Description" OR "Description 1" (+ optional "Description 2")
    const iDesc = index("Description");
    const iDesc1 = index("Description 1");
    const iDesc2 = index("Description 2");

    // Amount columns vary by export type
    const iWith = index("Withdrawals");
    const iDep = index("Deposits");
    const iCad = index("CAD$");
    const iUsd = index("USD$");

    // Optional
    const iBal = index("Balance");

    if (iDate === -1 || (iDesc === -1 && iDesc1 === -1)) {
      throw new Error(
        "RBC CSV missing required headers: Transaction Date and Description (or Description 1)"
      );
    }

    const rows: RbcCsvRow[] = [];

    for (let r = 1; r < lines.length; r++) {
      const cols = this.splitCsvLine(lines[r]);
      if (cols.length === 0 || cols.every((c) => this.norm(c) === "")) continue;

      const transactionDate = (cols[iDate] ?? "").trim();

      const description =
        iDesc >= 0
          ? (cols[iDesc] ?? "").trim()
          : [cols[iDesc1] ?? "", iDesc2 >= 0 ? cols[iDesc2] ?? "" : ""]
              .map((s) => (s ?? "").trim())
              .filter((s) => s.length > 0)
              .join(" ")
              .trim();

      // Withdrawals/Deposits format (classic export)
      const withdrawals = iWith >= 0 ? (cols[iWith] ?? "").trim() : undefined;
      const deposits = iDep >= 0 ? (cols[iDep] ?? "").trim() : undefined;

      // CAD$/USD$ format (your file)
      // In this export, amounts can appear in CAD$ or USD$ columns.
      // We keep them as deposits by default (you can refine later in canonical mapping).
      const cadAmount = iCad >= 0 ? (cols[iCad] ?? "").trim() : "";
      const usdAmount = iUsd >= 0 ? (cols[iUsd] ?? "").trim() : "";

      rows.push({
        transactionDate,
        description,

        // Prefer classic fields if present; otherwise use CAD$/USD$ columns.
        withdrawals:
          withdrawals !== undefined && withdrawals !== ""
            ? withdrawals
            : undefined,

        deposits:
          deposits !== undefined && deposits !== ""
            ? deposits
            : (cadAmount || usdAmount) ? (cadAmount || usdAmount) : undefined,

        balance: iBal >= 0 ? (cols[iBal] ?? "").trim() : undefined,
      });
    }

    return rows;
  }

  private toLines(text: string): string[] {
    // normalize newlines + remove BOM
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

  /**
   * Minimal CSV splitter that supports quoted values with commas.
   */
  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        // handle escaped double quote ""
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