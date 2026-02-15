import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
      description: (r.label ?? "CSV transaction").slice(0, 255),
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

async listForUser(userId: string, page = 1, limit = 10) {
  const uid = BigInt(userId);

  const skip = (page - 1) * limit;

  const [data, total] = await this.prisma.$transaction([
    this.prisma.transaction.findMany({
      where: { userId: uid },
      orderBy: { transactionDate: "desc" },
      skip,
      take: limit,
    }),
    this.prisma.transaction.count({
      where: { userId: uid },
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    spendCategory: string,
  ) {
    // Validate enum value → return 400 instead of Prisma 500
    const allowed = Object.values(SpendCategory);
    if (!allowed.includes(spendCategory as SpendCategory)) {
      throw new BadRequestException(
        `Invalid spendCategory: ${spendCategory}. Allowed: ${allowed.join(", ")}`
      );
    }

    const tid = BigInt(transactionId);
    const uid = BigInt(userId);

    const tx = await this.prisma.transaction.findUnique({
      where: { transactionId: tid },
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