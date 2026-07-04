# Akıllı Stok Yenileme Performans Tasarımı

## Amaç

Akıllı stok yenileme sonuçlarını değiştirmeden, 90 günlük ham satış ve talep satırlarının uygulama belleğine taşınmasını azaltmak; tekrar eden istekleri iki dakikalık güvenli bir cache ile hızlandırmak.

## Veritabanı Toplama Stratejisi

Satış miktarları `SaleItem` tablosunda ürün bazında veritabanı seviyesinde toplanır. Son 30, 60 ve 90 gün için üç `groupBy` sorgusu paralel çalışır ve yalnızca şu alanları döndürür:

- `productId`
- `_sum.quantity`

Servis parça ihtiyacı ve aktif eksik talepleri de ürün bazında `_sum.quantity` ile toplanır. Kurye ataması veya aktif satın alma siparişi nedeniyle dışlanacak ürünler yalnızca ürün kimliği seçilerek çekilir.

Tüm ürünlerin temel metadata sorgusu korunur; çünkü hızlı satan ve henüz kritik eşiğe düşmemiş ürünlerin de değerlendirilmesi gerekir.

## Cache

Öneri hesaplamasının sayfalamadan önceki tam sonucu `unstable_cache` ile iki dakika saklanır.

Cache anahtarı mağaza kimliğine göre ayrılır. Etiket:

```text
smart-replenishment-{shopId}
```

Sayfalama cache dışında uygulanır; böylece farklı offset/limit değerleri aynı tam sonuç kümesini paylaşır.

## Cache Geçersizleştirme

Aşağıdaki işlemler başarıyla tamamlandığında mağazaya ait etiket temizlenir:

- Satış oluşturma, güncelleme, silme veya iade
- Ürün/stok oluşturma ve stok miktarı değişiklikleri
- Servis parça kullanımı veya servis durumu değişiklikleri
- Eksik talebi oluşturma, güncelleme, atama, çözme veya silme
- Satın alma siparişi oluşturma, iptal ve mal kabul

Tekrarlanan çağrıları azaltmak için ortak bir `revalidateSmartReplenishment(shopId)` yardımcısı kullanılır.

## Süre Ölçümü

Cache dışındaki hesaplama `performance.now()` yerine sunucu ortamında güvenli `Date.now()` ile ölçülür. Geliştirme ortamında yalnızca 750 ms üzerindeki hesaplamalar tek satır uyarı üretir:

```text
[smart-replenishment] slow calculation: <duration>ms
```

Mağaza kimliği, ürün adı veya finansal veri loglanmaz.

## Hata Yönetimi

- Aggregate sorgularından biri başarısız olursa mevcut güvenli boş sonuç davranışı korunur.
- `null` toplamlar sıfır kabul edilir.
- Cache hatası sonuç üretimini engellemez; hesaplama hatası mevcut server action hata yoluna düşer.
- Invalidation hatası ana mutasyonun başarılı sonucunu geri almaz fakat geliştirme ortamında uyarı üretir.

## Test Stratejisi

- Aggregate satırlarını 30/60/90 satış map’lerine çeviren saf yardımcı test edilir.
- `null` toplamların sıfıra dönüştüğü doğrulanır.
- Tam sonuç cache’lendiği için farklı sayfaların aynı özetten üretildiği test edilir.
- Ortak cache etiketi yardımcısının doğru mağaza etiketini oluşturduğu test edilir.
- Hedef replenishment testi, TypeScript kontrolü ve production build çalıştırılır.
- Chrome’da gerçek veriyle sıcak yükleme süreleri yeniden ölçülür.

## Kabul Kriterleri

- `getSmartReplenishmentData` ham `SaleItem`, `ServiceUsedPart` ve `ShortageItem` koleksiyonlarını miktar toplamak amacıyla belleğe almaz.
- Öneri adetleri, öncelikleri ve maliyetleri mevcut testlerle aynı kalır.
- Sonuçlar mağaza bazında iki dakika cache’lenir.
- İlgili iş mutasyonları cache etiketini temizler.
- Hassas veri içermeyen yavaş sorgu ölçümü bulunur.
- Test, tip kontrolü ve build başarılıdır.
