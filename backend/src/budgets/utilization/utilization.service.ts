import type {
  BudgetUtilizationRow,
  UtilizationInput,
} from "./utilization.types";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export class UtilizationService {

  calculateRow(input: UtilizationInput): BudgetUtilizationRow {
    const budgetLimit = Number(input.budgetLimit);
    const currentSpend = Number(input.currentSpend);

    const safeBudget = Number.isFinite(budgetLimit) ? budgetLimit : 0;
    const safeSpend = Number.isFinite(currentSpend) ? currentSpend : 0;

    const remainingAmount = round2(safeBudget - safeSpend);

    const utilizationPercent =
      safeBudget > 0 ? round2((safeSpend / safeBudget) * 100) : 0;

    return {
      spendCategory: input.spendCategory,
      budgetLimit: round2(safeBudget),
      currentSpend: round2(safeSpend),
      utilizationPercent,
      remainingAmount,
    };
  }
  
  calculateRows(inputs: UtilizationInput[]): BudgetUtilizationRow[] {
    return inputs.map((x) => this.calculateRow(x));
  }
}