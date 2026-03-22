import { z } from "zod";
import { SpendCategory, TransactionSource, TransactionType } from "@prisma/client";

export const CanonicalTransactionSchema = z.object({
  userId: z.union([z.bigint(), z.number().int().nonnegative().transform(BigInt)]),

  transactionDate: z.date(),
  postedDate: z.date().nullable().optional(),

  description: z.string().min(1).max(255),

  // Decimal-safe: accept number or string, store as string
  amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  currency: z.string().length(3).default("CAD"),

  transactionType: z.nativeEnum(TransactionType),

  balanceAfter: z.union([z.string(), z.number()]).nullable().optional().transform((v) => {
    if (v === null || v === undefined) return null;
    return String(v);
  }),

  cardLast4: z.string().length(4).nullable().optional(),

  spendCategory: z.nativeEnum(SpendCategory).optional().default(SpendCategory.UNCATEGORIZED),

  source: z.nativeEnum(TransactionSource).optional().default(TransactionSource.CSV),
});

export type CanonicalTransactionDTO = z.infer<typeof CanonicalTransactionSchema>;

export function validateCanonicalTransactions(input: unknown) {
  return z.array(CanonicalTransactionSchema).parse(input);
}