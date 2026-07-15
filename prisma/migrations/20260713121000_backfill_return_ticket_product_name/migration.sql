UPDATE "ReturnTicket" rt
SET "productName" = p."name"
FROM "Product" p
WHERE rt."productName" IS NULL
  AND rt."productId" = p."id";

UPDATE "ReturnTicket" rt
SET "productName" = COALESCE(NULLIF(d."notes", ''), NULLIF(d."description", ''))
FROM "Debt" d
WHERE rt."productName" IS NULL
  AND rt."debtId" = d."id"
  AND COALESCE(NULLIF(d."notes", ''), NULLIF(d."description", '')) IS NOT NULL;

UPDATE "ReturnTicket" rt
SET "productName" = sale_names."names"
FROM (
  SELECT
    si."saleId",
    string_agg(DISTINCT p."name", ', ') AS "names"
  FROM "SaleItem" si
  JOIN "Product" p ON p."id" = si."productId"
  GROUP BY si."saleId"
) sale_names
WHERE rt."productName" IS NULL
  AND rt."saleId" = sale_names."saleId"
  AND sale_names."names" IS NOT NULL;
