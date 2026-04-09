-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "statementId" BIGINT;

-- CreateTable
CREATE TABLE "Statement" (
    "statementId" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bank" TEXT,
    "fileHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("statementId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Statement_userId_fileHash_key" ON "Statement"("userId", "fileHash");

-- CreateIndex
CREATE INDEX "transactions_statementId_idx" ON "transactions"("statementId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement"("statementId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
