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