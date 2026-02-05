export type ParsedTransactionForDb = {
  transactionDate: Date;
  postedDate: Date | null;

  description: string;

  amount: string; 
  currency: "CAD";

  transactionType: "DEBIT" | "CREDIT";
  source: "CSV";

  spendCategory: "UNCATEGORIZED";
  cardLast4: string | null;

  balanceAfter: string | null;
};
