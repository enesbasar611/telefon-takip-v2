-- CreateIndex
CREATE INDEX "Category_shopId_parentId_idx" ON "Category"("shopId", "parentId");

-- CreateIndex
CREATE INDEX "Category_shopId_order_idx" ON "Category"("shopId", "order");
