// backend/src/transactions/transactions.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import {
  Prisma,
  SpendCategory,
  TransactionSource,
  TransactionType,
} from "@prisma/client";

import type { ValidRow } from "./validation/transaction-csv.validator";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveCsvRowsForUser(userId: string, rows: ValidRow[]) {
    const uid = BigInt(userId);

    const data = rows.map((r) => ({
      userId: uid,
      transactionDate: r.transactionDate,
      postedDate: null,
      description: (r.description ?? "CSV transaction").slice(0, 255),
      amount: r.amount,
      currency: r.currency,
      transactionType: r.transactionType,
      source: TransactionSource.CSV,
      spendCategory: SpendCategory.UNCATEGORIZED,
      cardLast4: r.cardLast4 ?? null,
      balanceAfter: null,
    }));

    const result = await this.prisma.transaction.createMany({
      data,
      skipDuplicates: false,
    });

    return { inserted: result.count };
  }

  async listForUser(
    userId: string,
    opts: {
      page?: number;
      pageSize?: number;
      q?: string;
      type?: string;
      fromDate?: string;
      toDate?: string;
      category?: string;
    } = {},
  ) {
    const uid = BigInt(userId);

    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

    const skip = (safePage - 1) * safePageSize;

    const where: Prisma.TransactionWhereInput = { userId: uid };

    const q = (opts.q || "").trim();
    if (q) where.description = { contains: q, mode: "insensitive" };

    if (opts.type) {
      const t = String(opts.type).toUpperCase();
      if (t !== "DEBIT" && t !== "CREDIT") {
        throw new BadRequestException("Invalid type. Use DEBIT or CREDIT.");
      }
      where.transactionType = t as TransactionType;
    }

    if (opts.category) {
      const c = String(opts.category).toUpperCase();
      const allowed = Object.values(SpendCategory);
      if (!allowed.includes(c as SpendCategory)) {
        throw new BadRequestException("Invalid category.");
      }
      where.spendCategory = c as SpendCategory;
    }

    const isYyyyMmDd = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

    if (opts.fromDate && !isYyyyMmDd(opts.fromDate)) {
      throw new BadRequestException("fromDate must be YYYY-MM-DD");
    }
    if (opts.toDate && !isYyyyMmDd(opts.toDate)) {
      throw new BadRequestException("toDate must be YYYY-MM-DD");
    }

    if (opts.fromDate || opts.toDate) {
      where.transactionDate = {};
      if (opts.fromDate)
        where.transactionDate.gte = new Date(`${opts.fromDate}T00:00:00.000Z`);
      if (opts.toDate)
        where.transactionDate.lte = new Date(`${opts.toDate}T23:59:59.999Z`);
    }

    const [total, rows] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip,
        take: safePageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safePageSize));

    return {
      data: rows,
      meta: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages,
      },
    };
  }

  async getByIdForUser(transactionId: string, userId: string) {
    const tid = BigInt(transactionId);
    const uid = BigInt(userId);

    const tx = await this.prisma.transaction.findUnique({
      where: { transactionId: tid },
    });

    if (!tx) throw new NotFoundException("Transaction not found");
    if (tx.userId !== uid) throw new ForbiddenException("Not allowed");

    return tx;
  }

  async updateCategoryForUser(
    transactionId: string,
    userId: string,
    spendCategory: SpendCategory,
  ) {
    return this.updateSpendCategoryForUser(transactionId, userId, spendCategory);
  }

  async updateSpendCategoryForUser(
    transactionId: string,
    userId: string,
    spendCategory: string,
  ) {
    const allowed = Object.values(SpendCategory);
    if (!allowed.includes(spendCategory as SpendCategory)) {
      throw new BadRequestException(
        `Invalid spendCategory: ${spendCategory}. Allowed: ${allowed.join(", ")}`,
      );
    }

    const tid = BigInt(transactionId);
    const uid = BigInt(userId);

    const tx = await this.prisma.transaction.findUnique({
      where: { transactionId: tid },
      select: { transactionId: true, userId: true },
    });

    if (!tx) throw new NotFoundException("Transaction not found");
    if (tx.userId !== uid) throw new ForbiddenException("Not allowed");

    const updated = await this.prisma.transaction.update({
      where: { transactionId: tid },
      data: { spendCategory: spendCategory as SpendCategory },
    });

    return {
      message: "Transaction updated successfully",
      data: updated,
    };
  }
}