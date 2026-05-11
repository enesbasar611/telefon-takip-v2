# Proje Durum Raporu (Antigravity'den Devam)
- **Proje:** Başar Teknik V2 (Telefon Takip Sistemi)
- **Teknoloji:** Next.js 14, Prisma, Neon Tech DB, Tailwind, Shadcn/UI.
- **En Son Yapılanlar:** Kurye sayfası yetkilendirme sorunları çözüldü. Graphify entegrasyonu tamamlandı.
- **Aktif Görev:** 'Knowledge Gaps' (bağlantısız kodlar) temizliği yapılacak.
- **Kural:** 'getShopId()' fonksiyonu projenin merkezidir. Tüm işlemler bu dükkan ID'sine bağlıdır.
- **Dosya Yolları:** '/app/kurye', '/middleware.ts', '/prisma/schema.prisma' kritik dosyalardır.
## KRİTİK VE KORUNACAK ALANLAR (SİLME!)
- **Resim Yükleme Modülleri:** `fs`, `path` ve `S3` entegrasyonu kullanan tüm dosya yükleme (upload) fonksiyonları.
- **Dosya İşlemleri:** Az kullanılsa da fatura/makbuz üretimi ve resim işleme kodları korunacak.
- **İzole Servisler:** Başka dosyalar tarafından sık çağrılmasa da arka planda çalışan cron-job veya yardımcı (utility) fonksiyonlar.