export type SpendCategory =
  | "FOOD_AND_DINING"
  | "GROCERIES"
  | "TRANSPORTATION"
  | "SHOPPING"
  | "UTILITIES"
  | "RENT"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "EDUCATION"
  | "TRAVEL"
  | "FEES"
  | "INCOME"
  | "TRANSFER"
  | "OTHER"
  | "UNCATEGORIZED";

export type MoneyString = string;

export type BudgetUtilizationRow = {
  spendCategory: SpendCategory;
  budgetLimit: MoneyString;       // "500.00"
  currentSpend: MoneyString;      // "420.00"
  utilizationPercent: number;     // 84
};

export type AlertSeverity = "WARNING" | "NEAR_LIMIT" | "CRITICAL";

export type BudgetAlert = {
  spendCategory: SpendCategory;

  severity: AlertSeverity;

  thresholdPercent: number;
  currentPercent: number;

  budgetLimit: MoneyString;
  currentSpend: MoneyString;

  remainingAmount: MoneyString; // "80.00" if under budget else "0.00"
  exceededAmount: MoneyString;  // "0.00" if under budget else "36.00"

  message: string;
};