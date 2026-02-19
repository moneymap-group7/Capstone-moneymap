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
}