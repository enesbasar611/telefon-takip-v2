-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hideFromShortage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReceiptSettings" ADD COLUMN     "paperSize" TEXT NOT NULL DEFAULT '72mm';

-- CreateIndex
CREATE INDEX "Transaction_shopId_idx" ON "Transaction"("shopId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_category_idx" ON "Transaction"("category");

-- CreateIndex
CREATE INDEX "Transaction_customerId_idx" ON "Transaction"("customerId");

-- CreateIndex
CREATE INDEX "Transaction_debtId_idx" ON "Transaction"("debtId");

-- CreateIndex
CREATE INDEX "Transaction_financeAccountId_idx" ON "Transaction"("financeAccountId");
