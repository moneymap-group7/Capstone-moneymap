import { Controller, Get } from "@nestjs/common";
import { UtilizationService } from "./utilization.service";
import type { UtilizationInput } from "./utilization.types";

@Controller("budgets/utilization")
export class UtilizationController {
  constructor(private readonly utilization: UtilizationService) {}

  @Get("mock")
  mock() {
    const mockInputs: UtilizationInput[] = [
      { spendCategory: "GROCERIES", budgetLimit: 400, currentSpend: 120 },
      { spendCategory: "RENT", budgetLimit: 1200, currentSpend: 1200 },
      { spendCategory: "ENTERTAINMENT", budgetLimit: 150, currentSpend: 190 },
      { spendCategory: "TRANSPORTATION", budgetLimit: 0, currentSpend: 50 },
    ];

    const { rows, alerts } = this.utilization.calculateRows(mockInputs);
    return { data: rows, alerts };
  }
}