import { BankId } from "./bank-id.types";

type BankSignature = {
  bank: Exclude<BankId, "UNKNOWN">;
  anyOf: string[][];
  threshold?: number;
};

const SIGNATURES: BankSignature[] = [
  {
    bank: "CIBC",
    anyOf: [
      ["date", "description", "debit", "credit"],
      ["date", "description", "amount"],
    ],
    threshold: 2,
  },
  {
    bank: "RBC",
    anyOf: [
      ["transaction date", "description", "withdrawals", "deposits"],
      ["date", "description", "withdrawals", "deposits"],
      ["account type", "account number", "transaction date", "description 1", "cad$"],
      ["account type", "account number", "transaction date", "description 1", "usd$"],
    ],
    threshold: 2,
  },
  {
    bank: "TD",
    anyOf: [
      ["date", "description", "withdrawal", "deposit"],
      ["transaction date", "description", "withdrawal", "deposit"],
      ["date", "description", "withdrawal", "deposit", "balance"],
      ["transaction date", "description", "withdrawal", "deposit", "balance"],
    ],
    threshold: 2,
  },
  {
    bank: "BMO",
    anyOf: [
      ["date", "description", "amount", "balance"],
      ["date", "description", "debit", "credit"],
    ],
    threshold: 2,
  },
];

function normalizeHeader(h: string): string {
  return (h ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function splitCsvLine(line: string): string[] {
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
  return out.map((s) => s.trim());
}

function parseHeaderLine(headerLine: string): string[] {
  return splitCsvLine(headerLine)
    .map(normalizeHeader)
    .filter(Boolean);
}

function scoreHeaders(headers: string[], required: string[]): number {
  const set = new Set(headers);
  let score = 0;

  for (const r of required) {
    if (set.has(normalizeHeader(r))) score++;
  }

  return score;
}

function looksLikeIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test((s ?? "").trim());
}

function hasMaskedDigits(s: string): boolean {
  return /\*{4,}/.test((s ?? "").trim());
}

function isAmountLike(s: string): boolean {
  const value = (s ?? "").trim().replace(/,/g, "");
  if (!value) return false;
  return /^-?\d+(\.\d+)?$/.test(value);
}

function isTdHeaderlessRow(cols: string[]): boolean {
  if (cols.length !== 5) return false;

  const date = (cols[0] ?? "").trim();
  const description = (cols[1] ?? "").trim();
  const withdrawal = (cols[2] ?? "").trim();
  const deposit = (cols[3] ?? "").trim();
  const balance = (cols[4] ?? "").trim();

  if (!looksLikeIsoDate(date)) return false;
  if (!description) return false;

  const withdrawalOk = withdrawal === "" || isAmountLike(withdrawal);
  const depositOk = deposit === "" || isAmountLike(deposit);
  const balanceOk = balance !== "" && isAmountLike(balance);

  if (!withdrawalOk || !depositOk || !balanceOk) return false;

  if (hasMaskedDigits(balance)) return false;

  if (withdrawal === "" && deposit === "") return false;

  return true;
}

export class BankDetectService {
  detectFromHeaders(headersRaw: string[]): BankId {
    const headers = headersRaw
      .map(normalizeHeader)
      .filter(Boolean);

    if (headers.length === 0) return "UNKNOWN";

    let best: { bank: BankId; score: number; max: number } = {
      bank: "UNKNOWN",
      score: 0,
      max: 0,
    };

    for (const sig of SIGNATURES) {
      for (const req of sig.anyOf) {
        const s = scoreHeaders(headers, req);
        const max = req.length;
        const threshold = sig.threshold ?? Math.ceil(max * 0.6);

        if (s >= threshold) {
          if (s > best.score || (s === best.score && max > best.max)) {
            best = { bank: sig.bank, score: s, max };
          }
        }
      }
    }

    return best.bank;
  }

  detectFromCsvText(csvText: string): BankId {
    if (!csvText) return "UNKNOWN";

    const cleaned = csvText
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const lines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return "UNKNOWN";

    const headerLine = lines[0];
    const headers = parseHeaderLine(headerLine);

    const detectedFromHeader = this.detectFromHeaders(headers);

    if (detectedFromHeader !== "UNKNOWN") {
      return detectedFromHeader;
    }

    const firstRowCols = splitCsvLine(lines[0]);

    const isCibcNoHeader5Col =
      firstRowCols.length === 5 &&
      looksLikeIsoDate(firstRowCols[0]) &&
      hasMaskedDigits(firstRowCols[4]);

    if (isCibcNoHeader5Col) {
      return "CIBC";
    }

    const sampleRows = lines.slice(0, Math.min(lines.length, 10));

    const tdMatches = sampleRows.filter((line) =>
      isTdHeaderlessRow(splitCsvLine(line))
    ).length;

    if (tdMatches >= 2) {
      return "TD";
    }

    return "UNKNOWN";
  }
}