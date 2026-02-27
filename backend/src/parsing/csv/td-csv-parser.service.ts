import { TdCsvRow } from "./td.types";

/**
 * TD CSV Parser
 * Expected header:
 * Date,Description,Withdrawal,Deposit,Balance
 */
export class TdCsvParserService {
  parse(csvText: string): TdCsvRow[] {
    const lines = this.toLines(csvText);
    if (lines.length < 2) return [];

    const headers = this.splitCsvLine(lines[0]).map(h => this.norm(h));
    const index = (name: string) => headers.findIndex(h => h === this.norm(name));

    const iDate = index("Date");
    const iDesc = index("Description");
    const iWith = index("Withdrawal");
    const iDep  = index("Deposit");
    const iBal  = index("Balance");

    if (iDate === -1 || iDesc === -1) {
      throw new Error("TD CSV missing required headers: Date, Description");
    }

    const rows: TdCsvRow[] = [];
    for (let r = 1; r < lines.length; r++) {
      const cols = this.splitCsvLine(lines[r]);
      if (cols.length === 0 || cols.every(c => this.norm(c) === "")) continue;

      rows.push({
        date: (cols[iDate] ?? "").trim(),
        description: (cols[iDesc] ?? "").trim(),
        withdrawal: iWith >= 0 ? (cols[iWith] ?? "").trim() : undefined,
        deposit: iDep >= 0 ? (cols[iDep] ?? "").trim() : undefined,
        balance: iBal >= 0 ? (cols[iBal] ?? "").trim() : undefined,
      });
    }
    return rows;
  }

  private toLines(text: string): string[] {
    const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return cleaned.split("\n").map(l => l.trim()).filter(l => l.length > 0);
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