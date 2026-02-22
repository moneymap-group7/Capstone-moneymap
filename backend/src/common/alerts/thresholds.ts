import type { AlertSeverity } from "./alert.types";
import type { SpendCategory } from "@prisma/client";

export type ThresholdRule = {
  severity: AlertSeverity;
  percent: number;
};

export const DEFAULT_THRESHOLD_RULES: ThresholdRule[] = [
  { severity: "WARNING", percent: 1},
  { severity: "NEAR_LIMIT", percent: 2}, // optional
  { severity: "CRITICAL", percent: 3},
];

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  WARNING: 1,
  NEAR_LIMIT: 2,
  CRITICAL: 3,
};

// MVP choice: ignore UNCATEGORIZED to reduce noisy alerts until categorization improves.
export const DEFAULT_IGNORED_CATEGORIES: SpendCategory[] = [
  "INCOME",
  "TRANSFER",
  "UNCATEGORIZED",
];

export function normalizeRules(rules: ThresholdRule[]): ThresholdRule[] {
  const cleaned = rules
    .map((r) => ({ severity: r.severity, percent: Number(r.percent) }))
    .filter((r) => Number.isFinite(r.percent) && r.percent > 0);

  cleaned.sort(
    (a, b) =>
      a.percent - b.percent || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );

  const out: ThresholdRule[] = [];
  for (const r of cleaned) {
    const last = out[out.length - 1];
    if (last && last.severity === r.severity && last.percent === r.percent) continue;
    out.push(r);
  }

  return out;
}