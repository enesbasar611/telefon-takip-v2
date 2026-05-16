-- Product tablosu için indeksler
CREATE INDEX IF NOT EXISTS "Product_shopId_categoryId_idx" ON "public"."Product"("shopId", "categoryId");
CREATE INDEX IF NOT EXISTS "Product_shopId_createdAt_idx" ON "public"."Product"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_shopId_stock_idx" ON "public"."Product"("shopId", "stock");

-- ServiceTicket tablosu için indeksler
CREATE INDEX IF NOT EXISTS "ServiceTicket_shopId_createdAt_idx" ON "public"."ServiceTicket"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS "ServiceTicket_shopId_status_idx" ON "public"."ServiceTicket"("shopId", "status");
CREATE INDEX IF NOT EXISTS "ServiceTicket_shopId_warrantyExpiry_idx" ON "public"."ServiceTicket"("shopId", "warrantyExpiry");