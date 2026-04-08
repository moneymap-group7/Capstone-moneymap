import { Prisma, SpendCategory, TransactionSource } from "@prisma/client";
import { CanonicalTransaction } from "./canonical-transaction";

export function toPrismaCreateManyInput(
  items: CanonicalTransaction[]
): Prisma.TransactionCreateManyInput[] {
  return items.map((t) => ({
    userId: t.userId,
    transactionDate: t.transactionDate,
    postedDate: t.postedDate ?? null,
    description: t.description,
    amount: new Prisma.Decimal(t.amount),
    currency: t.currency ?? "CAD",
    transactionType: t.transactionType,
    source: t.source ?? TransactionSource.CSV,
    balanceAfter: t.balanceAfter != null ? new Prisma.Decimal(t.balanceAfter) : null,
    cardLast4: t.cardLast4 ?? null,
    spendCategory: t.spendCategory ?? SpendCategory.UNCATEGORIZED,
  }));
}