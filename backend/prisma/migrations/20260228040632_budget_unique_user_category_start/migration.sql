/*
  Warnings:

  - A unique constraint covering the columns `[userId,spendCategory,startDate]` on the table `budgets` will be added. If there are existing duplicate values, this will fail.
  - Made the column `spendCategory` on table `budgets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "spendCategory" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "budgets_userId_spendCategory_startDate_key" ON "budgets"("userId", "spendCategory", "startDate");
