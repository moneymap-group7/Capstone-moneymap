import type { SpendCategory } from "@prisma/client";

export type Money = number;

export type BudgetUtilizationRow = {
  spendCategory: SpendCategory;
  budgetLimit: Money;
  currentSpend: Money;
  utilizationPercent: number;
  remainingAmount: Money;
};

export type AlertSeverity = "NEAR_LIMIT" | "WARNING" | "CRITICAL";

export type BudgetAlert = {
  spendCategory: SpendCategory;
  severity: AlertSeverity;

  thresholdPercent: number;
  currentPercent: number;

  budgetLimit: Money;
  currentSpend: Money;

  remainingAmount: Money;
  exceededAmount: Money;

  message: string;
};