-- CreateTable
CREATE TABLE "user_category_rules" (
    "ruleId" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "merchantContains" TEXT,
    "merchantEquals" TEXT,
    "minAmount" DECIMAL(12,2),
    "maxAmount" DECIMAL(12,2),
    "transactionType" "TransactionType",
    "spendCategory" "SpendCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_category_rules_pkey" PRIMARY KEY ("ruleId")
);

-- CreateIndex
CREATE INDEX "user_category_rules_userId_idx" ON "user_category_rules"("userId");

-- CreateIndex
CREATE INDEX "user_category_rules_priority_idx" ON "user_category_rules"("priority");

-- CreateIndex
CREATE INDEX "user_category_rules_spendCategory_idx" ON "user_category_rules"("spendCategory");

-- AddForeignKey
ALTER TABLE "user_category_rules" ADD CONSTRAINT "user_category_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
