import { Injectable } from "@nestjs/common";
import { SpendCategory, TransactionType } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { AlertsService } from "../../common/alerts/alerts.service";
import type { BudgetAlert } from "../../common/alerts/alert.types";
import type { BudgetUtilizationRow, UtilizationInput } from "./utilization.types";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class UtilizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService
  ) {}

  calculateRow(input: UtilizationInput): BudgetUtilizationRow {
    const budgetLimit = Number(input.budgetLimit);
    const currentSpend = Number(input.currentSpend);

    const safeBudget = Number.isFinite(budgetLimit) ? budgetLimit : 0;
    const safeSpend = Number.isFinite(currentSpend) ? currentSpend : 0;

    const remainingAmount = round2(Math.max(safeBudget - safeSpend, 0));
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

  async getUtilizationWithAlertsForRange(
  userId: bigint,
  start: Date,
  end: Date
): Promise<{ rows: BudgetUtilizationRow[]; alerts: BudgetAlert[] }> {
  const rows = await this.getUtilizationForRange(userId, start, end);
  const alerts = this.alertsService.evaluateAlerts(rows);
  return { rows, alerts };
}
  /**
   * For UI mock/testing: returns both rows + evaluated alerts.
   */
  calculateRows(
    inputs: UtilizationInput[]
  ): { rows: BudgetUtilizationRow[]; alerts: BudgetAlert[] } {
    const rows = inputs.map((x) => this.calculateRow(x));
    const alerts = this.alertsService.evaluateAlerts(rows);
    return { rows, alerts };
  }

  private buildRow(
    spendCategory: BudgetUtilizationRow["spendCategory"],
    budgetLimit: number,
    currentSpend: number
  ): BudgetUtilizationRow {
    return this.calculateRow({ spendCategory, budgetLimit, currentSpend });
  }

  async getUtilizationForRange(
    userId: bigint,
    start: Date,
    end: Date
  ): Promise<BudgetUtilizationRow[]> {
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
        spendCategory: { not: null },
      },
      select: {
        spendCategory: true,
        amount: true,
      },
    });

    const spendAgg = await this.prisma.transaction.groupBy({
      by: ["spendCategory"],
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
        transactionType: TransactionType.DEBIT,
        NOT: [
          { spendCategory: SpendCategory.INCOME },
          { spendCategory: SpendCategory.TRANSFER },
        ],
      },
      _sum: { amount: true },
    });

    const spendMap = new Map<string, number>();
    for (const row of spendAgg) {
      const raw = row._sum.amount ? Number(row._sum.amount) : 0;
      // debit amounts might be negative depending on ingestion; keep spend positive
      spendMap.set(String(row.spendCategory), Math.abs(raw));
    }

    const out: BudgetUtilizationRow[] = [];
    for (const b of budgets) {
      const cat = b.spendCategory!;
      const limit = Number(b.amount);
      const spend = spendMap.get(String(cat)) ?? 0;
      out.push(this.buildRow(cat, limit, spend));
    }

    out.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    return out;
  }

  async compareRanges(userId: bigint, start: Date, end: Date) {
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(start);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    prevEnd.setUTCHours(23, 59, 59, 999);

    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1));
    prevStart.setUTCHours(0, 0, 0, 0);

    const current = await this.getUtilizationForRange(userId, start, end);
    const previous = await this.getUtilizationForRange(userId, prevStart, prevEnd);

    const prevSpendByCat = new Map<string, number>();
    for (const r of previous) {
      prevSpendByCat.set(String(r.spendCategory), r.currentSpend);
    }

    return current.map((cur) => {
      const prevSpend = prevSpendByCat.get(String(cur.spendCategory)) ?? 0;
      const difference = round2(cur.currentSpend - prevSpend);

      const percentChange =
        prevSpend > 0
          ? round2((difference / prevSpend) * 100)
          : cur.currentSpend > 0
          ? 100
          : 0;

      return {
        spendCategory: cur.spendCategory,
        currentSpend: cur.currentSpend,
        previousSpend: round2(prevSpend),
        difference,
        percentChange,
      };
    });
  }
}