-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('CSV');

-- CreateEnum
CREATE TYPE "SpendCategory" AS ENUM ('FOOD_AND_DINING', 'GROCERIES', 'TRANSPORTATION', 'SHOPPING', 'UTILITIES', 'RENT', 'ENTERTAINMENT', 'HEALTH', 'EDUCATION', 'TRAVEL', 'FEES', 'INCOME', 'TRANSFER', 'OTHER', 'UNCATEGORIZED');

-- CreateTable
CREATE TABLE "transactions" (
    "transactionId" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "postedDate" TIMESTAMP(3),
    "description" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "transactionType" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL DEFAULT 'CSV',
    "balanceAfter" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardLast4" CHAR(4),
    "spendCategory" "SpendCategory" NOT NULL DEFAULT 'UNCATEGORIZED',

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transactionId")
);

-- CreateTable
CREATE TABLE "budgets" (
    "budgetId" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "spendCategory" "SpendCategory",
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("budgetId")
);

-- CreateTable
CREATE TABLE "bank_category_rules" (
    "id" SERIAL NOT NULL,
    "bank" TEXT NOT NULL,
    "matchText" TEXT NOT NULL,
    "spendCategory" "SpendCategory" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "transactions_spendCategory_idx" ON "transactions"("spendCategory");

-- CreateIndex
CREATE INDEX "transactions_cardLast4_idx" ON "transactions"("cardLast4");

-- CreateIndex
CREATE INDEX "budgets_userId_idx" ON "budgets"("userId");

-- CreateIndex
CREATE INDEX "budgets_spendCategory_idx" ON "budgets"("spendCategory");

-- CreateIndex
CREATE INDEX "budgets_startDate_idx" ON "budgets"("startDate");

-- CreateIndex
CREATE INDEX "bank_category_rules_bank_idx" ON "bank_category_rules"("bank");

-- CreateIndex
CREATE INDEX "bank_category_rules_matchText_idx" ON "bank_category_rules"("matchText");

-- CreateIndex
CREATE INDEX "bank_category_rules_spendCategory_idx" ON "bank_category_rules"("spendCategory");

-- CreateIndex
CREATE INDEX "bank_category_rules_priority_idx" ON "bank_category_rules"("priority");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
