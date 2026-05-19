-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "ShortageItem" ADD COLUMN     "supplierId" TEXT;

-- AddForeignKey
ALTER TABLE "ShortageItem" ADD CONSTRAINT "ShortageItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
