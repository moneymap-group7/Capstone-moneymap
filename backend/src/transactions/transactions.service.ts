import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionSource, SpendCategory } from "@prisma/client";
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

    async listForUser(userId: string, page = 1, pageSize = 20) {
    const uid = BigInt(userId);

    // safety bounds (prevents huge queries)
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

    const skip = (safePage - 1) * safePageSize;

    const where = { userId: uid };

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
}
