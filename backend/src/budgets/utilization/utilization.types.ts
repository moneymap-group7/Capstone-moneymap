import type { SpendCategory } from "@prisma/client";

export type UtilizationInput = {
  spendCategory: SpendCategory;
  budgetLimit: number;
  currentSpend: number;
};

export type BudgetUtilizationRow = {
  spendCategory: SpendCategory;
  budgetLimit: number;
  currentSpend: number;
  utilizationPercent: number;
  remainingAmount: number;
};