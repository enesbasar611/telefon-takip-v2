-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "criticalStock" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "ShortageItem" ADD COLUMN     "returnTicketId" TEXT;

-- AddForeignKey
ALTER TABLE "ShortageItem" ADD CONSTRAINT "ShortageItem_returnTicketId_fkey" FOREIGN KEY ("returnTicketId") REFERENCES "ReturnTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
