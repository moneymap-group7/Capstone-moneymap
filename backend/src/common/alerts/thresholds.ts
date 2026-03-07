import type { AlertSeverity } from "./alert.types";

export type ThresholdRule = {
  severity: AlertSeverity;
  percent: number; // 0–100
};

export const DEFAULT_THRESHOLD_RULES: ThresholdRule[] = [
  { severity: "WARNING", percent: 80 },
  { severity: "NEAR_LIMIT", percent: 90 }, // optional; keep for now
  { severity: "CRITICAL", percent: 100 },
];

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  WARNING: 1,
  NEAR_LIMIT: 2,
  CRITICAL: 3,
};