# Akıllı Stok Yenileme İyileştirmeleri Tasarımı

## Amaç

Akıllı stok yenileme sistemini kritik stok eşiğine tepki veren yapıdan, yaklaşan talebi önceden gören bir yapıya taşımak. Öneriler satış hızı, açık servis ihtiyacı, eksik talepleri, mevcut stok, tedarikçi uygunluğu ve ürün para birimini tutarlı biçimde kullanmalıdır.

## Kapsam

- Hızlı satan ürünleri kritik stok seviyesine düşmeden önerilere dahil etmek.
- Sipariş miktarı formülünü açık ve test edilebilir hale getirmek.
- Tedarikçi önerisinde ürün kategorisini dikkate almak.
- TRY ve USD alış fiyatlarından güvenilir tahmini maliyet üretmek.
- Öncelik adetleri ve maliyet toplamlarını sayfalamadan bağımsız hesaplamak.
- Servis ve eksik taleplerini ayrı alanlarda göstermek.
- Journal içindeki özellik durumunu tamamlandı olarak güncellemek.

Yeni tahmin modelleri, tedarik süresi öğrenimi, otomatik sipariş gönderimi ve yeni veritabanı modelleri bu çalışmanın dışındadır.

## Talep ve Stok Hesabı

Her aktif ve eksik listesinden gizlenmemiş ürün değerlendirilir.

Günlük satış hızı:

1. Son 30 günde satış varsa `salesLast30 / 30`.
2. Aksi halde son 60 günde satış varsa `salesLast60 / 60`.
3. Aksi halde `salesLast90 / 90`.

Hedef stok:

```text
ceil(günlük satış hızı × 30)
+ açık servis parça ihtiyacı
+ aktif eksik talebi
+ kritik stok tamponu
```

Önerilen sipariş miktarı:

```text
max(0, hedef stok - mevcut stok)
```

Sipariş miktarı sıfır olan ürün önerilere dahil edilmez. Aktif satın alma siparişindeki veya kurye tarafından işleme alınmış ürünlerin mevcut dışlama davranışı korunur.

## Önceliklendirme

Mevcut 0–100 puanlama yaklaşımı korunur; ancak aday kümesi hedef stok açığı üzerinden genişletilir. Puanlama şu sinyalleri kullanır:

- Stok tamamen bitmiş mi?
- Hedef stoğa göre açık ne kadar büyük?
- Tahmini tükenme süresi üç veya yedi gün içinde mi?
- Açık servis ve eksik talebi var mı?
- Günlük satış hızı yüksek mi?

Seviye eşikleri mevcut davranışla uyumlu kalır: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.

## Tedarikçi Seçimi

Önerilen tedarikçi aşağıdaki sırayla belirlenir:

1. Ürüne doğrudan bağlı tedarikçi.
2. Ürün kategorisiyle eşleşen tedarikçiler arasından en yüksek güven puanına sahip olan.
3. Tüm tedarikçiler arasından en yüksek güven puanına sahip olan.

Eşit güven puanında sonuç deterministik olmak için ada, ardından kimliğe göre sıralanır.

## Para Birimi ve Maliyet

Öneri sonucu kaynak para birimini ve birim maliyeti açıkça taşır.

- Ürünün fiyat para birimi USD ve `buyPriceUsd` mevcutsa kaynak maliyet USD olur.
- Diğer durumlarda `buyPrice` TRY kabul edilir.
- USD maliyetinin TL karşılığı sistemdeki güncel USD kuru kullanılarak hesaplanır.
- Kur bulunamazsa sonuç sessizce yanlış TL toplamı üretmez; kaynak USD maliyeti gösterilir ve TL toplamı hesaplanamaz olarak işaretlenir.

Sunucu hem kaynak maliyeti hem de hesaplanabilen TL karşılığını döndürür. Arayüz kaynak para birimini belirtir.

## API Sonucu ve Sayfalama

`getSmartReplenishmentData` sayfalı önerilerle birlikte tüm sonuç kümesine ait bir özet döndürür:

- Toplam öneri sayısı
- Her öncelik seviyesinin toplam adedi
- Hesaplanabilir toplam TRY maliyeti
- Toplam USD kaynak maliyeti
- TL karşılığı hesaplanamayan öneri bulunup bulunmadığı

Arayüz sayaçları ve üst toplam bu özeti kullanır. Filtreler yüklü sayfalardaki satırları etkiler; rozet sayıları tüm sonuç kümesini temsil eder.

## Veri Modeli ve Adlandırma

Yeni Prisma modeli veya migration eklenmez.

`ReplenishmentRecommendation` içinde:

- `pendingServiceQty` yalnızca açık servis ihtiyacını içerir.
- `pendingShortageQty` aktif eksik talebini içerir.
- Hedef stok, kaynak para birimi, kaynak maliyeti ve TRY karşılığı açık alanlarla taşınır.

Mevcut `isFromReplenishment` alanı ve satın alma/eksik listesi entegrasyonu korunur.

## Hata Yönetimi

- Veri tabanı hatasında mevcut güvenli boş sonuç davranışı korunur.
- Geçersiz veya negatif sayısal girdiler hesaplama katmanında sıfıra sınırlandırılır.
- Kur eksikliği öneriyi silmez; yalnızca TRY karşılığını belirsiz yapar.
- Tedarikçi bulunamayan ürün sipariş önerisi olarak görünür ancak kullanıcıdan tedarikçi seçmesi istenir.

## Test Stratejisi

Hesaplama ve tedarikçi seçimi saf fonksiyonlara ayrılır ve testler üretim kodundan önce yazılır.

Test senaryoları:

- Hızlı satan, kritik seviyenin üzerinde olan ürün öneriye girer.
- Talebi olmayan ve hedef stoğu karşılayan ürün öneriye girmez.
- Servis ve eksik talepleri ayrı hesaplanır.
- Önerilen miktar 30 günlük talep ve kritik tamponu doğru kullanır.
- Doğrudan bağlı tedarikçi kategori eşleşmesinden önce gelir.
- Bağlı tedarikçi yoksa kategori içindeki en güvenilir tedarikçi seçilir.
- Kategori eşleşmesi yoksa genel güven puanı fallback'i çalışır.
- TRY ve USD maliyetleri doğru hesaplanır.
- USD kuru yokken yanlış TRY toplamı üretilmez.
- Özet değerleri sayfalanmış satırlardan bağımsızdır.

Son doğrulamada ilgili testler, TypeScript kontrolü ve mümkünse üretim build'i çalıştırılır.

## Kabul Kriterleri

- Kritik seviyenin üzerindeki hızlı satan ürünler öneri listesine girebilir.
- Sipariş miktarı onaylanan 30 günlük hedef formülünü izler.
- Kategori uyumlu tedarikçi seçimi deterministiktir.
- Dövizli ürünlerde maliyetin para birimi açık ve hesap doğru olur.
- Öncelik sayaçları ve toplam maliyet, yalnızca yüklenmiş ilk sayfaya bağlı olmaz.
- Servis ve eksik adetleri birbirinden ayrılır.
- Mevcut sipariş, kurye, iptal ve mal kabul akışları bozulmaz.
- Journal özelliği tamamlandı olarak gösterir.
