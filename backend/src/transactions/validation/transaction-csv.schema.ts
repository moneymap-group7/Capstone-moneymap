import { z } from 'zod';

export const TransactionCsvRowSchema = z.object({
  // Keep these as strings first; we parse them later.
  transactionDate: z.string().min(1, 'transactionDate is required'),
  postedDate: z.string().optional().nullable(),

  description: z.string().min(1).max(255),

  // CSV can contain: "123.45", "-123.45", "$123.45", "(123.45)"
  amount: z.string().min(1, 'amount is required'),

  currency: z.string().optional().default('CAD'), // allow blank -> CAD

  // Optional from CSV
  cardLast4: z.string().optional().nullable(),
  balanceAfter: z.string().optional().nullable(),
});

export type TransactionCsvRow = z.infer<typeof TransactionCsvRowSchema>;
