# Akıllı Stok Yenileme İyileştirmeleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Akıllı stok yenileme önerilerini 30 günlük talep hedefine göre öngörülü, kategori ve para birimi farkındalığı olan, sayfalamadan bağımsız özetler üreten hale getirmek.

**Architecture:** Saf hesaplama ve tedarikçi seçimi `src/lib/inventory/replenishment.ts` içinde tutulacak; Prisma sorguları ve sonuç birleştirme `supplier-actions.ts` içinde kalacak. Arayüz sunucunun hesapladığı tam-küme özetini kullanacak, böylece testler veritabanı veya React olmadan temel iş kurallarını doğrulayabilecek.

**Tech Stack:** TypeScript, Next.js 14 server actions, Prisma 5, TanStack Query 5, React 18, `ts-node` tabanlı assertion testleri.

---

## Dosya Haritası

- Create: `src/lib/inventory/replenishment.ts` — talep, hedef stok, maliyet, öncelik, tedarikçi ve özet hesaplarının saf fonksiyonları.
- Create: `tests/replenishment.test.ts` — hesaplama, tedarikçi, döviz ve özet regresyon testleri.
- Modify: `src/lib/actions/supplier-actions.ts` — tüm uygun ürünleri toplar, satış/talep verisini saf motora aktarır ve sayfalı sonuçla tam özeti döndürür.
- Modify: `src/components/supplier/smart-replenishment-panel.tsx` — sunucu özetini ve ayrı servis/eksik alanlarını gösterir.
- Modify: `JOURNAL.md` — Özellik 1’i tamamlandı işaretler ve iyileştirmeyi değişiklik günlüğüne ekler.

### Task 1: Saf stok hedefi ve öncelik hesabı

**Files:**
- Create: `src/lib/inventory/replenishment.ts`
- Create: `tests/replenishment.test.ts`

- [ ] **Step 1: Hızlı satış ve ayrı talep alanları için başarısız testi yaz**

```ts
import {
  buildReplenishmentRecommendation,
  type ReplenishmentProductInput,
} from "../src/lib/inventory/replenishment";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const fastSeller: ReplenishmentProductInput = {
  productId: "p1",
  productName: "Hızlı Ürün",
  currentStock: 20,
  criticalStock: 5,
  salesLast30: 30,
  salesLast60: 40,
  salesLast90: 50,
  pendingServiceQty: 2,
  pendingShortageQty: 3,
  categoryName: "Ekran",
  categoryId: "cat-screen",
  buyPrice: 100,
  buyPriceUsd: null,
  priceCurrency: "TRY",
};

const result = buildReplenishmentRecommendation(fastSeller, 40);
assert(result !== null, "Fast seller above critical stock should be recommended.");
assert(result?.targetStock === 40, "Target should include 30-day demand, open demand and critical buffer.");
assert(result?.suggestedOrderQty === 20, "Order quantity should close the target-stock gap.");
assert(result?.pendingServiceQty === 2, "Service demand should remain separate.");
assert(result?.pendingShortageQty === 3, "Shortage demand should remain separate.");
```

- [ ] **Step 2: Testin doğru nedenle başarısız olduğunu doğrula**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: FAIL with `Cannot find module '../src/lib/inventory/replenishment'`.

- [ ] **Step 3: Asgari saf hesaplama modülünü yaz**

```ts
export type ReplenishmentCurrency = "TRY" | "USD";

export interface ReplenishmentProductInput {
  productId: string;
  productName: string;
  currentStock: number;
  criticalStock: number;
  salesLast30: number;
  salesLast60: number;
  salesLast90: number;
  pendingServiceQty: number;
  pendingShortageQty: number;
  categoryName: string;
  categoryId: string | null;
  buyPrice: number;
  buyPriceUsd: number | null;
  priceCurrency: string | null;
}

export function buildReplenishmentRecommendation(
  input: ReplenishmentProductInput,
  usdRate: number | null,
) {
  const dailyVelocity =
    input.salesLast30 > 0 ? input.salesLast30 / 30 :
    input.salesLast60 > 0 ? input.salesLast60 / 60 :
    input.salesLast90 / 90;
  const targetStock =
    Math.ceil(dailyVelocity * 30) +
    Math.max(0, input.pendingServiceQty) +
    Math.max(0, input.pendingShortageQty) +
    Math.max(0, input.criticalStock);
  const suggestedOrderQty = Math.max(0, targetStock - Math.max(0, input.currentStock));
  if (suggestedOrderQty === 0) return null;
  // Task 2 extends cost and priority fields.
  return { ...input, dailyVelocity, targetStock, suggestedOrderQty };
}
```

- [ ] **Step 4: Testi çalıştır ve geçtiğini doğrula**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: `replenishment tests passed` after adding that final console line to the test.

- [ ] **Step 5: Değişiklikleri commit et**

```powershell
git add src/lib/inventory/replenishment.ts tests/replenishment.test.ts
git commit -m "feat: add predictive replenishment calculation"
```

### Task 2: Tedarikçi, döviz, öncelik ve özet kuralları

**Files:**
- Modify: `src/lib/inventory/replenishment.ts`
- Modify: `tests/replenishment.test.ts`

- [ ] **Step 1: Tedarikçi seçim sırası için başarısız testleri ekle**

```ts
const suppliers = [
  { id: "general", name: "Genel", trustScore: 100, category: "Batarya" },
  { id: "screen", name: "Ekran A", trustScore: 80, category: "Ekran" },
];
assert(selectSupplier("direct", "Ekran", suppliers)?.id === "direct", "Direct supplier should win.");
assert(selectSupplier(null, "Ekran", suppliers)?.id === "screen", "Category match should win over global trust.");
assert(selectSupplier(null, "Kılıf", suppliers)?.id === "general", "Global trust should be fallback.");
```

- [ ] **Step 2: Testin `selectSupplier is not defined` nedeniyle başarısız olduğunu doğrula**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: FAIL because `selectSupplier` is not exported.

- [ ] **Step 3: Deterministik tedarikçi seçimini uygula**

```ts
export function selectSupplier(
  directSupplierId: string | null,
  categoryName: string,
  suppliers: SupplierCandidate[],
) {
  if (directSupplierId) return suppliers.find((s) => s.id === directSupplierId) ?? null;
  const ordered = [...suppliers].sort(
    (a, b) =>
      (b.trustScore ?? 0) - (a.trustScore ?? 0) ||
      a.name.localeCompare(b.name, "tr") ||
      a.id.localeCompare(b.id),
  );
  return ordered.find((s) => normalize(s.category) === normalize(categoryName)) ?? ordered[0] ?? null;
}
```

- [ ] **Step 4: TRY/USD maliyet ve kur-yok senaryoları için başarısız testleri ekle**

```ts
const usd = calculateReplenishmentCost("USD", 10, 3, 40);
assert(usd.sourceTotal === 30 && usd.tryTotal === 1200, "USD should retain source total and convert to TRY.");
const missingRate = calculateReplenishmentCost("USD", 10, 3, null);
assert(missingRate.tryTotal === null, "Missing USD rate must not create a false TRY total.");
const tr = calculateReplenishmentCost("TRY", 100, 3, 40);
assert(tr.sourceTotal === 300 && tr.tryTotal === 300, "TRY cost should remain TRY.");
```

- [ ] **Step 5: Maliyet, öncelik ve tam-küme özet fonksiyonlarını uygula**

```ts
export interface ReplenishmentSummary {
  totalCount: number;
  counts: Record<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW", number>;
  totalTryCost: number;
  totalUsdSourceCost: number;
  hasUnconvertedCost: boolean;
}

export function summarizeRecommendations(items: ReplenishmentRecommendation[]): ReplenishmentSummary {
  return items.reduce(
    (summary, item) => {
      summary.totalCount++;
      summary.counts[item.priorityLevel]++;
      if (item.estimatedCostTry !== null) summary.totalTryCost += item.estimatedCostTry;
      if (item.costCurrency === "USD") summary.totalUsdSourceCost += item.estimatedCostSource;
      if (item.estimatedCostTry === null) summary.hasUnconvertedCost = true;
      return summary;
    },
    {
      totalCount: 0,
      counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      totalTryCost: 0,
      totalUsdSourceCost: 0,
      hasUnconvertedCost: false,
    },
  );
}
```

- [ ] **Step 6: Tüm saf fonksiyon testlerini çalıştır**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: `replenishment tests passed`.

- [ ] **Step 7: Değişiklikleri commit et**

```powershell
git add src/lib/inventory/replenishment.ts tests/replenishment.test.ts
git commit -m "feat: add supplier and currency aware replenishment"
```

### Task 3: Server action entegrasyonu

**Files:**
- Modify: `src/lib/actions/supplier-actions.ts:237-512`
- Modify: `tests/replenishment.test.ts`

- [ ] **Step 1: Sayfalamadan bağımsız özet için başarısız saf test ekle**

```ts
const summary = summarizeRecommendations([criticalItem, lowItem]);
const firstPage = [criticalItem];
assert(summary.totalCount === 2, "Summary must include the complete recommendation set.");
assert(firstPage.length === 1, "Page size must not alter summary totals.");
```

- [ ] **Step 2: Testi çalıştır ve eksik fixture/type alanları nedeniyle başarısız olduğunu doğrula**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: FAIL until complete recommendation fixtures are supplied.

- [ ] **Step 3: Server action’ı saf motoru kullanacak şekilde değiştir**

```ts
export interface SmartReplenishmentResult {
  recommendations: ReplenishmentRecommendation[];
  totalCount: number;
  summary: ReplenishmentSummary;
}

export async function getSmartReplenishmentData(
  offset = 0,
  limit = 6,
): Promise<SmartReplenishmentResult> {
  const shopId = await getShopId(false);
  if (!shopId) return emptyReplenishmentResult();
  const rates = await getExchangeRates(shopId);
  const usdRate = Number(rates.usd) > 0 ? Number(rates.usd) : null;

  // Query all visible products, aggregate sales/service/shortage data,
  // exclude active courier/order items, and map through
  // buildReplenishmentRecommendation().
  const recommendations = productInputs
    .map((input) => buildReplenishmentRecommendation(input, usdRate))
    .filter((item): item is ReplenishmentRecommendation => item !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return serializePrisma({
    recommendations: recommendations.slice(offset, offset + limit),
    totalCount: recommendations.length,
    summary: summarizeRecommendations(recommendations),
  }) as SmartReplenishmentResult;
}
```

Implementation details:

- Ürün metadata sorgusundaki `stock <= criticalStock` ön filtresi kaldırılacak.
- `hideFromShortage: false` filtresi korunacak.
- `category` için hem `id` hem `name`, ürün için `priceCurrency`, bağlı tedarikçi için `id` taşınacak.
- `pendingServiceQty` ve `pendingShortageQty` ayrı map’lerden aktarılacak.
- Tedarikçi listesi mutasyona uğratılmadan `selectSupplier` üzerinden seçilecek.
- Hata ve shop-yok sonuçları aynı boş özet yapısını kullanacak.

- [ ] **Step 4: Saf test ve TypeScript kontrolünü çalıştır**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: `replenishment tests passed`.

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 5: Değişiklikleri commit et**

```powershell
git add src/lib/actions/supplier-actions.ts src/lib/inventory/replenishment.ts tests/replenishment.test.ts
git commit -m "feat: integrate predictive replenishment data"
```

### Task 4: Panel toplamları ve talep ayrımı

**Files:**
- Modify: `src/components/supplier/smart-replenishment-panel.tsx:101-357`
- Modify: `src/components/supplier/smart-replenishment-panel.tsx:360-590`

- [ ] **Step 1: Panelin server özetini kullanmasını sağla**

```ts
const summary = data?.pages[0]?.summary ?? EMPTY_REPLENISHMENT_SUMMARY;
const counts = summary.counts;
const totalEstimatedCost = summary.totalTryCost;
```

Yerel `recommendations` listesinden hesaplanan `counts` ve `reduce` tabanlı maliyet toplamı kaldırılacak.

- [ ] **Step 2: Kaynak para birimini ve ayrı talepleri göster**

```tsx
<span>Servis: {item.pendingServiceQty}</span>
<span>Eksik: {item.pendingShortageQty}</span>
<span>
  {item.costCurrency === "USD" ? "$" : "₺"}
  {item.estimatedCostSource.toLocaleString("tr-TR")}
</span>
```

USD kuru mevcutsa TL karşılığı ikincil metin olarak; yoksa “TL karşılığı için kur gerekli” gösterilecek.

- [ ] **Step 3: Toplamın kapsamını kullanıcıya açıkla**

```tsx
<span className="text-[9px] uppercase tracking-widest text-muted-foreground">
  Tüm önerilerin tahmini toplamı
</span>
```

`hasUnconvertedCost` true ise USD kaynak toplamı ayrıca gösterilecek.

- [ ] **Step 4: TypeScript kontrolünü çalıştır**

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 5: Değişiklikleri commit et**

```powershell
git add src/components/supplier/smart-replenishment-panel.tsx
git commit -m "feat: show complete replenishment summary"
```

### Task 5: Journal ve tam doğrulama

**Files:**
- Modify: `JOURNAL.md:31-33`
- Modify: `JOURNAL.md` (değişiklik günlüğünün sonu)

- [ ] **Step 1: Backlog durumunu tamamlandı yap**

```md
- [x] Ozellik 1: Akilli Stok Yenileme ve Tedarik Planlama
```

- [ ] **Step 2: 2026-07-04 değişiklik kaydını ekle**

```md
- [x] 2026-07-04: Akıllı stok yenileme doğruluk iyileştirmeleri:
  - Hızlı satan ürünler kritik seviyeye düşmeden 30 günlük hedef stok hesabına alındı.
  - Servis ve eksik talepleri ayrıştırıldı; kategori uyumlu tedarikçi seçimi eklendi.
  - TRY/USD maliyetleri kaynak para birimiyle korundu ve tam sonuç kümesi özetleri sayfalamadan ayrıldı.
  - Doğrulama: replenishment testleri, `npx tsc --noEmit`, `npm run build`.
```

- [ ] **Step 3: Hedef testi çalıştır**

Run: `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" tests/replenishment.test.ts`

Expected: `replenishment tests passed`.

- [ ] **Step 4: Mevcut TypeScript tabanlı regresyon testlerini çalıştır**

Run:

```powershell
Get-ChildItem tests -Filter '*.test.ts' | ForEach-Object {
  npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: all scripts exit code 0.

- [ ] **Step 5: TypeScript ve üretim build doğrulamasını çalıştır**

Run: `npx tsc --noEmit`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 6: Diff ve çalışma ağacı hijyenini kontrol et**

Run: `git diff --check`

Expected: no output.

Run: `git status --short`

Expected: yalnızca bu uygulamanın değişiklikleri ile kullanıcının önceden var olan `graphify-out` değişiklikleri görünür.

- [ ] **Step 7: Uygulama değişikliklerini commit et**

```powershell
git add JOURNAL.md src/lib/inventory/replenishment.ts src/lib/actions/supplier-actions.ts src/components/supplier/smart-replenishment-panel.tsx tests/replenishment.test.ts
git commit -m "feat: improve smart replenishment planning"
```
