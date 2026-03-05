<<<<<<< HEAD
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
=======
import type { SpendCategory } from "@prisma/client";

export type UtilizationInput = {
  spendCategory: SpendCategory;
  budgetLimit: number;
  currentSpend: number;
>>>>>>> f4f7c53be921385c9c832f42bd2eff0a702db8a0
};

export type BudgetUtilizationRow = {
  spendCategory: SpendCategory;
  budgetLimit: number;
  currentSpend: number;
<<<<<<< HEAD
  utilizationPercent: number; 
=======
  utilizationPercent: number;
>>>>>>> f4f7c53be921385c9c832f42bd2eff0a702db8a0
  remainingAmount: number;
};