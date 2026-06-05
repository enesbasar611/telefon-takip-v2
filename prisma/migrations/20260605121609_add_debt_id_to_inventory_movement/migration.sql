-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "debtId" TEXT,
ADD COLUMN     "returnTicketId" TEXT;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_returnTicketId_fkey" FOREIGN KEY ("returnTicketId") REFERENCES "ReturnTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
