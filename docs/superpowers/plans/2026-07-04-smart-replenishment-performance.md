# Akıllı Stok Yenileme Performansı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Akıllı stok yenileme motorunu veritabanı aggregate sorguları ve mağaza bazlı iki dakikalık cache ile hızlandırmak.

**Architecture:** Saf dönüşüm yardımcıları mevcut replenishment modülünde kalır. Prisma aggregate sorguları cache’lenen bir sunucu veri yükleyicisinde çalışır; sayfalama cache dışında uygulanır. Mevcut mutasyon dosyaları ortak mağaza etiketi yardımcısını kullanarak sonucu geçersizleştirir.

**Tech Stack:** TypeScript, Next.js 14 `unstable_cache`/`revalidateTag`, Prisma 5 `groupBy`, React Query 5, `ts-node` assertion testleri.

---

### Task 1: Aggregate dönüşüm yardımcıları

**Files:**
- Modify: `src/lib/inventory/replenishment.ts`
- Modify: `tests/replenishment.test.ts`

- [ ] **Step 1: Başarısız aggregate testini yaz**

```ts
const sales = buildSalesWindowMap(
  [{ productId: "p1", _sum: { quantity: 4 } }],
  [{ productId: "p1", _sum: { quantity: 7 } }],
  [{ productId: "p1", _sum: { quantity: 10 } }, { productId: "p2", _sum: { quantity: null } }],
);
assert(sales.get("p1")?.d30 === 4, "30-day aggregate should be mapped.");
assert(sales.get("p1")?.d90 === 10, "90-day aggregate should be mapped.");
assert(sales.get("p2")?.d90 === 0, "Null sums should become zero.");
```

- [ ] **Step 2: RED testi çalıştır**

Run:

```powershell
$env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'
npx ts-node tests/replenishment.test.ts
```

Expected: FAIL because `buildSalesWindowMap` is not exported.

- [ ] **Step 3: Saf dönüşüm yardımcısını uygula**

```ts
export interface QuantityAggregateRow {
  productId: string | null;
  _sum: { quantity: number | null };
}

export function buildSalesWindowMap(
  rows30: QuantityAggregateRow[],
  rows60: QuantityAggregateRow[],
  rows90: QuantityAggregateRow[],
) {
  const result = new Map<string, { d30: number; d60: number; d90: number }>();
  const apply = (rows: QuantityAggregateRow[], key: "d30" | "d60" | "d90") => {
    for (const row of rows) {
      if (!row.productId) continue;
      const current = result.get(row.productId) ?? { d30: 0, d60: 0, d90: 0 };
      current[key] = Number(row._sum.quantity ?? 0);
      result.set(row.productId, current);
    }
  };
  apply(rows30, "d30");
  apply(rows60, "d60");
  apply(rows90, "d90");
  return result;
}
```

- [ ] **Step 4: GREEN testi çalıştır**

Expected: `replenishment tests passed`.

### Task 2: Mağaza cache etiketi

**Files:**
- Create: `src/lib/inventory/replenishment-cache.ts`
- Modify: `tests/replenishment.test.ts`

- [ ] **Step 1: Etiket sözleşmesi için başarısız test yaz**

```ts
assert(
  getSmartReplenishmentTag("shop-1") === "smart-replenishment-shop-1",
  "Cache tag should be shop-scoped.",
);
```

- [ ] **Step 2: RED testi çalıştır**

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Etiket ve invalidation yardımcısını yaz**

```ts
import { revalidateTag } from "next/cache";

export function getSmartReplenishmentTag(shopId: string) {
  return `smart-replenishment-${shopId}`;
}

export function revalidateSmartReplenishment(shopId: string) {
  revalidateTag(getSmartReplenishmentTag(shopId));
}
```

- [ ] **Step 4: GREEN testi ve TypeScript kontrolünü çalıştır**

Run: hedef test, ardından `npx tsc --noEmit`.

### Task 3: Prisma aggregate ve iki dakikalık cache

**Files:**
- Modify: `src/lib/actions/supplier-actions.ts:250-455`
- Modify: `tests/replenishment.test.ts`

- [ ] **Step 1: Mevcut öneri testlerini regresyon tabanı olarak çalıştır**

Expected: `replenishment tests passed`.

- [ ] **Step 2: Ham sorguları aggregate sorgularıyla değiştir**

```ts
const [sales30, sales60, sales90, serviceDemand, shortageDemand] = await Promise.all([
  prisma.saleItem.groupBy({
    by: ["productId"],
    where: { shopId, productId: { in: productIds }, sale: { createdAt: { gte: d30ago } } },
    _sum: { quantity: true },
  }),
  prisma.saleItem.groupBy({
    by: ["productId"],
    where: { shopId, productId: { in: productIds }, sale: { createdAt: { gte: d60ago } } },
    _sum: { quantity: true },
  }),
  prisma.saleItem.groupBy({
    by: ["productId"],
    where: { shopId, productId: { in: productIds }, sale: { createdAt: { gte: d90ago } } },
    _sum: { quantity: true },
  }),
  prisma.serviceUsedPart.groupBy({
    by: ["productId"],
    where: {
      shopId,
      productId: { in: productIds },
      ticket: { status: { notIn: [ServiceStatus.DELIVERED, ServiceStatus.CANCELLED] } },
    },
    _sum: { quantity: true },
  }),
  prisma.shortageItem.groupBy({
    by: ["productId"],
    where: { shopId, productId: { in: productIds }, isResolved: false, isTaken: false },
    _sum: { quantity: true },
  }),
]);
```

- [ ] **Step 3: Tam sonuç yükleyicisini cache içine al**

```ts
const getCachedRecommendations = (shopId: string) =>
  unstable_cache(
    () => calculateSmartReplenishment(shopId),
    ["smart-replenishment", shopId],
    { revalidate: 120, tags: [getSmartReplenishmentTag(shopId)] },
  )();
```

Sayfalama `getCachedRecommendations` sonucuna `slice(offset, offset + limit)` uygulandıktan sonra yapılır.

- [ ] **Step 4: Yavaş hesaplama ölçümünü ekle**

```ts
const startedAt = Date.now();
// calculation
const durationMs = Date.now() - startedAt;
if (process.env.NODE_ENV === "development" && durationMs > 750) {
  console.warn(`[smart-replenishment] slow calculation: ${durationMs}ms`);
}
```

- [ ] **Step 5: Test ve TypeScript kontrolünü çalıştır**

Expected: hedef test ve `npx tsc --noEmit` başarılı.

### Task 4: Cache invalidation noktaları

**Files:**
- Modify: `src/lib/actions/sale-actions.ts`
- Modify: `src/lib/actions/product-actions.ts`
- Modify: `src/lib/actions/service-actions.ts`
- Modify: `src/lib/actions/shortage-actions.ts`
- Modify: `src/lib/actions/purchase-actions.ts`
- Modify: `src/lib/actions/supplier-actions.ts`

- [ ] **Step 1: Ortak helper importlarını ekle**

```ts
import { revalidateSmartReplenishment } from "@/lib/inventory/replenishment-cache";
```

- [ ] **Step 2: Satış ve ürün mutasyonlarında geçersizleştir**

Başarılı mutasyonların mevcut `revalidateTag(\`dashboard-${shopId}\`)` veya `revalidateTag(\`products-${shopId}\`)` çağrılarının yanına:

```ts
revalidateSmartReplenishment(shopId);
```

- [ ] **Step 3: Servis ve eksik mutasyonlarında geçersizleştir**

Servis parçası/stok ve eksik talebi değiştiren başarılı akışlarda mevcut `tickets`/`shortage` tag çağrılarının yanına aynı helper eklenir.

- [ ] **Step 4: Satın alma ve mal kabul akışlarında geçersizleştir**

Sipariş oluşturma, iptal ve mal kabul tamamlandıktan sonra helper çağrılır.

- [ ] **Step 5: Statik kapsam testi ekle**

`tests/query-cache-coverage.test.ts` içinde altı action dosyasının `revalidateSmartReplenishment` içerdiği doğrulanır.

- [ ] **Step 6: Testleri çalıştır**

Expected: tüm `tests/*.test.ts` betikleri başarılı.

### Task 5: Tam doğrulama ve Chrome ölçümü

**Files:**
- Modify: `JOURNAL.md`

- [ ] **Step 1: Journal kaydı ekle**

```md
- [x] 2026-07-04: Akıllı stok yenileme performans optimizasyonu:
  - Satış, servis ve eksik miktarları Prisma aggregate sorgularına taşındı.
  - Mağaza bazlı iki dakikalık cache ve mutasyon invalidation akışı eklendi.
```

- [ ] **Step 2: Tüm testleri çalıştır**

Run: tüm `tests/*.test.ts`; expected: zero failures.

- [ ] **Step 3: TypeScript ve build çalıştır**

Run: `npx tsc --noEmit`, ardından `npm run build`; expected: exit code 0.

- [ ] **Step 4: Chrome’da üç sıcak yükleme ölç**

`/stok` panelinin görünür hale gelme süresi üç kez ölçülür; önceki ortalama yaklaşık 3005 ms ile karşılaştırılır.

- [ ] **Step 5: Repo hijyenini kontrol et**

Run: `git diff --check` ve `git status --short`. Kullanıcının Graphify değişiklikleri korunur.
