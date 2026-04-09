-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_statementId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerificationCode" VARCHAR(10),
ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetCode" VARCHAR(10),
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetUsedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement"("statementId") ON DELETE CASCADE ON UPDATE CASCADE;
