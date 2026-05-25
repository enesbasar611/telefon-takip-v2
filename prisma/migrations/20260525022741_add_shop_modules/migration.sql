-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "isCourierEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isEInvoiceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFinanceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isServiceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isStockEnabled" BOOLEAN NOT NULL DEFAULT true;
