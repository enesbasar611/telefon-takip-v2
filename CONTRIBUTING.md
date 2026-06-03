# Contributing Guide — Telefon Takip v2

> **Son güncelleme:** 2026-05-27
> **Graph bağlantı sayısı:** 7.800 edge, 2.258 node, 161 community
>
> Bu dosya Proje Graph Raporu (`graphify-out/GRAPH_REPORT.md`) ile eş zamanlı güncellenir.
> Her büyük feature eklenişinde veya mimari değişiklikte okunmalıdır.

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Veritabanı sync (İLK KURULUM için)
npx prisma db pull   # Mevcut DB'yi schema'ya yansıt
npx prisma generate  # TypeScript tiplerini oluştur

# 3. Dev server başlat
npm run dev
```

---

## 🗄️ Veritabanı Migration Kuralları (KESİN — P0)

### Yasaklar

| Komut | Durum | Neden |
|-------|-------|-------|
| `npx prisma db push` | 🚫 **YASAK** — Geliştirme ve production'da yok | Schema drift yaratır, migration geçmişi bozulur, takım çalışmasını engeller |
| `npx prisma migrate reset` | 🚫 **YASAK** — Production'da yok | Veri kaybına yol açar |
| `--force` ile migration | 🚫 **YASAK** | Zorla uygulama veri tutarsızlığı yaratır |

### Kurallar

**1. Tek Geçerli Yöntem**
```bash
# Geliştirme ortamında:
npx prisma migrate dev --name <anlamli_isim>

# Example:
npx prisma migrate dev --name add_customer_tax_index
```

**2. Migration İsmi Konvansiyonu**
```
add_<tablo>_<kolon>_<type>      — Yeni kolon
remove_<tablo>_<kolon>          — Kolon silme
create_<tablo>                  — Yeni tablo
alter_<tablo>_<kolon>_<neden>  — Var olan kolon değişikliği
fix_<neden>                     — Veri düzeltme/seed
```

**3. Review Gereksinimi**
- Her migration en az 1 review gerektirir
- Production migrationları rollback planı ile birlikte sunulmalı
- Neon DB'de migration geçmişi `_prisma_migrations` tablosunda takip edilir

**4. Production SQL Dosyası**
```bash
# Production'da SQL bazlı migration tercih edilir
# prisma/migrations/YYYYMMDDxxxxxx_<isim>/migration.sql
-- Kendi elle yazılan SQL migration'lar bu formattadır
```

### Referans Dosyalar
- Migration kuralları dokümanı: `docs/migration-rules.md`
- `JOURNAL.md` → `DB DDL Değişiklikleri` bölümü

---

## 🏗️ Mimari Prensipler

### Multi-Tenant (Çoklu Dükkan)

**Bütün veriler `shopId` ile filtrelenmelidir.**

```typescript
// ✅ Doğru
prisma.customer.findMany({ where: { shopId } })

// 🚫 Yanlış — Global veri sızıntısı riski
prisma.customer.findMany({})
```

**Kritik Türkiye-Özel Field'lar (Community 31)**
- `invoicePrefix`, `invoiceInitial`, `invoiceScenario`
- Bu alanlar GIB/EDM entegrasyon düzeyinde mukellef faturasyonu yönetir

### Server Component vs Client Component

| Tercih Et | Kaçın |
|-----------|-------|
| Server Component + `prefetchQuery` + `HydrationBoundary` | `useEffect + fetch` anti-pattern |
| Server Action (`"use server"`) | `fetch` kullanarak API route çağırma |
| React Query `staleTime: 5*60*1000` + `refetchOnWindowFocus: false` | Her odaklanmada refetch |

### Gerçek GECIKMELER — EDM Entegrasyonu (Community 67)

| Akış | Gerçek Gecikme | İyileştirme |
|------|---------------|-------------|
| `checkUser` | 1.2s | Cache'e al (onboarding'de) |
| `sendInvoice` | Broadcast: 52s-126s | Arka plan kuyruğuna al |
| `getInvoiceUbl` | 3.2s | Self-hosted XML cache (yeni) |
| `getInvoiceReportWithTypeCount` | 90s | Interval cache + moment day-range |
| `getincomingInvoiceNew` | 144s | Pagination cache ile al |

### Önbellek Stratejisinde Kutüphane Yapısı

```
unstable_cache({
  cb: Function,
  getTags: () => [`<domain>-${shopId}`],
  staleMs: 5*60*1000
})
```

| Tag | İlgili domain | Invalidate Yapan |
|-----|--------------|----------------|
| `dashboard-{shopId}` | Dashboard widget | Organizasyon/firma değişiklikleri |
| `shortage-{shopId}` | Kurye/görevler | Görev ekleme/çıkarma |
| `stock-{shopId}` | Stok hareketleri | Satın alma/ürün ekleme |
| `finance-{shopId}` | Muhasebe/Kasa | İşlem güncelleme |

---

## 🔧 Kritik Dosyalar & Nasıl Değiştirilir

### 1. `src/lib/edm/rest-client.ts` — EDM REST Client (Community 30, 36)
**NOKTASI:** Bu dosya değiştirilmeden önce **daima** `buildUblTrXml` dosyası OKUNMALI — UBL-TR XML `<cbc:ProfileID> TEMELFATURA | EARSIVFATURA` içerdiğinden, faturalama `type` tutarsızlığı bu adımdaki kararla belirlenir.

### 2. `src/app/api/edm/invoice/[id]/render/route.ts`
**NOKTASI:** XSLT girişinde daima `sanitizeXsltForXslt1()` çalıştırılmalıdır. `xslt-processor` sadece XSLT 1.0 destekler; XSLT 2.0 tag'leri (`xsl:character-map`, `xsl:sequence`) transform hatası yaratır.

### 3. `src/lib/auth.ts`
**NOKTASI:** `signIn` callback ve `events.signIn` broker pattern'i kullanır. Google OAuth'u ilk defa kullanan kullanıcılar otomatikman onboarding'e yönlendirilir. `prisma.user.create/update` YERİNE mutlaka `prisma.user.upsert` kullanılmalı (race condition önler).

### 4. `src/middleware.ts`
**NOKTASI:** `authorized: () => true` yaptıktan sonra, onboarding olmayan kullanıcılar için dükkan kontrolü `middleware` içindeki `hasShopRedirect` üzerinden yapılır. Doğrudan `authorized`a `!!token` koyma.

---

## 📊 Graphify Çıktısı ile Senkronizasyon

Proje `graphify-out/GRAPH_REPORT.md` ile düzenli olarak senkronize edilir.

**Yeni bağlantı algılandığında yapılacaklar:**

1. `GRAPH_REPORT.md` dosyasını oku — yeni bağlantı hangi community'de?
2. İlgili kod bölümünü `<Graphify: Community XX>` tag'i ile `JOURNAL.md`'e ekle
3. Eğer yeni community oluşmuşsa: `next.config.mjs`'teki `experimental` alanına gerekirse yeni package ekle
4. Gizli bağımlılık (`─╯`) tespit edilirse: kod refaktör et / import cycle kır
5. Gizli node (`609` aralığı) varsa: ilgili dosyaya JSDoc ekle veya utility haline getir

### Bilgi Boşluk Farkındalığı
609 node henüz bağlam graph'ına bağlı değil. Her aktif geliştirme döngüsünde bu sayıyı 0'a yaklaştırma hedefi vardır.

---

## 🧪 Test Komutları (Doğrulama)

```bash
# 1. TypeScript doğrulama
npx tsc --noEmit

# 2. Build doğrulama
npm run build

# 3. Migration uyumluluk
npx prisma migrate status

# 4. Bundle analizi
ANALYZE=true npm run build
```

---

## 📝 Karar Kayıt Defteri (Decision Log)

Son 3 kritik karar:

| Karar | Kaynak | Durum |
|-------|--------|-------|
| EDM SOAP'dan REST'e tam geçiş | EDM REST API Swagger dokümanı | ✅ Tamamlandı |
| `db push` yasak, sadece `migrate dev` | `docs/migration-rules.md` | ✅ Devam ediyor |
| Self-hosted fatura render (XML+@xslt) | EDM API beklenmedik gecikmeler | ✅ Tamamlandı |

Tam kayıt için bkz: `JOURNAL.md`

---

## ⚠️ Bilinen Riskler

| Risk | Etki | Çözüm Yolu |
|------|------|------------|
| XSLT 2.0 uyumsuzluğu | `xslt-processor` sadece XSLT 1.0 | `sanitizeXsltForXslt1()` pre-processor kullanılır |
| EDM API 500 hataları | Self-hosted render zorunlu hale geldi | DB'de `xmlContent` + XSLT fallback mümkün |
| 609 izole node | Kod kalitesi / bakım sorun | Her sprint'te izoalasyon testi yap |
| Puppeteer 24MB+ | Bundle bloat eder | Server-only dynamic import |
| WhatsApp Web.js 18MB+ | Bundle bloat eder | Worker thread'a taşınmalı |

---

## 🎯 Geliştirme Akışı

```
1. JOURNAL.md'ye task ekle
2. Branch oluştur (feature/<kisa-isim>)
3. Graphify raporunu kontrol et (yeni bağlantı? bilgi boşluğu?)
4. Kod yaz → npx tsc --noEmit
5. Migration varsa: npx prisma migrate dev --name <...
6. Commit + PR aç (en az 1 review)
7. Merge sonrası deploy öncesi npx prisma migrate deploy
```

---

**Hata bulundu veya yeni baglanti algilandi?** `Enes Başar` ile Telegram kanali `telefon-takip-v2:default:8758860031` uzerinden iletisime gec.
