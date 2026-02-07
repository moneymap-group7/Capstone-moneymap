export type ParsedTransactionForDb = {
  transactionDate: Date;
<<<<<<< HEAD
=======
  postedDate: Date | null;
>>>>>>> 7900fa26a2b33d12a874bf67b68a2de777d22f15

  description: string;

  amount: string; 
  currency: "CAD";

  transactionType: "DEBIT" | "CREDIT";
  source: "CSV";

  spendCategory: "UNCATEGORIZED";
  cardLast4: string | null;

  balanceAfter: string | null;
};
