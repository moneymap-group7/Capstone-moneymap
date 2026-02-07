export type ParsedTransactionForDb = {
  transactionDate: Date;
<<<<<<< HEAD
  postedDate: Date | null;
=======
>>>>>>> csv-parser-Saloni

  description: string;

  amount: string; 
  currency: "CAD";

  transactionType: "DEBIT" | "CREDIT";
  source: "CSV";

  spendCategory: "UNCATEGORIZED";
  cardLast4: string | null;

  balanceAfter: string | null;
};
