# PROJECT_MASTER_DATA.md - Takip V2 Master Bilgi Belgesi

Bu belge, **Takip V2** projesinin mimarisini, iş mantığını ve tasarım prensiplerini tek bir noktada toplar. Yeni bir geliştirici veya AI için projenin "kullanım kılavuzu" niteliğindedir.

---

## 🏗 1. Genel Mimari (Architecture)

Proje, modern bir SaaS mimarisi üzerine inşa edilmiştir:

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router). Server Components ve Server Actions ağırlıklı yapı.
- **Veritabanı & ORM:** [Prisma](https://www.prisma.io/) ile [PostgreSQL](https://www.postgresql.org/). Veritabanı barındırma için [Neon DB](https://neon.tech/) kullanılmaktadır.
- **Kimlik Doğrulama:** Auth.js (NextAuth) entegrasyonu ile Google ve Email/Password girişi.
- **Tasarım:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (shadcn/ui tabanlı).
- **AI Entegrasyonu:** Google Gemini Pro API (`src/lib/actions/gemini-actions.ts`) üzerinden doğal dil işleme ve akıllı güncelleme süreçleri.

---

## 🗺 2. Sayfa Haritası (Sitemap)

Tüm rotalar `(dashboard)` grup klasörü altında toplanmıştır ve dükkan sahiplerine (`shopId`) göre izoledir.

| Rota | Açıklama | Kritik Bileşenler | Yetki |
| :--- | :--- | :--- | :--- |
| `/dashboard` | Genel özet, istatistikler ve günlük raporlar. | `RecentSales`, `ServiceStatusCards` | Tüm Personel |
| `/servis` | Teknik servis kayıtlarının yönetildiği ana merkez. | `ServiceTicketModal`, `StatusTimeline` | Teknik/Admin |
| `/stok` | Ürün envanteri, kategori yönetimi ve stok AI. | `ProductTable`, `BulkAIUpdate` | Stok/Admin |
| `/satis` | POS (Hızlı Satış) arayüzü ve kasa işlemleri. | `POSClient`, `PaymentMethods` | Satış/Admin |
| `/musteriler` | Müşteri veritabanı, sadakat puanları ve borç takibi. | `CustomerDetail`, `DebtHistory` | Tüm Personel |
| `/finance` | Gelir/Gider takibi, banka hesapları ve nakit akışı. | `TransactionList`, `BalanceSummary` | Sadece Admin |
| `/personel` | Çalışan yönetimi, maaş/prim ve yetki tanımları. | `StaffTable`, `RolePermissions` | Sadece Admin |
| `/admin` | Sistem yönetimi, dükkan oluşturma ve sektör şablonları. | `ShopManagement`, `IndustryConfig` | Super Admin |

---

## 🧠 3. Kritik İş Mantığı (Logic)

### Teknik Servis Süreci (Ticket Lifecycle)
1. **Kayıt:** `createServiceTicket` ile oluşturulur. Cihaz bilgilerine göre `SRV-1000` formatında ardışık numara alır. Kapora alınırsa otomatik `INCOME` işlemi açılır.
2. **Parça Kullanımı:** `addPartToService` ile stoğa bağlı parçalar eklenir. Stok anlık düşer.
3. **İptal Durumu:** Servis iptal edilirse, kullanılan tüm parçalar otomatik olarak stoğa iade edilir (`stock: increment`).
4. **Teslimat:** `updateServiceStatus` (DELIVERED) çağrıldığında; 
   - Garanti süresi hesaplanır (Varsayılan 1 ay veya parça garanti süresinin maksimumu).
   - Tahsilat tipine göre `Debt` (15 günlük vade) veya `Kasa` girişi yapılır.
   - Sadakat puanları (Loyalty Engine) hesaplanarak müşteri hesabına eklenir.

### Stok ve Envanter Mantığı
- **FIFO Yaklaşımı:** Parça maliyetleri ve satışlar işlem bazlı loglanır.
- **Kritik Stok:** `shortage-actions.ts` üzerinden stok tükenen ürünler "Eksik Listesi"ne otomatik düşer.
- **AI Bulk Update:** `gemini-actions.ts` üzerinden doğal dildeki toplu fiyat/stok güncellemeleri, niyet analizi (Clarification) sonrasında atomik olarak uygulanır.

---

## 📊 4. Veri Modeli (Prisma Schema)

İlişkiler, çok kiracılı (multi-tenant) bir yapıyı desteklemek üzere `shopId` üzerinden kurgulanmıştır:

- **Shop (1) ↔ (N) Data:** Tüm tablolar (Product, Customer, Sale vb.) bir `Shop`'a bağlıdır.
- **Customer (1) ↔ (N) Sale/Debt/Ticket:** Müşteri tüm finansal ve teknik geçmişin merkezidir.
- **Product (1) ↔ (N) InventoryLog:** Her stok değişimi kesinlikle loglanır (Audit Trail).
- **ServiceTicket (1) ↔ (N) UsedPart:** Kullanılan parçalar `productId` üzerinden ürüne, `ticketId` üzerinden servise bağlıdır.

---

## 🎨 5. Özel Tasarım Kuralları (Design System)

Projenin görsel dili "Apple-Style" sadeliği ve premium hissi üzerine kuruludur:

- **Tipografi:** Varsayılan font **Inter**'dir (Sektörel şablonlarda *Plus Jakarta Sans* tercih edilebilir).
- **No-Uppercase Kuralı:** Arayüzde `UPPERCASE` kullanımından kaçınılır (Bağıran metin istenmez). 
   - *İstisna:* `formatName` fonsiyonu soyisimleri otomatik büyük harf yapar (`Enes BAŞAR`).
- **Görsel Tercihler:** 
  - `matte-card`: Yüksek blur (`backdrop-blur-3xl`) ve çok ince opaklık (`bg-white/[0.03]`).
  - `radius`: Yazılımlarda yumuşak geçiş için `1rem` (16px) yuvarlatma standarttır.
  - **Renkler:** Saf siyah yerine derin lacivert/gri tonları (`--background: 222.2 47.4% 10%`) kullanılır.

---

## 📝 6. Geliştirme Notları

### Hassas Noktalar (Caveats)
- **Prisma Regeneration:** Yeni bir model eklendiğinde (örn: `IndustryTemplate`), dev sunucusu dosyaları kitlediği için `EPERM` hatası verebilir. Bu durumda `prisma generate` için sunucunun durdurulması gerekebilir.
- **Naming Conventions:** Fonksiyon isimleri `camelCase`, veritabanı modelleri `PascalCase` ve Türkçeye özel `LocaleLower` desteğiyle yazılmalıdır.
- **Remote Scanner:** Barkod okuma sisteminin yerel ağdaki mobil cihazlardan test edilebilmesi için Next.js uygulamasını `npm run dev -- -H 0.0.0.0` ile çalıştırın. Böylece aynı ağdaki telefon, üretilen QR kodunu (örneğin `http://192.168.1.5:3000`) tanıyıp kamerayı açabilir.

### Gelecek Planları
- **Multi-Industry SDK:** Diğer sektörler için AI tabanlı menü ve form yapılarının tam dinamikleştirilmesi.
- **Offline Mode:** POS ekranının düşük internet hızlarında çalışabilmesi için PWA desteği.

---
*Son Güncelleme: 2026-04-13*
*Hazırlayan: Antigravity AI*
