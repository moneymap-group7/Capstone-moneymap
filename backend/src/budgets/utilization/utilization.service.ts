import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TransactionType } from "@prisma/client";
import type { BudgetUtilizationRow } from "./utilization.types";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class UtilizationService {
  constructor(private readonly prisma: PrismaService) {}

  private calcRow(
    spendCategory: BudgetUtilizationRow["spendCategory"],
    budgetLimit: number,
    currentSpend: number
  ): BudgetUtilizationRow {
    const safeBudget = Number.isFinite(budgetLimit) ? budgetLimit : 0;
    const safeSpend = Number.isFinite(currentSpend) ? currentSpend : 0;

    const utilizationPercent =
      safeBudget > 0 ? round2((safeSpend / safeBudget) * 100) : 0;

    const remainingAmount = round2(safeBudget - safeSpend);

    return {
      spendCategory,
      budgetLimit: round2(safeBudget),
      currentSpend: round2(safeSpend),
      utilizationPercent,
      remainingAmount,
    };
  }

  async getUtilizationForRange(
    userId: bigint,
    start: Date,
    end: Date
  ): Promise<BudgetUtilizationRow[]> {
    // 1) budgets in range (active only)
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
        // overlap with range: budget.startDate <= end AND (budget.endDate is null OR budget.endDate >= start)
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
        spendCategory: { not: null },
      },
      select: {
        spendCategory: true,
        amount: true,
      },
    });

    // 2) spending totals by category (DEBIT only)
    const spendAgg = await this.prisma.transaction.groupBy({
      by: ["spendCategory"],
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
        transactionType: TransactionType.DEBIT,
        NOT: [{ spendCategory: "INCOME" }, { spendCategory: "TRANSFER" }],
      },
      _sum: { amount: true },
    });

    // Normalize spend totals (expenses might be stored as negative)
    const spendMap = new Map<string, number>();
    for (const row of spendAgg) {
      const raw = row._sum.amount ? Number(row._sum.amount) : 0;
      spendMap.set(String(row.spendCategory), Math.abs(raw));
    }

    // 3) merge per budget category
    const out: BudgetUtilizationRow[] = [];
    for (const b of budgets) {
      const cat = b.spendCategory!;
      const limit = Number(b.amount);
      const spend = spendMap.get(String(cat)) ?? 0;
      out.push(this.calcRow(cat, limit, spend));
    }

    // sort by utilization desc
    out.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
    return out;
  }

  async compareRanges(userId: bigint, start: Date, end: Date) {
    // inclusive day count
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // previous period: immediately preceding the current start
    const prevEnd = new Date(start);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1));

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
