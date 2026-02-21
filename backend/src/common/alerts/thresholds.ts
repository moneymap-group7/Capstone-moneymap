import type { AlertSeverity } from "./alert.types";
import type { SpendCategory } from "@prisma/client";

export type ThresholdRule = {
  severity: AlertSeverity;
  percent: number;
};

export const DEFAULT_THRESHOLD_RULES: ThresholdRule[] = [
  { severity: "WARNING", percent: 80 },
  { severity: "NEAR_LIMIT", percent: 90 }, // optional
  { severity: "CRITICAL", percent: 100 },
];

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  WARNING: 1,
  NEAR_LIMIT: 2,
  CRITICAL: 3,
};

export const DEFAULT_IGNORED_CATEGORIES: SpendCategory[] = [
  "INCOME",
  "TRANSFER",
  "UNCATEGORIZED",
];