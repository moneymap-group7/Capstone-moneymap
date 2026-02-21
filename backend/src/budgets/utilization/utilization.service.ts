  import type {
    BudgetUtilizationRow,
    UtilizationInput,
  } from "./utilization.types";
  import { AlertsService } from "../../common/alerts/alerts.service";
  import { Injectable } from "@nestjs/common";
  import type { BudgetAlert } from "../../common/alerts/alert.types";

  function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }



  @Injectable()
  export class UtilizationService {

    constructor(private readonly alertsService: AlertsService) {}

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
    
      calculateRows(inputs: UtilizationInput[]): { rows: BudgetUtilizationRow[]; alerts: BudgetAlert[] } {
        const rows = inputs.map((x) => this.calculateRow(x));
        const alerts = this.alertsService.evaluateAlerts(rows);
        return { rows, alerts };  
      }
  }