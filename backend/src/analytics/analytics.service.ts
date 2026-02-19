import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { SpendCategory } from "@prisma/client";

export type AggregationSummary = {
  startDate: string;
  endDate: string;
  totalIncome: string;
  totalExpense: string;
  net: string;
  byCategory: Array<{ spendCategory: SpendCategory; total: string }>;
};

export type MonthlyPoint = {
  month: string;
  income: string;
  expense: string;
  net: string;
};

export type MonthlyCategoryPoint = {
  month: string;
  spendCategory: SpendCategory;
  total: string;
};

export type AggregationMonthly = {
  startDate: string;
  endDate: string;
  monthly: MonthlyPoint[];
  byCategoryMonthly?: MonthlyCategoryPoint[];
};

export type CategoryAggItem = {
  spendCategory: SpendCategory;
  total: string; // "123.45"
  count: number;
};

export type AggregationByCategory = {
  startDate: string;
  endDate: string;
  items: CategoryAggItem[];
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private toBigInt(userId: string | number | bigint): bigint {
    return typeof userId === "bigint" ? userId : BigInt(userId);
  }

  private decToString(v: any): string {
    if (!v) return "0";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "bigint") return v.toString();
    if (typeof v?.toString === "function") return v.toString();
    return "0";
  }

  private centsMath(a: string, b: string, op: "add" | "sub"): string {
    const toCents = (s: string) => Math.round(Number(s) * 100);
    const fromCents = (c: number) => (c / 100).toFixed(2);

    const av = toCents(a);
    const bv = toCents(b);
    const result = op === "add" ? av + bv : av - bv;

    return fromCents(result);
  }

  private monthKey(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  private monthStartUTC(year: number, month1to12: number): Date {
    return new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0));
  }

  private nextMonthStartUTC(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0));
  }

  private listMonths(start: Date, end: Date): string[] {
    const months: string[] = [];
    let cursor = this.monthStartUTC(start.getUTCFullYear(), start.getUTCMonth() + 1);
    const endMonthStart = this.monthStartUTC(end.getUTCFullYear(), end.getUTCMonth() + 1);

    while (cursor <= endMonthStart) {
      months.push(this.monthKey(cursor));
      cursor = this.nextMonthStartUTC(cursor);
    }
    return months;
  }


  async getSummary(
    userId: string | number | bigint,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregationSummary> {
    const uid = this.toBigInt(userId);

    // CREDIT = income
    const incomeAgg = await this.prisma.transaction.aggregate({
      where: {
        userId: uid,
        transactionDate: { gte: startDate, lte: endDate },
        transactionType: "CREDIT",
      },
      _sum: { amount: true },
    });

    // DEBIT = expense (stored negative in your DB)
    const expenseAgg = await this.prisma.transaction.aggregate({
      where: {
        userId: uid,
        transactionDate: { gte: startDate, lte: endDate },
        transactionType: "DEBIT",
      },
      _sum: { amount: true },
    });

    const income = this.decToString(incomeAgg._sum.amount);
    const rawExpense = this.decToString(expenseAgg._sum.amount);

    const expense = Math.abs(Number(rawExpense)).toFixed(2);

    const net = this.centsMath(income, expense, "sub");

    const grouped = await this.prisma.transaction.groupBy({
      by: ["spendCategory"],
      where: {
        userId: uid,
        transactionDate: { gte: startDate, lte: endDate },
        transactionType: "DEBIT",
      },
      _sum: { amount: true },
      orderBy: { spendCategory: "asc" },
    });

    const byCategory = grouped.map((g) => ({
      spendCategory: g.spendCategory,
      total: Math.abs(Number(this.decToString(g._sum.amount))).toFixed(2),
    }));

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalIncome: Number(income).toFixed(2),
      totalExpense: expense,
      net,
      byCategory,
    };
  }


   async getByCategory(
    userId: string | number | bigint,
    startDate: Date,
    endDate: Date,
  ): Promise<AggregationByCategory> {
    const uid = this.toBigInt(userId);

    const grouped = await this.prisma.transaction.groupBy({
      by: ["spendCategory"],
      where: {
        userId: uid,
        transactionDate: { gte: startDate, lte: endDate },
        transactionType: "DEBIT",
      },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { spendCategory: "asc" },
    });

    const items = grouped.map((g) => ({
      spendCategory: g.spendCategory,
      total: Math.abs(Number(this.decToString(g._sum.amount))).toFixed(2),
      count: g._count._all,
    }));

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      items,
    };
  }

  
   async getMonthlySummary(
    userId: string | number | bigint,
    startDate: Date,
    endDate: Date,
    opts?: { includeCategoryMonthly?: boolean },
  ): Promise<AggregationMonthly> {
    const uid = this.toBigInt(userId);

    const months = this.listMonths(startDate, endDate);

    const tx = await this.prisma.transaction.findMany({
      where: {
        userId: uid,
        transactionDate: { gte: startDate, lte: endDate },
      },
      select: {
        transactionDate: true,
        amount: true,
        transactionType: true,
        spendCategory: true,
      },
    });

    const incomeCents: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
    const expenseCents: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
    const catMonthlyCents: Record<string, number> = {};

    const toCents = (s: string) => Math.round(Number(s) * 100);
    const fromCents = (c: number) => (c / 100).toFixed(2);

    for (const row of tx) {
      const m = this.monthKey(row.transactionDate);
      const amtStr = this.decToString(row.amount);
      const centsAbs = Math.abs(toCents(amtStr));

      if (row.transactionType === "CREDIT") {
        if (incomeCents[m] !== undefined) incomeCents[m] += centsAbs;
      } else {
        if (expenseCents[m] !== undefined) expenseCents[m] += centsAbs;

        if (opts?.includeCategoryMonthly) {
          const key = `${m}::${row.spendCategory}`;
          catMonthlyCents[key] = (catMonthlyCents[key] ?? 0) + centsAbs;
        }
      }
    }

    const monthly: MonthlyPoint[] = months.map((m) => {
      const income = fromCents(incomeCents[m] ?? 0);
      const expense = fromCents(expenseCents[m] ?? 0);
      const net = fromCents((incomeCents[m] ?? 0) - (expenseCents[m] ?? 0));
      return { month: m, income, expense, net };
    });

    const byCategoryMonthly = opts?.includeCategoryMonthly
      ? Object.entries(catMonthlyCents).map(([k, cents]) => {
          const [month, spendCategory] = k.split("::");
          return {
            month,
            spendCategory: spendCategory as SpendCategory,
            total: fromCents(cents),
          };
        })
      : undefined;

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthly,
      byCategoryMonthly,
    };
  }

}