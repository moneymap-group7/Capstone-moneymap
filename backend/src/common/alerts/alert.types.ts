import type { SpendCategory } from "@prisma/client";

export type  Money = number;

export type BudgetUtilizationRow = {
  spendCategory: SpendCategory;
  budgetLimit: Money;       // 500.00
  currentSpend: Money;      // 420.00
  utilizationPercent: number; 
  remainingAmount: Money;    // 84
};

export type AlertSeverity = "WARNING" | "NEAR_LIMIT" | "CRITICAL";

export type BudgetAlert = {
  spendCategory: SpendCategory;

  severity: AlertSeverity;

  thresholdPercent: number;
  currentPercent: number;

  budgetLimit: Money;
  currentSpend: Money;

  remainingAmount: Money; // 80.00 if under budget else 0.00
  exceededAmount: Money;  // 0.00 if under budget else 36.00

  message: string;
};