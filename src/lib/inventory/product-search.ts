import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { normalizeSearchText } from "@/lib/utils";

function escapeSqlLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const COMBINED_PRODUCT_SEARCH_SQL = Prisma.raw(`
  REPLACE(
    LOWER(
      TRANSLATE(
        COALESCE(p."name", '') || ' ' ||
        COALESCE(p."sku", '') || ' ' ||
        COALESCE(p."barcode", '') || ' ' ||
        COALESCE(p."description", '') || ' ' ||
        COALESCE(c."name", '') || ' ' ||
        COALESCE(p."attributes"->>'compatibility', '') || ' ' ||
        COALESCE(p."attributes"->>'compatibleModels', '') || ' ' ||
        COALESCE(p."attributes"->>'uyumluModeller', '') || ' ' ||
        COALESCE(p."attributes"->>'uyumlu_modeller', '') || ' ' ||
        COALESCE(p."attributes"->>'uyumluluk', '') || ' ' ||
        COALESCE(p."attributes"->>'models', '') || ' ' ||
        COALESCE(p."attributes"->>'oemNo', '') || ' ' ||
        COALESCE(p."attributes"->>'brand', '') || ' ' ||
        COALESCE(p."attributes"->>'deviceBrand', '') || ' ' ||
        COALESCE(p."attributes"->>'deviceModel', '') || ' ' ||
        COALESCE(p."attributes"->>'model', '') || ' ' ||
        COALESCE(p."attributes"->>'color', '') || ' ' ||
        COALESCE(p."attributes"->>'capacity', '') || ' ' ||
        COALESCE(p."attributes"->>'quality', ''),
        'İIıĞÜŞÖÇğüşöç',
        'iiigusocgusoc'
      )
    ),
    chr(775),
    ''
  )
`);

export function buildTurkishProductQueryVariants(rawQuery: string, minLength = 1): string[] {
  const rawTrimmed = rawQuery.trim();
  if (!rawTrimmed) return [];

  return Array.from(
    new Set([
      rawTrimmed,
      rawTrimmed.toLowerCase(),
      rawTrimmed.toUpperCase(),
      rawTrimmed.toLocaleLowerCase("tr-TR"),
      rawTrimmed.toLocaleUpperCase("tr-TR"),
      rawTrimmed.replace(/i/g, "ı").replace(/İ/g, "I"),
      rawTrimmed.replace(/ı/g, "i").replace(/I/g, "İ"),
      rawTrimmed.replace(/i/g, "İ"),
      rawTrimmed.replace(/ı/g, "I"),
    ])
  ).filter((v) => v.length >= minLength);
}

/**
 * Finds product IDs whose core fields, category, or JSON attributes (including compatible models)
 * match the normalized search tokens in PostgreSQL.
 */
export async function findProductIdsMatchingQuery(
  shopId: string,
  rawQuery: string,
  includeDeleted = false
): Promise<string[]> {
  const normQuery = normalizeSearchText(rawQuery);
  if (!normQuery || !shopId) return [];

  const tokens = normQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const tokenClauses = tokens.map((token) => {
    const pattern = `%${escapeSqlLikePattern(token)}%`;
    return Prisma.sql`${COMBINED_PRODUCT_SEARCH_SQL} LIKE ${pattern} ESCAPE '\\'`;
  });

  const deletedClause = includeDeleted ? Prisma.empty : Prisma.sql`AND p."isDeleted" = false`;

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT p."id"
    FROM "Product" p
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    WHERE p."shopId" = ${shopId}
      ${deletedClause}
      AND ${Prisma.join(tokenClauses, " AND ")}
    ORDER BY p."createdAt" DESC
  `);

  return rows.map((row) => row.id);
}

/**
 * Builds shared Prisma `OR` conditions covering Turkish character variants,
 * core fields, device fields, category name, and JSON attributes (including compatible models).
 */
export async function buildProductSearchOrConditions(
  shopId: string,
  rawQuery: string,
  options?: { minLength?: number; includeDeleted?: boolean }
): Promise<Prisma.ProductWhereInput[]> {
  const minLength = options?.minLength ?? 1;
  const queryVariants = buildTurkishProductQueryVariants(rawQuery, minLength);
  if (queryVariants.length === 0) return [];

  const matchedIds = await findProductIdsMatchingQuery(
    shopId,
    rawQuery,
    options?.includeDeleted ?? false
  );

  const orConditions: Prisma.ProductWhereInput[] = [];
  for (const q of queryVariants) {
    orConditions.push(
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { deviceInfo: { color: { contains: q, mode: "insensitive" } } },
      { deviceInfo: { capacity: { contains: q, mode: "insensitive" } } },
      { deviceInfo: { serialNumber: { contains: q, mode: "insensitive" } } },
      { deviceInfo: { imei: { contains: q, mode: "insensitive" } } }
    );
  }

  if (matchedIds.length > 0) {
    orConditions.push({ id: { in: matchedIds } });
  }

  return orConditions;
}
