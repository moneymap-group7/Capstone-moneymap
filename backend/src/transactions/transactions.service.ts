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
import { CategoryResolverService } from "../common/categorization/category-resolver/category-resolver.service";
import type { ValidRow } from "./validation/transaction-csv.validator";

@Injectable()
export class TransactionsService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly categoryResolver: CategoryResolverService,
) {}

  async saveCsvRowsForUser(userId: string, rows: ValidRow[]) {
  const uid = BigInt(userId);

  const data = await Promise.all(
    rows.map(async (r) => {
      const description = (r.description ?? "CSV transaction").slice(0, 255);

      const spendCategory = await this.categoryResolver.resolve({
        userId: uid,
        description,
        amount: new Prisma.Decimal(r.amount),
        transactionType: r.transactionType,
      });

      return {
        userId: uid,
        transactionDate: r.transactionDate,
        postedDate: null,
        description,
        amount: r.amount,
        currency: r.currency,
        transactionType: r.transactionType,
        source: TransactionSource.CSV,
        spendCategory,
        cardLast4: r.cardLast4 ?? null,
        balanceAfter: null,
      };
    }),
  );

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
      cardLast4?: string;
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

    if (opts.cardLast4) {
      const v = String(opts.cardLast4).trim();
      if (!/^\d{4}$/.test(v)) {
        throw new BadRequestException("cardLast4 must be exactly 4 digits.");
      }
      where.cardLast4 = v;
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

    async exportTransactionsCsv(
    userId: string,
    filters: { month?: string; category?: string } = {},
  ): Promise<string> {
    const uid = BigInt(userId);

    const where: Prisma.TransactionWhereInput = {
      userId: uid,
    };

    if (filters.category) {
      const c = String(filters.category).toUpperCase();
      const allowed = Object.values(SpendCategory);

      if (!allowed.includes(c as SpendCategory)) {
        throw new BadRequestException("Invalid category.");
      }

      where.spendCategory = c as SpendCategory;
    }

    if (filters.month) {
      const month = String(filters.month).trim();

      if (!/^\d{4}-\d{2}$/.test(month)) {
        throw new BadRequestException("month must be in YYYY-MM format");
      }

      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);

      where.transactionDate = {
        gte: start,
        lt: end,
      };
    }

    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
    });

    const headers = [
      "transactionId",
      "transactionDate",
      "postedDate",
      "description",
      "amount",
      "currency",
      "transactionType",
      "spendCategory",
      "source",
      "balanceAfter",
      "cardLast4",
      "createdAt",
      "updatedAt",
    ];

    const csvRows = rows.map((t) => [
      this.escapeCsvValue(t.transactionId.toString()),
      this.escapeCsvValue(t.transactionDate ? t.transactionDate.toISOString() : ""),
      this.escapeCsvValue(t.postedDate ? t.postedDate.toISOString() : ""),
      this.escapeCsvValue(t.description ?? ""),
      this.escapeCsvValue(t.amount?.toString() ?? ""),
      this.escapeCsvValue(t.currency ?? ""),
      this.escapeCsvValue(t.transactionType ?? ""),
      this.escapeCsvValue(t.spendCategory ?? ""),
      this.escapeCsvValue(t.source ?? ""),
      this.escapeCsvValue(t.balanceAfter?.toString() ?? ""),
      this.escapeCsvValue(t.cardLast4 ?? ""),
      this.escapeCsvValue(t.createdAt ? t.createdAt.toISOString() : ""),
      this.escapeCsvValue(t.updatedAt ? t.updatedAt.toISOString() : ""),
    ]);

    return [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
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

    private escapeCsvValue(value: string): string {
    const safe = String(value).replace(/"/g, '""');
    return `"${safe}"`;
  }

}