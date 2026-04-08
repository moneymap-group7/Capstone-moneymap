import { SpendCategory, TransactionSource, TransactionType } from "@prisma/client";

export interface CanonicalTransaction {
  // Required
  userId: bigint;                 // matches Prisma BigInt
  transactionDate: Date;          // required
  description: string;            // required
  amount: string;                 // Decimal in Prisma -> safest to keep as string in TS
  currency: string;               // "CAD"

  // Derived / optional but supported by Prisma
  postedDate?: Date | null;
  balanceAfter?: string | null;   // Decimal? -> string
  cardLast4?: string | null;      // Char(4)

  // Canonical categorization + type
  transactionType: TransactionType;     // DEBIT | CREDIT
  spendCategory?: SpendCategory;        // default UNCATEGORIZED in DB

  // Provenance
  source?: TransactionSource;           // default CSV in DB
}