const MOCK = [
  {
    transactionId: 1,
    transactionDate: "2026-02-01",
    description: "UBER TRIP",
    amount: 25.5,
    transactionType: "DEBIT",
    spendCategory: "Transport",
  },
  {
    transactionId: 2,
    transactionDate: "2026-02-02",
    description: "MOHAWK COLLEGE",
    amount: 1200,
    transactionType: "DEBIT",
    spendCategory: "Education",
  },
  {
    transactionId: 3,
    transactionDate: "2026-02-03",
    description: "PAYROLL",
    amount: 2100,
    transactionType: "CREDIT",
    spendCategory: "Income",
  },
];

export async function getTransactionsMock({ delayMs = 400 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK), delayMs);
  });
}