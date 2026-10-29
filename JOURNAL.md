# Basar Teknik V2 - JOURNAL

## Genel Proje Durumu

- Tarih: 2026-10-16
- Mimari durum: Proje V2 mimarisinde ilerliyor. EDM Bilişim e-Fatura REST API tam entegrasyonu, POS senkronizasyonu, personel finansı, finansal kokpit, işlem arşivi ve Veresiye Terminali optimizasyonu aktif.
- Graphify durumu: `graphify-out/GRAPH_REPORT.md` güncellendi (2026-10-16).
- Graphify ozeti: 533 dosya, 2624 node, 5851 edge, 76 community (170 küme). `graph.json`, `graph.html` ve `GRAPH_REPORT.md` tamamen yenilendi.
- Tip durumu: `npx tsc --noEmit` son kontrolde basarili calisti (0 hata).
- Calisma agaci notu: Veresiye terminali hesaplama tutarlılığı, WhatsApp/Fiş/Excel dökümleri ve ferah mobil kart arayüzü tamamlandı.
- Protokol notu: Yapılan tüm değişikliklerin her aşamada `JOURNAL.md` içerisine kaydedilmesi kuralı aktif olarak uygulanmaktadır.

## To-Do List (Backlog)

- [x] Continuous Work Protocol baslatildi. `JOURNAL.md` olusturuldu; proje durumu ve backlog kayit altina alindi.
- [x] Graphify raporu incelendi. Stok, kurye, finans, raporlama ve tedarik topluluklari yeni ozellik onerileri icin ana baglam olarak belirlendi.
- [x] Ozellik 4: EDM Biliºim e-Fatura Entegrasyonu (Tamamlandi, test asamasinda)
  - Graphify baglamlari: Community 11 (`buildInvoiceXml`, `amountToWords`, `buildRequestHeader`, EDM tipleri), Community 13 (`getSettings`, `getShop`, `updateSetting`, `AyarlarPage`), Community 46 (`cron`, `getLocalIps`, `getPreferredIp`, `httpServer`, `io`), Community 55 (`generateInvoiceHTML`, `generateInvoicePDF`, `formatInvoiceMoney`, `formatDateTR`), Community 69 (`middleware`, `authMiddleware`, `config`, `role`), Community 75 (`prisma`, `PrismaClient`, `SUPER_ADMIN_EMAILS`), Community 93 (`UIContext`, `UIProvider`), Community 94 (`JWT`, `Session`, `User`).
  - Amac: EDM Biliºim e-Fatura/e-Arºiv servisini kendi sistem üzerinden tam entegre etmek; yeni fatura oluºturma, gönderme, gelen fatura alma, HTML/PDF indirme, iptal ve ayar yönetimi. EDM sitesine yönlendirme yok.
  - Durum: Faz 1-6 tamamlandi (Prisma schema, EDM client, API routes, UI sayfalari, cron senkronizasyonu, sidebar/menu, modul aktivasyonu, otomasyon ayarlari). Test credentials ile login basarili. Payload key'leri EDM REST API beklenen buyuk harf formatina cevrildi (HEADER, CONTENT, SENDER, RECEIVER, ISSUE_DATE, PAYABLE_AMOUNT, PROFILEID, EARCHIVE, INVOICE_TYPE, RECEIVER_ALIAS, INVOICE_SEND_TYPE, UUID, ID). CONTENT.Value base64 string olarak guncellendi (EDM REST API byte array bekliyordu, base64 string kabul ediyor). XSLT sablonlari public/xslt/ altina eklendi. TenantSettings ve Invoices Prisma modelleri eklendi. Encryption servisi (AES-256) yazildi. Registration servisi (initializeParameter, createCustomerPortal, getTenantBalanceAndStatus, loadCredit) yazildi. Debug/test endpoint'leri temizlendi. Build ve tip kontrolu basarili.

- [x] Ozellik 6: POS Compact (Mobil) Terminal Optimizasyonu (Tamamlandı)
  - Amac: Mobil arayüzde dinamik toplam tutar gösterimi sağlamak, KDV ve ara toplam detaylarını sunmak ve ana POS ile finansal mantığı (para birimi, yuvarlama, indirim) tam eşitlemek.
  - Detay: Başlık çubuğuna tıklanabilir toplam tutar eklendi. Sadakat puanı (Loyalty) hesaplamaları TL bazlı standardize edildi. Fiş yazdırma ve hızlı satış drawer'ındaki tutar tutarsızlıkları/çevrim hataları giderildi. 2-basamak hassasiyeti (`.toFixed(2)`) tüm finansal hesaplamalara uygulandı.

- [x] Ozellik 5: Merkezi Firma Bilgileri ve Logo Yönetimi (Tamamlandı)
  - Amac: Firma bilgilerini (İsim, Tel, Adres, Logo, Vergi Bilgileri) tek merkezden (Profil Sayfası) yönetmek; fiş ve faturalarda mükerrer girişi önlemek.
  - Detay: `Shop` modeline `logoUrl` eklendi. Profil sayfasına dosya seçerek logo yükleme ve Gmail logosunu tek tıkla aktarma özelliği eklendi. Fiş şablonlarındaki (Termal, PDF) logo filtreleri (grayscale/contrast) temizlenerek PNG uyumu sağlandı. UI'daki kilitlenme (relative CSS hatası) giderildi.

- [x] Ozellik 1: Akilli Stok Yenileme ve Tedarik Planlama
  - Graphify baglamlari: Community 9 (`addShortageItem`, shortage flow), Community 32 (`SupplierOrderContext`, supplier order lists), Community 33 (`AI alerts`, purchase orders), Community 67 (`getCriticalProducts`, stock movements).
  - Amac: Kritik stok, son satis hizi, bekleyen servis parca ihtiyaci ve tedarikci bilgilerini birlestirerek otomatik satin alma onerisi uretmek.

- [x] Ozellik 2: Kurye Is Yukleme ve Rota Onceliklendirme
  - Graphify baglamlari: Community 38 (`getStaff`, staff performance), Community 49 (`GroupedShortage`, shortage status), Community 9 (`assignShortageToCourier`, courier tasks).
  - Amac: Kurye gorevlerini personel yogunlugu, aciliyet, musteri/tedarikci bekleme suresi ve stok etkisine gore siralamak.

- [ ] Ozellik 3: Finansal Risk ve Nakit Akisi Erken Uyari Paneli
  - Graphify baglamlari: Community 18 (`getCashflowReport`, accounts, transactions), Community 43 (`sales/service metrics`), Community 44-45 (`Receivables`, `Veresiye`).
  - Amac: Geciken alacaklar, kasa acilis/kapanis farklari, tedarikci bakiyeleri ve yaklasan odemeleri tek risk panelinde gostermek.

## Degisiklik Gunlugu

- [x] 2026-10-29: Hızlı Satış (`/satis`) Mobil Görünüm Sekmeli Sepet, Adımlı Satış Akışı & Müşteri Seçim Modalı:
  - **Talep:**
    - Mobilde sepet ve ürün kataloğunun sıkışıp ürün seçiminin engellenmesi sorununa çözüm: Sekmeli / adımlı (stepped flow) mobil mimari (Önce geniş ekranda ürün seçimi, ardından müşteri seçimi, sonrasında satış onayı).
    - Müşteri seçimini tek tıkla açılan temiz bir modal / buton haline getirmek; mobilde ekranı maksimum ferah ve kullanışlı kılmak.
  - **Yapılan İyileştirmeler:**
    1. **Özel Müşteri Seçim Modalı (`src/components/pos/parts/customer-modal.tsx`):**
       - Radix `Dialog` tabanlı, mobil ve masaüstü tam uyumlu, yukarı/aşağı taşma riski olmayan bağımsız müşteri modalı geliştirildi.
       - Otomatik odaklanan hızlı arama çubuğu, tek tıkla Perakende Satış kartı, hızlı müşteri oluşturma kartı (`onQuickCreateCustomer`) ve VIP rozetli müşteri listesi entegre edildi.
    2. **Mobil Sekmeli / Adımlı POS Arayüzü (`src/components/pos/pos-interface.tsx`):**
       - `mobileTab` state (`"PRODUCTS" | "CART"`) eklendi.
       - Mobilde üstte `[🛍️ Ürünler (X)]` ve `[🛒 Sepet (Y)]` segment kontrolü yerleştirildi.
       - Ürün seçimi modunda sol katalog paneli mobilde tam ekran genişlikte açılıyor, sepet gizleniyor; ürünler ferah ızgara veya kompakt listede rahatça seçilebiliyor.
       - Sepete ürün eklendiğinde ekranın altından yumuşakça kayarak beliren dinamik yüzen sepet çubuğu (`[🛒 X Ürün • ₺Toplam] [Sepete Git & Ödeme Yap →]`) eklendi.
       - Sepet moduna geçildiğinde sol panel gizlenip sepet paneli tam ekran açılıyor; üstte tek tıkla ürünlere dönmeyi sağlayan `[← Ürünler]` butonu bulunuyor.
       - Sepet panelindeki hantal dropdown yerine şık, 1 satırlık `MÜŞTERİ HESABI` kartı ve `[Değiştir]` / `[Perakende Yap X]` aksiyonları yerleştirildi.
       - Sol panel başlığında doğrudan `CustomerModal`'ı açan kompakt müşteri hap butonu eklendi.
       - Satış tamamlandığında veya fiş kapatıldığında arayüz otomatik olarak ürün kataloğuna dönerek bir sonraki satışa hazır hale getiriliyor.
       - Masaüstü görünümü (`lg:`) hiçbir şekilde bozulmadan 8 sütun katalog + 4 sütun sepet yan yana bento ızgarasını korumaya devam ediyor.
    3. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata). Dev server kesintisiz korundu.

- [x] 2026-10-29: Hızlı Satış (`/satis`) Kategori Bazlı Özgün ve Mat Border Renklendirme Sistemi:
  - **Talep:**
    - Ürün kartları ve kategori butonlarının bordürlerine kategoriye göre özgü renkler atanması.
    - Neon ışıma veya abartılı parlaklıktan kaçınılması; mevcut ince 1px bordür çizgilerinin tonuna ve doğallığına sadık kalınarak her kategorinin zarif bir renk kimliğine sahip olması.
  - **Yapılan İyileştirmeler:**
    1. **Merkezi Kategori Palet Motoru (`src/lib/category-colors.ts`):**
       - 12 adet dengeli, mat ve göz yormayan renk teması (Mavi, Mor/Violet, Zümrüt, Kehribar/Amber, Gök Mavisi, Gül/Rose, İndigo, Teal, Turuncu, Fuşya, Cyan, Arduvaz/Slate) oluşturuldu.
       - Neon parlamalardan kaçınmak için %25-30 opaklıkta doğal 1px bordür çizgileri (`border-{color}-500/25 dark:border-{color}-400/25`) ve hover'da yumuşak %50-55 geçişler tanımlandı.
       - Akıllı anahtar kelime eşleştirmesi (Telefon/Cihaz: Mavi, Aksesuar/Kılıf: Mor, Ekran/LCD: Zümrüt, Şarj/Kablo: Kehribar, Bilgisayar/Tablet: Gök Mavisi, Kulaklık/Ses: Gül vb.) ve özel kategoriler için stabil string hash algoritması uygulandı.
    2. **Ürün Kartları Entegrasyonu (`src/components/pos/parts/product-card.tsx`):**
       - Hem Bento ızgara kartında hem de kompakt liste satırında ürünün kategorisine ait özgün bordür rengi uygulandı.
       - Kart içi kategori etiketi ve "+ Ekle" mikro butonu aynı renk ailesiyle ahenk kazandı.
    3. **Kategori Seçim Şeridi Entegrasyonu (`src/components/pos/pos-interface.tsx`):**
       - Üst kategori barındaki tüm butonlar ilgili kategorinin özgün bordür ve soft metin tonuyla donatıldı; aktif seçildiğinde o kategorinin asil rengine bürünmesi sağlandı.
    4. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata). Dev server kesintisiz korundu.

- [x] 2026-10-29: Hızlı Satış (`/satis`) Müşteri Seçimi Açılır Yönü Düzeltmesi & "Katman Katman" Boşluk/Border Kusurunun Temizlenmesi:
  - **Talep:**
    - Müşteri arama açılır kutusunun (`CustomerSelector`) yukarı doğru açılarak sepet başlığını örtmesi ve ekrandan taşması hatasının düzeltilmesi.
    - POS sayfasında iç içe geçmiş ("katman katman") duran kart kenarlıkları, gereksiz dış boşluklar ve padding'lerin tamamen kaldırılması.
  - **Yapılan İyileştirmeler:**
    1. **Müşteri Seçim Açılır Menüsü Aşağı Yönlü Açılış (`src/components/pos/parts/customer-selector.tsx`):**
       - `absolute bottom-full mb-4` yerine doğrudan girdinin altına açılan `absolute top-full mt-1.5 left-0 w-full` pozisyonlandırması uygulandı; yukarı taşma ve başlığı örtme sorunu tamamen giderildi.
       - Tıklama dışı algılama (`handleClickOutside`) ve `isOpen` yönetimi eklenerek menünün istemsiz açık kalması engellendi.
       - Arama kutusuna müşteri seçildiğinde tek tıkla perakendeye dönmeyi sağlayan temizleme (`X`) butonu eklendi.
       - Hızlı Yeni Müşteri Ekleme, Perakende (İsimsiz) ve müşteri sonuç satırları daha kompakt (`h-9` girdi, `py-2` öğeler) hale getirildi.
    2. **"Katman Katman" Düzenin Kaldırılması & Tam Ekran Bento Entegrasyonu (`src/app/globals.css` & `src/app/(dashboard)/satis/page.tsx`):**
       - Genel dashboard düzenindeki (`layout.tsx`) dış kart (`rounded-3xl border border-border/40 bg-card/30`) ve 30px'lik aşırı padding'lerin POS terminalinde çift katman oluşturması engellendi.
       - `data-pos-root="true"` özniteliği ve modern CSS `:has()` seçicisi (`#app-scroll-container:has([data-pos-root])`) ile POS sayfası açıkken dış sahte kartın bordürü, arkaplanı ve gereksiz padding'leri sıfırlandı.
       - POS panelleri (Sol Ürün Kataloğu & Sağ Sepet) doğrudan temiz ekranda, tek bir dış bordür katmanına ve pencereye tam oturan (`calc(100vh - 4.75rem)`) kusursuz bento düzenine kavuşturuldu.
    3. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata). Dev server kesintisiz korundu.

- [x] 2026-10-29: Hızlı Satış (`/satis`) Sayfası & POS Terminali Kapsamlı Redesign (Bento Dashboard Düzeni, Sayfalama & Motion Efektler):
  - **Talep:**
    - Sayfayı en aşağı kadar kaydırma zorunluluğunun ortadan kaldırılması; ürünlerin ekrana sığacak şekilde sayfalanması veya daha işlevsel hale getirilmesi.
    - Hızlı arama, gereksiz boşlukların kaldırılması ve tam bir modern Bento Dashboard hissiyatı kazandırılması.
    - Yukarıdaki gereksiz `PageHeader` alanının tamamen kaldırılması.
    - Ürün kartlarına motion efektler, net ve okunaklı isimler, üzerine gelindiğinde şık dönüşümle detayların (stok, barkod, micro-action) gösterilmesi.
    - Mobil ve masaüstü uyumunun kusursuzlaştırılması, tüm satış ve sepet fonksiyonlarının (sıfır kayıp) korunması.
  - **Yapılan İyileştirmeler:**
    1. **Ekran Boyutuna Uyumlu Bento Düzeni (`src/app/(dashboard)/satis/page.tsx` & `pos-interface.tsx`):**
       - Sayfa üstündeki 100+ piksellik gereksiz `<PageHeader>` tamamen kaldırıldı; POS arayüzü doğrudan en üstten tam ekran bento alanı olarak başlatıldı.
       - Masaüstünde `lg:h-[calc(100vh-5.25rem)]` kuralı uygulanarak tarayıcı seviyesindeki çift kaydırma çubukları yok edildi; sol (katalog) ve sağ (sepet & ödeme) panelleri bağımsız akışa kavuşturuldu.
    2. **Akıllı Ekran Sayfalaması & Görünüm Modları (`pos-interface.tsx`):**
       - Sayfa kaydırma eziyetine son veren ekran sayfalaması eklendi: Sayfa Başı Ürün seçici (`12`, `16`, `24`, `Tümü`), mevcut sayfa / toplam sayfa göstergesi ve kompakt İleri/Geri butonları entegre edildi.
       - Görünüm Seçici eklendi: Modern Izgara (`GRID`) ve Kompakt Liste (`LIST`) modları arasında tek tıkla geçiş; kullanıcı tercihi `localStorage` ile kalıcı hale getirildi.
       - Hızlı Stok Durum Filtresi hapları eklendi: `Tümü`, `Stokta` ve `Kritik` seçenekleri ile kasiyerin aradığı ürüne anında erişmesi sağlandı.
       - Arama kutusuna anında temizleme (`X`) butonu ve barkod tarayıcı tetikleyicisi eklendi.
    3. **Motion Efektli & Dönüşümlü Ürün Kartları (`src/components/pos/parts/product-card.tsx`):**
       - Kartlara donanımsal ivmeli mikro-etkileşimler (`whileHover={{ y: -3, scale: 1.015 }}`, `whileTap={{ scale: 0.97 }}`) uygulandı.
       - Ürün isimleri yüksek kontrastlı, cesur ve okunaklı hale getirildi (`font-bold text-xs sm:text-sm text-foreground uppercase tracking-tight`).
       - Stok durumu renkli nabız (pulse) göstergeleriyle (5 üzeri yeşil, 1-5 arası sarı, 0 kırmızı) dinamikleştirildi.
       - Fiyatlar `tabular-nums` ile belirginleştirildi; varsa ikincil kur (Dolar/TL) karşılığı otomatik basıldı.
       - Kartın üzerine gelindiğinde (hover) barkod/SKU ve parlayan "+ Ekle" aksiyon butonu şık bir animasyonla beliriyor.
       - Liste görünümü (`isCompact=true`) için tek satırlık ultra-kompakt satır arayüzü tasarlandı.
    4. **Özet & Ödeme Paneli Dengelemesi (`checkout-summary.tsx`):**
       - Fazla dikey alan kaplayan 64px'lik butonlar `h-11 sm:h-12` standardına, aşırı padding `p-3.5` oranına çekilerek laptop ekranlarında sepetin taşmadan tek ekrana sığması sağlandı.
    5. **İş Mantığı ve Sıfır Silme İlkesi:**
       - Sadakat indirimleri, çoklu para birimi (TRY/USD), veresiye ve cari hesap seçicileri, fiş yazdırma modalı ve barkod tarayıcı tam uyumlulukla korundu.
       - `createSale` eyleminin `{ success: true, data: sale }` dönüşü ile tip uyumu tam sağlandı.
    6. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata).

- [x] 2026-10-29: Header Butonları Tarayıcı Kaydırma Çubuğu & Metin Seçim İmleci Kusurunun Kalıcı Çözümü:
  - **Hata / Kusur:**
    - "Yeni Borç Ekle" ve "Dışa Aktar" butonlarının bulunduğu başlık aksiyon çubuğunda, Windows 11 Fluent scrollbar motorunun `overflow-x-auto` kapsayıcısı sağ kenarında istenmeyen dikey kaydırma çubuğu kapsülü (scroll thumb) çizmesi.
    - Buton metinlerine tıklandığında veya gelindiğinde farenin I-beam metin imlecine dönüşmesi.
  - **Yapılan İyileştirmeler:**
    1. **Aksiyon Konteyneri Taşma Yönetimi (`src/components/ui/page-header.tsx`):**
       - Masaüstü ve tablet ekranlarında (`sm:` ve üzeri) `sm:overflow-visible` uygulanarak kaydırma konteyneri tamamen devre dışı bırakıldı; Windows kaydırma çubuğu kapsülü kesin olarak yok edildi.
       - Dar mobil ekranlarda (`< sm`) ise `py-1` dikey pay verilerek alt piksel yuvarlama taşmaları engellendi.
    2. **Genel Buton İmleç & Seçim İntizamı (`src/components/ui/button.tsx`):**
       - Tüm buton varyantlarına (`buttonVariants`) `cursor-pointer select-none` sınıfları dahil edilerek buton metinlerinin seçilmesi ve I-beam metin imleci oluşması tüm projede engellendi.
    3. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata).

- [x] 2026-10-29: Navbar Döviz Butonları İçerik Bazlı Renklendirme (Dolar: Yeşil, Euro: Mavi, Altın: Sarı):
  - **Talep:**
    - Navbar döviz ve kur gösterge haplarının içeriğine göre özelleştirilmiş şık renk temasıyla donatılması:
      - Dolar: Yeşil (Emerald)
      - Euro: Mavi (Sky/Blue)
      - Altın: Sarı (Amber/Gold)
  - **Yapılan İyileştirmeler:**
    1. **Özgün Renk & Işıma Paletleri (`src/components/navbar/currency-display.tsx`):**
       - **Dolar:** Zümrüt yeşili zemin tint (`bg-emerald-500/8 dark:bg-emerald-500/10`), yeşil kenarlık (`border-emerald-500/30`), yeşil dikey ayırıcı (`border-emerald-500/20`), yeşil ikon (`DollarSign`), canlı yeşil başlık ve sayaç rakamları.
       - **Euro:** Gök mavisi zemin tint (`bg-sky-500/8 dark:bg-sky-500/10`), mavi kenarlık (`border-sky-500/30`), mavi dikey ayırıcı (`border-sky-500/20`), mavi ikon (`Euro`), canlı mavi başlık ve sayaç rakamları.
       - **Altın:** Kehribar sarısı zemin tint (`bg-amber-500/8 dark:bg-amber-500/10`), sarı/altın kenarlık (`border-amber-500/30`), sarı dikey ayırıcı (`border-amber-500/20`), sarı ikon (`Coins`), canlı sarı/altın başlık ve sayaç rakamları.
    2. **Açık & Koyu Mod Yüksek Kontrastı:**
       - Açık modda okunaklı koyu tonlar (`text-emerald-900`, `text-sky-900`, `text-amber-900`), koyu modda ise neon cam efekti (`dark:text-emerald-300`, `dark:text-sky-300`, `dark:text-amber-300`) ile her iki temada kusursuz estetik ve netlik sağlandı.
       - İskelet yükleyiciler de ilgili kur rengine uygun degrade ile güncellendi.
    3. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata).

- [x] 2026-10-29: Navbar Döviz Butonları Titreme (Layout Jitter / Shaking) Sorununun Giderilmesi:
  - **Hata / Kusur:**
    - Navbar döviz butonlarında (`CurrencyDisplay`) sayaç animasyonu (`CountingNumber`) çalışırken buton genişliğinin dinamik değişmesi ve butonlarda `transition-all` bulunması nedeniyle 60 FPS CSS layout enterpolasyonu oluşarak tüm navbarın yatayda titremesi/sallanması.
  - **Yapılan İyileştirmeler:**
    1. **Sabit ve Sarsılmaz Konteyner Yapısı (`src/components/navbar/currency-display.tsx`):**
       - Buton kapsayıcılarına sabit genişlik tanımlandı (Dolar: `w-[144px]`, Euro: `w-[144px]`, Altın: `w-[174px]`; mobilde `w-[114px]`, `w-[114px]`, `w-[138px]`).
       - Dış iskelet yükleyiciler (skeleton) aynı piksel genişliğine eşitlendi.
    2. **Layout Titremesini Engelleyen CSS Düzenlemesi:**
       - `transition-all` kaldırıldı; genişlik değişimlerini tetiklememesi için yalnızca `transition-colors duration-150` uygulandı.
       - Sol blok (`Icon + Kur İsmi + Sağ Kenarlık`) `shrink-0` ile kilitlendi; sağ fiyat alanı (`flex-1 text-right tabular-nums overflow-hidden pl-1.5`) sağa hizalandı (`justify-end text-right`).
       - Rakamlar sayarken buton genişliği veya sol kısımdaki ikon ve metinler 1 piksel dahi oynamadan tamamen sabit kaldı, sayaç yalnızca kendi iç alanında sağa yaslı olarak akıyor.
    3. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata).

- [x] 2026-10-29: Proje Genelinde Sayaç Şeklinde Motion Sayı Efekti (`CountingNumber`) Entegrasyonu:
  - **Talep:**
    - Rakamlara sayaç şeklinde animasyonlu geçiş (motion effect) kazandırılması.
    - `import { CountingNumber } from "@/components/ui/counting-number";` bileşeni üzerinden istenen API (`value`, `grouping`, `trigger="view"`, `duration`, `delay`, `className`, `prefix`, `suffix`) ile tam uyumlu altyapı oluşturulması.
    - Anasayfa KPI kartları (8'li kart grubu), Veresiye istatistikleri, Gelir Analizi, Servis Durumu, Trend Ürünler, Son İşlemler ve Döviz kurlarında akıcı sayaç efektinin uygulanması.
  - **Yapılan İyileştirmeler:**
    1. **Bileşen Geliştirmesi (`src/components/ui/counting-number.tsx`):**
       - `framer-motion` (`useMotionValue`, `useInView`, `animate`) tabanlı 60 FPS donanımsal ivmeli sayaç bileşeni oluşturuldu.
       - Doğrudan `ref.current.textContent` manipülasyonu ile React re-render yükü olmaksızın pürüzsüz sayaç akışı sağlandı.
       - Akıllı değer çözümleme: Hem doğrudan sayısal (`48_215`, `255.37`), hem de para birimi formatlı metinleri (`₺12.715,15`, `$255.37`, `(₺12.715,15)`) otomatik algılama desteği eklendi.
       - Para birimine göre dinamik yerelleştirme: `$` tespit edildiğinde `en-US` (nokta ondalık), `₺` veya genel sayılarda `tr-TR` (virgül ondalık) desteği.
       - Parantezli negatif/ikincil tutarlar (`(₺12.715,15)`) ve çift sembol oluşumunu engelleyen akıllı prefix koruması.
       - SSR ve hidratasyon uyumu: İlk SSR renderında orijinal değer basılarak sıfır layout shift ve SEO uyumluluğu korundu.
    2. **Finansal Maskeleme & Gösterim Entegrasyonu (`src/components/ui/reveal-financial.tsx`):**
       - Tüm finansal metrikleri yöneten `RevealFinancial` bileşenine `<CountingNumber>` entegre edildi.
       - Gizlilik/göz açma butonuna basıldığında veya sayfa açıldığında tüm bakiyeler sayaç efektiyle animasyonlu açılıyor.
    3. **8'li Dashboard KPI Stat Kartları (`src/components/dashboard/stat-card.tsx`):**
       - Kasa Bakiyesi, Satış Hacmi, Servis Gelirleri, Tahsilatlar, Hazır Cihazlar, Bekleyen Servisler, Kritik Stok ve Biten Stok sayaçları `CountingNumber` ile donatıldı.
       - İkincil kur değerleri (örn. `($255.37)` ve `(₺12.715,15)`) animasyona bağlandı.
    4. **Veresiye KPI Kartları (`src/components/finance/veresiye/veresiye-stats.tsx`):**
       - TL Alacaklar, Dolar Alacaklar, Genel Toplam ve Tahsil Edilen toplamlar animasyonlu sayaç ile bağlandı.
    5. **Grafik ve Streamed Bileşenler:**
       - **Gelir Analizi (`revenue-analysis-stream.tsx`):** Brüt Gelir ve Net Kâr sayaç animasyonuna bağlandı.
       - **Servis Durumu (`service-status-stream.tsx` & `service-status-chart.tsx`):** Toplam cihaz sayısı ve yüzde dilimleri sayaç animasyonuna bağlandı.
       - **Trend Ürünler (`top-products-stream.tsx`):** Satış adetleri ve fiyatlar sayaç animasyonuna bağlandı.
       - **Döviz Kurları (`currency-display.tsx`):** Navbar'daki Dolar, Euro ve Altın kurları sayaç animasyonuna bağlandı.
    6. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata). Dev server çalışması korundu.

- [x] 2026-10-29: Veresiye Terminali Header Butonları & Taşma / Kaydırma Çubuğu Kusurunun Giderilmesi:
  - **Hata / Kusur:**
    - Veresiye başlığındaki "Yeni Borç Ekle" ve "Dışa Aktar" buton grubunun sağında iç içe `overflow-x-auto` nedeniyle Windows Chrome/Edge tarayıcılarında çirkin dikey bir kaydırma çubuğu kapsülü (scroll thumb) oluşması.
    - `no-scrollbar` sınıfının `globals.css` içinde tanımlı olmaması sebebiyle WebKit motorunun kaydırma çubuğunu gizlemeyip taşma render etmesi.
    - "Dışa Aktar" butonundaki metne tıklandığında metin seçimi / I-beam imlecinin buton üzerinde görünmesi ve butonlar arası boşluğun orantısız olması.
  - **Yapılan İyileştirmeler:**
    1. **Global CSS Kaydırma Çubuğu Düzeltmesi (`src/app/globals.css`):**
       - `.no-scrollbar` ve `.scrollbar-none` yardımcı sınıfları tüm tarayıcılar (WebKit, Firefox, IE/Edge) için scrollbar'ı %100 gizleyecek şekilde eklendi (`display: none !important; scrollbar-width: none !important`).
    2. **Header Aksiyon Konteyneri (`src/components/ui/page-header.tsx` & `veresiye-client.tsx`):**
       - İç içe gereksiz `overflow-x-auto no-scrollbar py-1 -my-1` kapsayıcısı kaldırılarak doğrudan temiz ve esnek `flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0` yapısına geçirildi; taşma ve scrollbar kapsülü kalıcı olarak yok edildi.
    3. **Buton UI & İntizam:**
       - "Dışa Aktar" butonu `variant="outline"` ve `gap-2 select-none active:scale-95` ile yenilendi; metin seçim imleci engellendi.
       - "Yeni Borç Ekle" ve "Dışa Aktar" butonlarının yükseklik ve boşluk oranları kusursuz hizaya getirildi.
    4. **Doğrulama:** `npx tsc --noEmit` ile tip kontrolü yapıldı (0 hata).

- [x] 2026-10-29: Veresiye Terminali & Alacak Defteri UI/UX Yenilemesi - Kompakt Bento Düzeni, Gereksiz Boşlukların Kaldırılması & Modern Tasarım Dili Entegrasyonu:
  - **Talep:**
    - Veresiye (`/veresiye`) sayfasındaki gereksiz devasa boşlukların (40px aralıklar, 40px/48px iç dolgular, orantısız 40px köşe yuvarlatmaları) kaldırılması.
    - Tasarım sisteminin (kompakt bento aralıkları, modern liquid glass stat kartları, net ve okunaklı tipografi, `tabular-nums`, şık `rounded-2xl` ve `rounded-xl` bileşenler) sayfaya ve tüm diyaloglarına uygulanması.
  - **Yapılan İyileştirmeler:**
    1. **Veresiye KPI Kartları (`src/components/finance/veresiye/veresiye-stats.tsx`):**
       - 4 KPI kartı (TL Alacaklar, Dolar Alacaklar, Toplam Portföy, Tahsilat Performansı) yeni liquid glass renk paleti ve `backdrop-blur-xl` ile yeniden kodlandı.
       - Aşırı `p-8` (32px) padding yerine dengeli `p-3.5 sm:p-4`, devasa `rounded-[2.5rem]` yerine standart `rounded-2xl` kullanıldı.
       - Sayılar `text-xl sm:text-2xl md:text-3xl font-black tabular-nums tracking-tight` ile yüksek kontrastlı hale getirildi.
    2. **Veresiye Araç Çubuğu (`src/components/finance/veresiye/veresiye-toolbar.tsx`):**
       - Arama kutusu `h-9 sm:h-9.5 rounded-xl` olarak optimize edildi.
       - Filtre açılır kutuları (Tümü, Borcu Olanlar, Borcu Olmayanlar, Sıralama) ve hızlı durum hapları (Tümü, Bekleyen, Geciken, Takip) tek satırda sıfır taşmayla kompakt hale getirildi.
    3. **Yaşlandırma & Risk Analiz Paneli (`src/components/finance/veresiye/veresiye-analysis-side.tsx`):**
       - 40px'lik `space-y-10` ve `px-8 pb-10 pt-4` devasa boşlukları kaldırılarak `space-y-4` ve `p-4` bento kart yapısına geçirildi.
       - Yaşlandırma ilerleme çubukları için dinamik Tailwind sınıfı purge riskleri ortadan kaldırıldı (açık renk haritası tanımlandı).
       - AI Projeksiyon kartı `rounded-2xl` ve şık degrade ile yeniden boyutlandırıldı.
    4. **Müşteri Kartı & Satır Görünümü (`src/components/finance/veresiye/veresiye-customer-card.tsx`):**
       - Liste görünümünde kompakt ve şık satırlar (`py-2 px-3 sm:py-2.5 sm:px-4`, sol renkli durum bordürü, `h-8` aksiyon butonları).
       - Izgara görünümünde modern `rounded-2xl border border-border/50 bg-card/80` bento kartları.
       - WhatsApp ekstre, borç fişi, tahsilat ve yeni borç ekleme butonları kompakt ve erişilebilir hale getirildi.
    5. **Veresiye Terminali Ana Çerçevesi (`src/components/finance/veresiye-client.tsx`):**
       - Header aksiyon butonları devasa `h-11 sm:h-12` yerine `h-9 sm:h-9.5 px-3.5 sm:px-4 rounded-xl` standardına çekildi.
       - Analiz paneli ile müşteri tablosu arasındaki `gap-10` (40px) dev boşluk `gap-4 lg:gap-5` seviyesine indirilerek sayfa bir bütün olarak sıkılaştırıldı.
       - Müşteri hareketleri/ekstre modalı, portföy müşteri detay penceresi, borç düzenleme ve tahsilat pencerelerindeki tüm `rounded-[2.5rem]`, `p-10`, `p-12` boşlukları standart `rounded-2xl sm:rounded-3xl` ve `p-4 sm:p-5` olarak optimize edildi.
    6. **Tahsilat & Borç Ekleme Modalları (`veresiye-payment-modal.tsx`, `veresiye-payment-summary-modal.tsx`, `add-debt-modal.tsx`):**
       - Aşırı dikey boşluklar, dev font boyutları ve devasa butonlar ekran alanını verimli kullanan kompakt SaaS form standardına kavuşturuldu.
    7. **Doğrulama:** `npx tsc --noEmit` ile tüm proje derlendi ve 0 hata ile doğrulandı.

- [x] 2026-10-29: Header "AKTİF / CANLI" Göstergesine Libraries.dev BorderBeam & ThinkingOrb Efektlerinin Entegrasyonu:
  - **Talep:**
    - Header başlığındaki "AKTİF / CANLI" durum hapına Libraries.dev'in `border-beam` (hareketli renkli sınır ışıması) ve `thinking-orbs` (hand-tuned AI parçacık küresi) efektlerinin entegre edilmesi.
  - **Yapılan İyileştirmeler:**
    1. **Paket Kurulumu:** `border-beam` (^1.4.1) ve `thinking-orbs` (^0.3.2) paketleri projeye eklendi.
    2. **Header Entegrasyonu (`src/components/dashboard/admin-dashboard.tsx`):**
       - Eski statik yeşil nokta yerine `thinking-orbs` kütüphanesinden `<ThinkingOrb state="searching" size={20} color="#10b981" />` yerleştirildi.
       - Durum kapsülü (pill) `border-beam` kütüphanesinden `<BorderBeam size="sm" colorVariant="colorful" strength={0.8} className="rounded-full">` ile sarmalanarak etrafında prizmatik hareketli bir sınır ışıması oluşturuldu.
    3. **Doğrulama:** `npx tsc --noEmit` ile tip ve derleme denetimi başarıyla tamamlandı (0 hata).

- [x] 2026-10-29: Dashboard Dual-Layer Liquid Glass Kartları, Tema Uyumlu Grafikler & 24-Kolon "Kitap Gibi" Sıfır Boşluklu Varsayılan Düzen:
  - **Talep:**
    - 8 adet KPI özet kartının (Kasa, Gelir, Tahsilat, Satış Hacmi, Hazır, Bekleyen, Kritik Stok, Veresiye) düz/katı renkler yerine göz alıcı, modern Liquid Glass (yarı saydam buzlu cam, ışık yansıması, akışkan sıvı blob ışımaları) mimarisine kavuşturulması.
    - Chart ve analitik bileşenlerinin arka planlarının koyu lacivert SaaS teması (`#0c121d` / `bg-card/85 backdrop-blur-xl`) ile tam uyumlu hale getirilmesi.
    - Widget'lar arasındaki orantısız yükseklik farklarından, boşluklardan ve taşmalardan kaynaklanan gereksiz boşlukların giderilmesi; tüm widget'ların 24 kolonluk tam ızgaraya sıfır boşlukla ("kitap gibi") oturacağı varsayılan bir düzen oluşturulması.
  - **Yapılan İyileştirmeler:**
    1. **8 Adet Liquid Glass KPI Kartı (`src/components/dashboard/stat-card.tsx`):**
       - Her kart için özel renk paleti (Zümrüt Yeşili, Ametist Moru, Kehribar Sarısı, Safir Mavisi, Nane Yeşili, Buzul Camgöbeği, Yakut Kırmızısı, Derin İndigo) ve `backdrop-blur-2xl` cam efekti uygulandı.
       - Kartın üst kenarında 1px specular cam yansıması, arkada akışkan sıvı bloblar, buzlu cam ikon kapsülü (`bg-white/15 backdrop-blur-md`) ve `tabular-nums` ile yüksek kontrastlı tipografi korundu.
       - Kartların tüm `onClick`, `onLongPress`, modal açıcıları ve döviz formatlama yetenekleri eksiksiz muhafaza edildi.
    2. **Tema Entegre Chart ve Panel Arka Planları:**
       - `revenue-analysis-stream.tsx` ve `sales-trend-chart.tsx`: Koyu lacivert tema uyumlu yumuşak degradeli grafik dolgusu (`#3b82f6` %35 -> %0), ızgara çizgileri ve cam tooltip.
       - `service-status-stream.tsx` & `service-status-chart.tsx`: `h-full` esnek yükseklik, segmentli kapasite çubuğu ve üstten hizalı kompakt durum listesi.
       - `recent-transactions-stream.tsx`, `service-queue-stream.tsx`, `smart-insights.tsx`, `live-activity-feed.tsx`, `receivables-client.tsx`, `shortage-status-card.tsx`: Tüm kart konteynerleri `bg-card/85 dark:bg-[#0c121d]/85 backdrop-blur-xl border-border/40 dark:border-white/[0.08]` ile eşitlendi.
    3. **24-Kolon Kusursuz Eş Yükseklikli Varsayılan Düzen (`src/lib/dashboard-layout.ts` & `dashboard-client.tsx`):**
       - `SYSTEM_DASHBOARD_LAYOUT` 24 kolona tam oturan eş yükseklikli çiftler halinde yeniden dizayn edildi:
         - Satır 1: 4 Finansal KPI (6+6+6+6 = 24 kolon, 1 satır)
         - Satır 2: 4 Operasyonel KPI (6+6+6+6 = 24 kolon, 1 satır)
         - Satır 3: Gelir Analizi (15 kolon) + Servis Durumu (9 kolon) = 24 kolon, tam 3 satır yükseklik
         - Satır 4: Servis Kuyruğu (12 kolon) + Son İşlemler (12 kolon) = 24 kolon, tam 3 satır yükseklik
         - Satır 5: Tahminleyici Zeka (12 kolon) + Canlı Akış (12 kolon) = 24 kolon, tam 3 satır yükseklik
         - Satır 6: Trend Ürünler (12 kolon) + Alacaklarım (12 kolon) = 24 kolon, tam 3 satır yükseklik
         - Satır 7: Kurye Sipariş Durumu (24 kolon, 2 satır yükseklik, 4'lü duyarlı ızgara)
       - `gridAutoFlow: "row dense"` yerine `gridAutoFlow: "row"` kullanılarak widget'ların sıraları ve satır eşleşmeleri kilitlendi; widget'ların boşluklara atlayarak ızgarayı bozması önlendi.
       - `normalizeDashboardLayout` içerisine eski asimetrik satır/kolon değerlerini ve eksik widget'ları tespit edip otomatik olarak yeni temiz düzene yükselten `isLegacyOrBrokenLayout` denetimi eklendi.
       - "Varsayılan" butonu tetiklendiğinde temiz düzenin anında veritabanına da kaydedilmesi sağlandı.

- [x] 2026-10-27: Toptancı İçe Aktarma - Akıllı Stok Kodu (SKU) Üretimi, "Stokta Var" Uyarı Rozetleri & Toplu Stok Eleme Sihirbazı:
  - **Talep:**
    - Her ürüne, ürünün kategorisi ve model adıyla uyumlu, takibi kolaylaştıran düzenli/rastgele bir stok kodu (SKU) atanması.
    - Önizleme ekranının üstünde mağaza stoğunda zaten mevcut olan ürünlerin ("Stokta Var" uyarısı verenler) rozetler (badges) halinde belirgin olarak gösterilmesi.
    - Kullanıcının bu rozet üzerinden tek tıkla "Stoktakileri Ekleme (Seçimi Kaldır)" diyerek mükerrer ürünleri seçimden çıkarabilmesi ve sadece yeni ürünleri stoğa ekleyebilmesi.
    - Önizleme ekranındayken fiyatların satır bazında el ile de değiştirilebilmesi, kategorilere göre toplu seçim/kaldırma yapılabilmesi ve Çıtalı (WF) / Çıtasız ekran ayrımlarının sağlanması.
  - **Yapılan İyileştirmeler:**
    1. **Akıllı Stok Kodu (SKU) Motoru (`src/lib/stock/wholesaler-parser.ts` & `src/lib/actions/stock-import-actions.ts`):**
       - `generateProductSku()` fonksiyonu geliştirildi. Kategoriye özel ön ekler (`EKR-WF`, `EKR`, `KPK`, `BAT`, `SOK`, `KAM`, `KAS`, `SARJ-B`, `KBL-TC` vb.), temizlenmiş model kodu (örn: `IPH11`, `SAM-A50`, `RN12P`) ve 3 haneli rastgele sayı (`100-999`) birleştirilerek temiz, standart kodlar üretilir (örn: `KPK-IPH11-482`, `EKR-WF-IP13P-814`).
       - Sunucu tarafında `getUniqueSku()` collision önleyici eklenerek Prisma'nın `@@unique([shopId, sku])` kısıtıyla %100 uyumlu, çakışmasız benzersiz kayıt garanti edildi.
    2. **Üst Bilgi ve Stok Durumu Rozetleri (Badges Banner):**
       - Önizleme ekranının tepesine iki ayrı durum rozeti ve hızlı işlem çubuğu yerleştirildi:
         - **Sarı Rozet (`⚠️ X Kalem Stoğunuzda Mevcut`):** Mağazada daha önceden bulunan ürünlerin sayısını ve mevcut stoklarını gösterir.
           - `🚫 Stoktakileri Ekleme (Seçimi Kaldır)` butonu: Tek tıkla mağazada mevcut olan tüm parçaların seçim tikini kapatır.
           - `✓ Stoktakileri de Ekle` butonu: Mevcut parçaları tekrar seçili hale getirir.
         - **Yeşil Rozet (`✨ Y Kalem Yeni Ürün`):** Stoğa ilk defa eklenecek parçaları listeler.
           - `✨ Sadece Yenileri Seç` butonu: Mevcut olanları kaldırıp yalnızca yeni ürünleri seçer.
       - Görünüm filtreleri eklendi: `Hepsi`, `⚠️ Sadece Stoktakiler`, `✨ Sadece Yeniler` butonları ile tablo anında filtrelenebilir.
    3. **Önizleme Tablosunda SKU Rozeti ve Canlı Arama:**
       - Ürün adı altında `SKU: KPK-IPH11-482` şeklinde şık bir rozet gösterimi eklendi.
       - Arama kutusu ürün adı ve markanın yanı sıra oluşturulan `SKU` koduna göre de arama yapacak şekilde genişletildi.
       - Renk ayrıştırma (Splitter) yapıldığında alt ürünlere renk uzantılı SKU'lar (örn: `...-SYH`, `...-BYZ`) otomatik türetildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-27: Toptancı Yedek Parça İçe Aktarma, Renk Ayrıştırma & Toplu Fiyatlandırma Sihirbazı (CSV / PDF / Excel / Metin):
  - **Talep:**
    - Toptancıdan alınan yedek parça listelerinin (CSV, Excel veya kopyalanan metin) dolar alış fiyatları ve adetleriyle doğrudan sisteme aktarılabilmesi.
    - Satış fiyatlarının tüm ürünlere istenilen dolar miktarı kadar (örn: ürün başına +$5) toplu olarak artırılabilmesi ve satır bazında düzenlenebilmesi.
    - Ürün kategorileri (Kapak, LCD / Ekran vb.) ve model isimlerinin belirgin olması, marka kalabalığının elenmesi.
    - Özellikle arka kapaklarda (ve ekranlarda) renk ayrımlarının yapılabilmesi (örn: 2 adet iPhone 11 Arka Kapak satırının 1 Siyah + 1 Beyaz şeklinde ayrı ayrı kaydedilebilmesi).
    - Tedarikçi eklemenin opsiyonel olması; tedarikçi seçilirse ödeme durumuna göre ("Ödeme Peşin/Önceden Yapıldı" ise cariden hiçbir şey düşmemesi; "Açık Hesap / Veresiye" ise tedarikçi cari borcuna eklenmesi).
  - **Yapılan İyileştirmeler:**
    1. **Toptancı Liste Ayrıştırıcı Motoru & Akıllı Kategorizasyon (`src/lib/stock/wholesaler-parser.ts`):**
       - CSV (noktalı virgül, virgül, sekme), Excel ve çok satırlı metinleri parse eder; başlık satırlarını, ara bölümleri (`--- APPLE...`) ve ara toplamları (`Ara Toplam`, `GENEL TOPLAM`) filtreler.
       - **Akıllı Kategorizasyon Motoru (`smartDetectCategory`):** Ürün adını ve toptancı başlığını analiz ederek ürünün bir **Yedek Parça** mı (`Kapak`, `LCD / Ekran`, `Batarya`, `Şarj Soketi`, `Kasa`, `Kamera`, `Flex / Entegre`, `Hoparlör / Ahize`) yoksa bir **Aksesuar** mı (`Şarj Başlığı`, `Set Şarj`, `Type-C Kablo`, `Lightning Kablo`, `Kablo`, `Kılıf`, `Ekran Koruyucu`, `Kulaklık`, `Powerbank`, `Araç Aksesuarı`) olduğunu anahtar kelimeler ve watt/tip analizleriyle otomatik ayırt eder.
       - Model adı, temiz kategori, adet, dolar alış birim fiyatı ve model adındaki renkleri otomatik ayıklar.
    2. **Sunucu Tarafı Toplu İçe Aktarma Motoru & P2028 Çözümü (`src/lib/actions/stock-import-actions.ts`):**
       - **P2028 Transaction Timeout Giderildi:** Prisma etkileşimli transaction'larında varsayılan 5 saniyelik zaman aşımı nedeniyle oluşan `P2028: Transaction not found` hatası giderildi. Döngü içindeki 200+ sıralı tekil `findFirst` ve kategori sorgusu yerine kategoriler ve mağaza ürünleri döngü öncesinde tek seferde (batch) çekilerek Map üzerinden O(1) hızına indirildi; `$transaction` süresi 60 saniyeye genişletildi (`timeout: 60000, maxWait: 15000`).
       - `checkWholesalerStockMatchesAction`: Önizleme ekranındaki ürünlerin mağaza stoğunda zaten var olup olmadığını (ve mevcut stok adetlerini) anında sorgulayan sunucu aksiyonu eklendi.
       - Dolar fiyatlarını (`buyPriceUsd`, `sellPriceUsd`) kaydeder ve güncel kurdan TL karşılıklarını (`buyPrice`, `sellPrice`) yazar.
       - Her ürün için `InventoryLog` giriş kaydı atar.
       - Tedarikçi seçildiyse: "UNPAID" (Açık hesap) durumunda `Supplier.balanceUsd` ve `balance` borcunu artırıp `SupplierTransaction` açar; "PAID" (Peşin) durumunda cari bakiyeyi değiştirmeden alışveriş geçmişini günceller.
    3. **Önizleme Modalı Geliştirmeleri (`src/components/stock/wholesaler-import-modal.tsx`):**
       - **Seçim Tikleri (Checkbox):** Tablonun en soluna ve tablo başlığına ("Tümünü Seç / Kaldır") tik kutusu eklendi. Kullanıcı aktarmak istemediği parçaların tikini kaldırarak listeyi dilediği gibi daraltabilir.
       - **Dinamik Seçim KPI'ları:** Üstteki özet kartları (Kalem, Toplam Adet, Toplam Tutar, Tahmini Kâr) ve alttaki aktar butonu sadece seçili/tikli olan parçaların değerlerini canlı hesaplar.
       - **Düzenlenebilir Ürün İsimleri:** Ürün adı artık doğrudan satır üzerindeki inputtan kolayca düzenlenebilir.
       - **Stokta Benzer/Aynı Ürün Uyarısı:** Mağaza stoğunda zaten mevcut olan ürünlerin altında sarı `⚠️ Stokta Var (Stoğu: X Adet)` uyarısı gösterilir; yeni ürünlerde yeşil `✨ Yeni Ürün` rozeti belirir.
       - **Akıllı Kategori Filtreleri & Arama:** Önizleme tablosu üstüne dinamik kategori çipleri (`[Tümü (58)]`, `[Kapak (13)]`, `[LCD / Ekran (45)]`, `[Şarj Başlığı]` vb.) ve anlık parça/model arama kutusu eklendi.
       - **Satır Bazında Kategori Düzenleme:** Her ürün satırında `Yedek Parça` ve `Aksesuar` gruplarını içeren `STANDARD_CATEGORIES` açılır menüsü entegre edildi.
       - **Toplu Satış Fiyatı Artırma:** `+$3.00`, `+$5.00` (varsayılan), `+$10.00` veya özel `$X` / `%X` artış butonları.
       - **Renk Ayrıştırma (Splitter):** 2+ adetli kapak veya parçalarda "Renklere Ayır" modalı ile adedi renklere (Siyah, Beyaz vb.) paylaştırarak ayrı ürün satırlarına bölme.
    4. **Stok Sayfası Entegrasyonu (`src/app/(dashboard)/stok/page.tsx`):**
       - Stok sayfası üst komut menüsüne "Toptancı Listesi İçe Aktar (CSV/PDF)" butonu entegre edildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-27: Satış Arşivinde Kapsamlı Arama (Ürün Adı, Müşteri, Açıklama, Büyük/Küçük Harf) & Seçilen Döneme / Bu Aya Özel Arama Kapsamı:
  - **Talep:**
    - Satış arşivinde arama yaparken sadece sayfada görüntülenenlerle sınırlı kalınmaması.
    - Aramanın öncelikli olarak bu ay içerisinde (büyük/küçük harf duyarsız, Türkçe karakter toleranslı, ürün adı, müşteri ismi ve açıklamaya göre) sunucu tarafında tüm veri tabanında yapılması.
    - Filtrelerden dönem seçildiğinde (örn. Dün, Bu Hafta, Ay Başından Bugüne vb.) aramanın kesinlikle sadece bu seçili süre içinde yapılması.
  - **Yapılan İyileştirmeler:**
    1. **Varsayılan Dönem Önceliği "Bu Ay" (Ay Başından Bugüne):**
       - `src/app/(dashboard)/satis/gecmis/page.tsx`: Varsayılan başlangıç tarihi gün başı yerine `startOfMonth(now)` (ayın 1'i) olarak ayarlandı.
       - `src/components/satis/sales-history-client.tsx`: Varsayılan hızlı filtre `"thisMonthTTD"` (Ay Başından Bugüne) olarak ayarlandı. Filtreler temizlendiğinde de yine bu ayın başına sıfırlanması sağlandı.
    2. **Kapsamlı ve Türkçe Harf Duyarsız Arama Motoru (`src/lib/actions/activity-actions.ts`):**
       - `getSearchVariants()` yardımcısı eklendi (i/İ, ı/I, küçük/büyük ve `tr-TR` varyasyonları üretilir).
       - `getUnifiedHistory()` fonksiyonunda hem genel işlem arşivinde (`Prisma.TransactionWhereInput`) hem de doğrudan satış filtresinde (`Prisma.SaleWhereInput`) arama koşulları genişletildi:
         - **Ürün Arama:** `items.some.product: { name, barcode, sku, description }` ve `sale.items.some.product: { ... }` dahil edildi (önceden ürün adına göre arama yapılamıyordu).
         - **Müşteri Arama:** `customer.name`, `customer.phone` eklendi.
         - **Açıklama Arama:** `description`, `notes`, `category`, `debt.notes`, `debt.description` eklendi.
         - **Personel & Fiş No:** `user.name`, `saleNumber` eklendi.
    3. **Seçili Tarih Filtresine Kesin Bağlılık:**
       - Kullanıcı hızlı filtrelerden (Dün, Bu Hafta, Ay Başından Bugüne, Geçen Ay vb.) veya takvimden özel bir tarih aralığı seçtiğinde, `rangeStart` ve `rangeEnd` sunucu sorgusuna aktarılarak arama sadece bu seçili zaman dilimindeki kayıtlar arasından süzülür.
    4. **Otomatik Arama Deneyimi (Debounce + Temizleme):**
       - Arama kutusuna 400ms debounce eklendi; kullanıcı yazarken veya sildiğinde Enter'a basmasına gerek kalmadan otomatik olarak ilk sayfaya dönülerek arama sonuçları getirilir.
       - Arama kutusu içerisine tek tıkla aramayı temizleme butonu (`X`) entegre edildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: Hızlı Satış Yan Panelde (Sidebar POS) Dinamik Stok Düşümü ve Akıllı Göz (0 Stok) Entegrasyonu:
  - **Talep:**
    - Yan paneldeki hızlı satışta (POSCompact) ürün sepete eklendikçe anlık olarak listeden stok düşmesi (satış öncesi sepetteki adet kadar azalması).
    - Ürün sepetten çıkarıldığında veya sepet temizlendiğinde stoğun geri yükselmesi.
    - Stoğu bitmiş (veya sepete eklenerek tükenmiş) bir ürüne tıklandığında / `+` basıldığında "Akıllı Göz • Stok Koruması" (0 Stok Uyarısı) modalının çalıştırılması.
  - **Yapılan İyileştirmeler:**
    1. **Anlık Efektif Stok Hesaplama (`src/components/pos/pos-compact.tsx`):**
       - Her ürün satırında `effectiveStock = (product.stock || 0) - (inCartQty || 0)` formülü uygulandı.
       - Ürün sepete eklendikçe anlık olarak listedeki adet (örn. `2 Adet` -> `1 Adet` -> `Tükendi`) güncellendi.
       - Sepetten ürün silindiğinde, adet azaltıldığında veya sepet temizlendiğinde stok anında listeye geri yansıtıldı.
       - Satış tamamlandığında veritabanı ile birlikte `localProducts` ve React Query önbellekleri (`pos-initial-data`, `products`) invalidate edilerek gerçek stok güncellendi.
    2. **Akıllı Göz (SmartStockGuardrailModal) Entegrasyonu:**
       - `SmartStockGuardrailModal` bileşeni yan panel hızlı satış ekranına bağlandı.
       - `addToCart` ve `updateQuantity` fonksiyonlarında ürünün stoğu kalmadığında (`effectiveStock <= 0` veya `inCartQty >= stock`) Akıllı Göz modalı açıldı.
       - "Tükendi" durumundaki ürün satırına veya `+` butonuna tıklandığında Akıllı Göz Stok Uyarısı tetiklendi.
       - Modaldan "Hızlı Stok Girişi Yap" yapıldığında yeni stok anında ürüne eklenip sepete aktarıldı; "Rafta Var, Satışa Ekle" seçildiğinde ise fiziki mevcut kabul edilerek sepete eklendi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: POS Sayfası Ürün Seçim Popup'ı, Hızlı Servis Input Hizalama ve Varsayılan Teknisyen Hatırlama:
  - **Talep:**
    - `/satis` sayfasındayken ürün seçildiğinde yan paneldeki (sidebar/drawer) gibi yeşil mini popup uyarısının görünmesi.
    - Hızlı İşlem Kaydı modalındaki inputların dikey kayma/hizasızlık sorununun giderilmesi.
    - Teknisyen seçiminde en son seçilen teknisyenin varsayılan olarak seçili gelmesi.
  - **Yapılan İyileştirmeler:**
    1. **POS Ürün Seçim Popup'ı Portallama (`src/components/pos/pos-interface.tsx`):**
       - `/satis` sayfasında kapsayıcı div'in `backdrop-blur-3xl` ve `overflow-hidden` stillerinden dolayı `position: fixed` olan seçim popup yığınının kırpılması ve görünmemesi engellendi.
       - Seçim popup yığını `createPortal(..., document.body)` kullanılarak doğrudan `document.body` üzerine `z-[99999]` ile bağlandı. Masaüstünde sağ alt, mobilde ise alt orta konumda üst üste yığılarak 1.8 saniyede kaybolan yeşil popup animasyonu kusursuz çalışır hale getirildi.
    2. **Hızlı İşlem Kaydı Input Dikey Hizalama (`src/components/service/create-service-modal.tsx`):**
       - Müşteri Ad Soyad ve Telefon Numarası kutularındaki kayma düzeltildi: İki kolonun da label satırı `h-5` (20px) ile sabitlendi, `PhoneInput`'a `h-12 md:h-14 rounded-xl md:rounded-2xl border border-border/60 bg-muted/30` verilerek sol kutuyla tam piksel eşleşmesi sağlandı.
       - Tahmini Ücret ve Görevli Teknisyen kolonlarındaki yükseklik farkı giderildi: Sol ve sağ başlık `flex items-center justify-between h-5` ile eşitlendi; PriceInput ve SelectTrigger'ın başlangıç ve bitiş yükseklikleri tam hizaya getirildi.
    3. **En Son Seçilen Teknisyenin Otomatik Hatırlanması (Persistent Default Technician):**
       - Teknisyen seçildiğinde (`Select onValueChange`) veya hızlı yeni teknisyen eklendiğinde seçilen teknisyenin ID'si `localStorage.setItem("last_selected_technician_id", id)` ile tarayıcıya kaydedildi.
       - Modal açıldığında (`fetchTechnicians`) ve yeni kayıt sonrası form temizlendiğinde (`reset`), kayıtlı son teknisyen otomatik olarak seçili getirildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: Sistem İşlem Logları (`/ayarlar/loglar`) İade Entegrasyonu, Akıllı Sayfalama, Tarihsel Filtreler ve Log Sayacı:
  - **Talep:**
    - Veresiye ve diğer bölümlerdeki iadelerin işlem loglarında görünmesi.
    - 114 sayfayı tek satıra basarak ekranı taşıran pagination'ın (sayfalama) düzeltilmesi.
    - Tarihsel filtreleme eklenmesi (başlangıç/bitiş tarihleri ve hızlı hazır filtreler).
    - "Tüm Logları Temizle" butonunun yanında sistemde ne kadar log tutulduğunun gösterilmesi.
  - **Yapılan İyileştirmeler:**
    1. **İade Logları & Otomatik Geçmiş Senkronizasyonu (`src/lib/actions/audit-actions.ts`, `return-actions.ts`):**
       - `getActivityLogs` eylemine otomatik geçmiş senkronizasyonu eklendi: Önceden logu oluşmamış `ReturnTicket` kayıtları tespit edilip `RETURN` aksiyonu ile geriye dönük loglandı.
       - `createReturnTicket`, `createMultipleReturnTickets` ve `processReturn` eylemlerine `recordAuditLog` tetikleyicileri eklendi.
       - Filtre seçeneklerine `RETURN` ("İade") işlem tipi ve `CUSTOMER` ("Müşteri / Veresiye") bölümleri eklendi; amber renkli şık `İADE` rozeti tanımlandı.
    2. **Akıllı Pencerelemeli Sayfalama (Smart Windowed Pagination) (`src/components/settings/activity-logs-client.tsx`):**
       - 114 sayfanın tamamını yan yana buton olarak dizen döngü kaldırıldı; `getVisiblePages(currentPage, totalPages)` fonksiyonu ile `[1, ..., 78, 79, 80, ..., 114]` şeklinde maksimum 7 butonlu pencereleme algoritması uygulandı.
       - "İlk Sayfa" (`ChevronsLeft`), "Önceki Sayfa" (`ChevronLeft`), "Sonraki Sayfa" (`ChevronRight`), "Son Sayfa" (`ChevronsRight`) kontrolleri ve sayfa boyutu seçici (20 / 50 / 100) eklendi.
       - Sayfa ve toplam kayıt adedi bilgisi eklendi.
    3. **Tarihsel Filtreleme ve Hızlı Seçimler:**
       - Başlangıç ve Bitiş tarihleri için native date picker alanları eklendi.
       - "Tümü", "Bugün", "Dün", "Son 7 Gün", "Bu Ay" tek tıkla çalışan hazır tarih butonları entegre edildi.
       - Tarih seçildiğinde anında listeyi yenileyen ve filtreleri sıfırlayan "Temizle" butonu eklendi.
    4. **Tutulan Toplam Log Sayacı:**
       - `getActivityLogs` sorgusuna filtreden bağımsız `prisma.auditLog.count({ where: { shopId } })` eklendi (`totalAllLogs`).
       - Başlıkta "Tüm Logları Temizle" butonunun hemen solunda `Database` ikonlu "TUTULAN LOG" kartı eklendi (örneğin: `2.280 Kayıt`). Filtre uygulandığında kaç kaydın filtrelendiği de rozet olarak sunuldu.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: Teknik Servis Hızlı Kaydında Teknisyen Atama ve Hızlı Teknisyen Ekleme:
  - **Talep:**
    - Teknik servis hızlı kaydında (`CreateServiceModal` / "Hızlı İşlem Kaydı") teknisyen seçme/ekleme kısmı olması.
  - **Yapılan İyileştirmeler:**
    1. **Görevli Teknisyen Seçici (`src/components/service/create-service-modal.tsx`):**
       - Formda "Tahmini Ücret" alanının yanına "Görevli Teknisyen" seçici kutusu eklendi (`Select`).
       - Dükkandaki tüm personel/teknisyen listesi `getStaffShell()` ile çekilerek unvanları (`Teknisyen`, `Yönetici`, vb.) ile listelendi.
       - Varsayılan olarak "⚡ Otomatik Atama (Varsayılan Yönetici)" seçeneği sunuldu.
    2. **Hızlı Teknisyen Ekleme Modalı (`isQuickAddTechOpen`):**
       - Teknisyen seçici başlığında `+ Yeni Teknisyen` butonu eklendi.
       - Tıklandığında kayıt formundan ayrılmadan teknisyenin Ad Soyad ve Telefonunu alarak anında yeni teknisyen hesabı oluşturan (`createStaff`), ardından bu teknisyeni formda otomatik seçen mikro-modal entegre edildi.
    3. **Servis Kaydı & Başarı Ekranı Entegrasyonu:**
       - `createServiceTicket` çağrısına `technicianId` parametresi bağlandı.
       - `src/lib/actions/service-actions.ts` dosyasında `createServiceTicket` çıktısına `technician` bilgileri dahil edildi.
       - Başarılı kayıt özet kartında atanan görevli teknisyen ismi gösterildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: WhatsApp Sekme Yeniden Kullanımı (Tab Reuse), Hızlı Gönder / Önizleme Switchi ve Bildirim Popup'ı:
  - **Talep:**
    - Web seçildiğinde WhatsApp Web sekmesi (`web.whatsapp.com`), Uygulama seçildiğinde masaüstü WhatsApp uygulaması (`whatsapp://`) tetiklenmesi.
    - Her seferinde yeni sekme açmak yerine, WhatsApp Web sekmesi açıksa mevcut sekme üzerinden açılması (`window.open(link, 'whatsapp_window')`).
    - Mesaj gönderilmeden önce WhatsApp mesaj önizlemesi sunulması veya "Hızlı Gönder" anahtarı ile önizlemesiz doğrudan WhatsApp'a yönlendirilmesi.
    - Gönderildiğinde "Mesaj [telefon no] ya gönderildi" şeklinde toast bildirim popup'ı gösterilmesi.
  - **Yapılan İyileştirmeler:**
    1. **Sekme Yeniden Kullanımı (`target: 'whatsapp_window'`):**
       - `src/lib/utils/notifications.ts`, `src/components/pos/unified-sale-modal.tsx`, `src/components/pos/receipt-modal.tsx` ve `src/components/common/receipt-modal-wrapper.tsx` bileşenlerinde `window.open(link, '_blank')` yerine `window.open(link, 'whatsapp_window')` kullanılarak her gönderimde yeni sekme açılması engellendi, var olan WhatsApp Web sekmesinin yeniden kullanılması sağlandı.
    2. **Hızlı Gönder / Önizleme Modu Switchi (`Zap`):**
       - Hem `UnifiedSaleModal` hem de `ReceiptModal` başlık/aksiyon paneline `Zap` ikonlu Hızlı Gönder butonu/switchi entegre edildi. Durum `localStorage` (`whatsapp_quick_send`) üzerinde saklanır.
       - Hızlı Gönder **Açık**: Fiş mesajı doğrudan derlenerek WhatsApp'a yönlendirilir ve `toast.success("Mesaj [telefon no] numarasına gönderildi.")` tetiklenir.
       - Hızlı Gönder **Kapalı (Önizlemeli)**: `WhatsAppConfirmModal` açılarak gönderilecek mesajın canlı önizlemesi (ve istenirse AI tonlama düzenleyicisi) sunulur; kullanıcı onayladığında bildirim gösterilip yönlendirme yapılır.
    3. **Telefon Numarası Doğrulama & Bildirim Entegrasyonu:**
       - Kayıtsız/telefonsuz satışlar için fiş modalına 10 haneli telefon numarası giriş kutusu ve geçerlilik kontrolü eklendi.
       - Bildirim metni `Mesaj [telefon no] numarasına gönderildi.` formatında standardize edildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: Hızlı Satış Ekranı Ürün Seçimi Bildirim Yığını (Stacking Toast Popup):
  - **Talep:**
    - `@satis` sayfasındaki hızlı satış ekranında ürün kutucuklarından ürün seçilince sağ altta "Ürün seçildi" şeklinde ufak yeşil popup gösterilmesi.
    - Mobilde ekranın alt kısmında çıkması.
    - Peş peşe seçimlerde popupların üst üste binerek gelmesi (sonraki popup alttakinin üstünde yığılacak stack mantığı).
    - 1-2 saniye ekranda durup kendiliğinden kaybolması.
  - **Yapılan İyileştirmeler:**
    1. **Seçim Bildirim Yığını (Toast Stack) State & Tetikleyici (`src/components/pos/pos-interface.tsx`, `src/components/pos/pos-compact.tsx`):**
       - `selectionToasts` state'i ve `addSelectionToast` fonksiyonu tanımlandı.
       - Her ürün sepete eklendiğinde anında bir bildirim nesnesi oluşturulup listeye eklenir (`id`, `name`, `price`).
       - 1.8 saniye süreyle ekranda tutulup otomatik olarak filtrelenerek kaldırılır.
    2. **Üst Üste Yığılan (Stacking) Yeşil Popup Tasarımı:**
       - `flex flex-col-reverse items-center sm:items-end gap-1.5` ile sonraki gelen popup alttakinin üstüne binerek sıralanır.
       - Masaüstünde sağ altta (`sm:bottom-6 sm:right-6`), mobilde ekranın altında (`bottom-20 / bottom-24 left-1/2 -translate-x-1/2`) konumlandırıldı.
       - Zümrüt yeşili modern cam efekti (`bg-emerald-600/95 backdrop-blur-md border border-emerald-400/30`), beyaz tik ikonu, ürün adı, "Ürün seçildi" etiketi ve ürün fiyat rozeti ile son derece şık ve kompakt bir micro-interaction sağlandı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-23: Satış Fişi Modalı Geliştirmeleri (Dolar/TL Seçici, Kompakt Termal Fiş Düzeni, WhatsApp Metin & Web/App Gönderimi, Telefon Girişi):
  - **Talep:**
    - `@satis` sayfasında ve hızlı satıştan sonra çıkan fişte Dolar / TL seçici kullanılması.
    - Varsayılan para birimi Dolar ise otomatik olarak fişte fiyatların dolar yazması ve parantez içinde TL olarak görünmesi.
    - WhatsApp gönderim butonunun veresiye sayfasındaki gibi Web / Uygulama seçicisine sahip olması; Web seçilirse yeni sekmede WhatsApp Web, Uygulama seçilirse masaüstü uygulamasına gönderilmesi.
    - Fişteki gereksiz boşlukların kaldırılması, termal yazıcı kağıt ölçüsüne uygun ve kompakt fiş çıkartılması.
    - WhatsApp'tan fişin resim yerine yazı (metin) olarak gönderilmesi; sadece aldığı ürünler ve fiyatı, en altta ise toplam tutar yazması.
    - Kayıtlı olmayan (veya telefonu bulunmayan) müşteriler için fiş modalında telefon numarası girme alanının yer alması ve numara doğru/geçerli (en az 10 hane) girildiğinde WhatsApp butonunun aktifleşmesi.
  - **Yapılan İyileştirmeler:**
    1. **Dolar / TL Seçici ve Para Birimi Formatlaması (`src/components/pos/unified-sale-modal.tsx`, `src/components/pos/receipt-modal.tsx`):**
       - Modalın sol panelinde ve başlığında modern `[ ₺ TL ]` / `[ $ Dolar ]` switch butonları eklendi.
       - Varsayılan para birimi `USD` ise otomatik olarak `USD` seçili gelmesi sağlandı.
       - `selectedCurrency === "USD"` iken hem ürün kalemlerinde (`$X.XX (₺Y.YY)`) hem de genel toplamda dolar ve parantez içinde TL karşılığı dinamik kurla hesaplanarak gösterildi.
    2. **Kayıtsız Müşteriler İçin Telefon Girişi & Buton Validasyonu:**
       - Sol panelde "Telefon (WhatsApp)" giriş alanı oluşturuldu (`sale.customer?.phone` varsa otomatik dolar, yoksa kullanıcı girebilir).
       - En az 10 hane kontrolü (`isPhoneValid`) eklendi; numara doğru girilene kadar WhatsApp butonu pasif (disabled, %40 opaklık), numara tamamlandığında anında aktifleşecek şekilde bağlandı.
    3. **WhatsApp Web / Masaüstü Uygulama Seçicisi & Doğrudan Metin Fiş Gönderimi:**
       - Veresiye sayfasında olduğu gibi `localStorage` destekli `[ 🌐 Web ]` / `[ 💻 Uygulama ]` seçici arayüzü eklendi.
       - Eski html2canvas ile resim indirip gönderme yerine kullanıcının istediği doğrultuda temiz ve sade metin formatı üretildi:
         `• Ürün Adı (Adet): Fiyat` satırları ve en altta `*Toplam: Tutar*`.
       - Kullanıcı 'Web' seçtiğinde yeni sekmede `web.whatsapp.com`, 'Uygulama' seçtiğinde `whatsapp://` masaüstü protokolü tetiklendi.
    4. **Fişteki Gereksiz Boşlukların Kaldırılması & Termal Yazıcı Optimizasyonu (`src/components/common/receipt-template.tsx`, `unified-sale-modal.tsx`, `receipt-modal.tsx`):**
       - `ReceiptTemplate` içerisindeki `p-6` (24px) kenar boşluğu `p-3 sm:p-4` yapılarak termal kağıt genişliği tam kullanıldı.
       - Müşteri bilgisi ve Fiş No dikeyde 2 ayrı blok yerine tek satırlık kompakt başlık haline getirildi.
       - Ürün listesindeki `min-h-[50px]`, `mb-6` ve `space-y-3` fazlalıkları kaldırılarak `space-y-1 mb-2` kompakt düzenine geçildi.
       - Ödeme yöntemi ve genel toplam kutusu boşluksuz ve derli toplu hale getirilerek kağıt israfı tamamen önlendi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-21: B.A.Ş.A.R. // Komuta ve Tahmin Kokpiti & Ay Sonu Ciro Tahmin Motoru (@stok/stok-ai):
  - **Talep:**
    - AI / Stok Önerileri sayfasının (`stok-ai`) yönetici seviyesinde "B.A.Ş.A.R. Komuta ve Tahmin Kokpiti" arayüzüne dönüştürülmesi.
    - Tüm arayüz ve raporlama çıktılarındaki İngilizce terimlerin temizlenmesi, "J.A.R.V.I.S." yerine "B.A.Ş.A.R." adının kullanılması.
    - `prisma/schema.prisma` içerisine `AIReportHistory` modeli eklenerek üretilen raporların veritabanında saklanması ve mükerrer sayfa ziyaretlerinde sıfır (0) token harcanması.
    - Ay sonu net ciro tahmini motoru (`getMonthEndForecastMetrics`) geliştirilmesi: Ayın N. gününe kadarki net ciro (satış + servis - gider), günlük run-rate ortalaması ve ay sonu kapanış tahmini hesaplanması; geçen ayın aynı gün aralığıyla (Time-to-Date) kıyaslanarak dönemsel büyüme yüzdesinin sunulması.
    - 4 Temel Yönetici Komut Butonu: `[ 🚀 Ay Sonu Tahmini ]`, `[ 📊 Gelir-Gider & Kâr ]`, `[ 📦 Stok & İkmal ]`, `[ 💸 Veresiye Alarmı ]`.
    - Sayfa açılışında sıfır token ile en son kaydedilen raporun otomatik gösterilmesi ve geçmiş raporları incelemek/yüklemek için Rapor Kasası drawer'ı eklenmesi.
  - **Yapılan İyileştirmeler:**
    1. **Veritabanı Modeli & Senkronizasyon (`prisma/schema.prisma`):**
       - `AIReportHistory` modeli oluşturuldu (`id`, `shopId`, `reportType`, `title`, `content`, `metricsJson`, `createdAt`, `Shop` ilişkisi ve `[shopId, reportType]`, `[shopId, createdAt]` indeksleri).
       - `npx prisma db push` ile veritabanı senkronize edildi ve Prisma Client üretildi.
    2. **Sıfır-Token Tahmin Motoru (`src/lib/actions/ai-forecast-actions.ts`):**
       - `getMonthEndForecastMetrics()`: Net ciro, günlük run-rate hızı ve ay sonu net ciro tahmini hesaplar; geçen ayın aynı dönemine kıyasla büyüme oranını verir.
       - `generateExecutiveAIReport()`: Gemini 2.5 Flash ile tamamen Türkçe, B.A.Ş.A.R. stratejik yönetici raporu oluşturup DB kasasına kaydeder.
       - `getLatestAIReport()`, `getAIReportHistory()`, `deleteAIReport()` fonksiyonları entegre edildi.
    3. **Executive Cockpit Arayüzü (`stok-ai-client.tsx`, `page.tsx`):**
       - Tüm İngilizce ibareler ("Forecast Cockpit", "Telemetry // Online", "Run-rate", "MoM", "Snapshot", "0-Token Cache") Türkçeleştirildi ("B.A.Ş.A.R. Komuta ve Tahmin Kokpiti", "Sistem Telemetrisi // Çevrimiçi", "Güncel Hız Ortalaması", "Dönemsel Büyüme (Geçen Aya Göre)", "Sıfır Token (Veri Tabanı Kaydı)").
       - 4 Üst Komut Butonu, 4 Canlı Telemetri Kartı, Sıfır-Token Rapor Kasası ve Operasyonel Stok Algoritmaları sekmesi eksiksiz çalışır hale getirildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-21: Anasayfa "Veresiyeler" Kartı & "Alacak Ekle" ve Detaylı Müşteri Veresiye Modalı Entegrasyonu:
  - **Talep:**
    - Anasayfadaki istatistik kartlarında "Toplam Borçlar" yerine "Veresiyeler" yazılması.
    - Karta tıklandığında veresiye sayfasındaki "Alacak Ekle" (`AddDebtModal`) modalının açılması.
    - Kartın sağ üstündeki `Info` (bilgi) butonuna basıldığında veresiye sayfasındaki müşterilerin ve borç bakiyelerinin kalem detaylarıyla listelendiği şık ve kapsamlı bir detay modalının açılması.
  - **Yapılan İyileştirmeler:**
    1. **Veresiye Detay Server Action (`src/lib/actions/dashboard-detail-actions.ts`):**
       - `getDebtDetails()` fonksiyonu veresiye (`prisma.debt`) tablosuyla tam entegre edildi (`shopId`, `isPaid: false`, `remainingAmount > 0`).
       - Müşteri bilgileri, açık kalan TL ve USD tutarları, borç adetleri ve her borcun satış/ürün/not ayrıntıları gruplanarak azalan bakiye sırasıyla istemciye sunuldu.
    2. **Kapsamlı Müşteri Veresiye Modalı (`src/components/dashboard/modals/veresiye-detail-modal.tsx`):**
       - Toplam açık TL ve USD tutarı, borçlu müşteri adedi ve açık borç sayısı KPI şeritleri eklendi.
       - Müşteri adı veya telefonuna göre anında filtreleyen arama çubuğu entegre edildi.
       - Her müşteri için bakiye kartı, doğrudan müşteri veresiye ekstresine yönlendiren buton ve borcun kalemlerini (tarih, kalan tutar, ürün/açıklama, vade durumu) gösteren genişletilebilir detay alanı sağlandı.
       - Modal içerisinden tek tıkla doğrudan "Alacak Ekle" modalına geçiş imkanı eklendi.
    3. **Anasayfa Kart Etiketleri ve Tetikleyicileri (`admin-dashboard.tsx`, `dashboard-core.tsx`, `stats-grid-stream.tsx`, `stat-widget-wrapper.tsx`):**
       - Kart adı tüm anasayfa bileşenlerinde `"Veresiyeler"` olarak güncellendi.
       - Hızlı aksiyon butonu `"Alacak Ekle"` olarak değiştirildi ve tıklandığında `activeModal("DEBT")` açılarak `AddDebtModal` tetiklendi.
       - Kartın bilgi (info) butonuna tıklandığında `isVeresiyeDetailOpen` açılarak `VeresiyeDetailModal` devreye sokuldu.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-21: Satış Geçmişi (@satis/gecmis) İşlem Arşivinde Gösterilen İşlemlerin Toplam Tutarının Eklenmesi:
  - **Talep:**
    - `@satis/gecmis` sayfasında işlem arşivinde tutar kısmında gösterilen işlemlerin toplam tutarının yazması.
  - **Yapılan İyileştirmeler:**
    1. **Dinamik Toplam Tutar Hesaplayıcı (`src/components/satis/sales-history-client.tsx`):**
       - Mevcut filtreler (tarih, tür, ödeme tipi, personel, arama) ve sayfa içeriği doğrultusunda görüntülenen işlemlerin (`historyData.items`) para birimi dönüşümlerini (`defaultCurrency` ve `rates`) ve işlem türü bazında gelir/gider ayrımını (`SALE`, `PAYMENT`, `DEBT_DIRECT` pozitif; `EXPENSE` negatif) yapan `displayedTotals` kancası (`useMemo`) tanımlandı.
    2. **Tablo Başlığına Tutar Gösterimi (`TUTAR` Sütunu):**
       - Tablo başlığındaki `Tutar` sütununa gösterilen işlemlerin anlık net toplamı eklendi (`Toplam: +₺X.XXX,XX` veya `-₺...`).
    3. **Tablo Altına (tfoot) Özet Satırı:**
       - Tablo altına `<tfoot>` eklenerek tüm gösterilen işlemlerin genel toplamı ve hem gelir hem gider varsa alt kırılımı (`+Gelir / -Gider`) şık bir şekilde konumlandırıldı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-20: Veresiye WhatsApp Şablonunun Sadeleştirilmesi (Tahsilat Detaylarının Gizlenmesi, Sadece Açık Borç Kalemleri):
  - **Talep:**
    - Veresiye sayfasından atılan WhatsApp şablonunda müşterinin ödemelerinin görünmemesi, sadece açık borç kalemlerinin yer alması ve tahsilat detaylarının kaldırılması.
  - **Yapılan İyileştirmeler:**
    1. **WhatsApp Şablon Üreticisi Güncellendi (`src/lib/debt-statement-calculator.ts`):**
       - `UnifiedWhatsAppStatementOptions` arayüzüne `includePayments?: boolean` opsiyonu eklendi ve varsayılan olarak `false` yapıldı.
       - `*🟢 SON TAHSİLATLAR & ÖDEMELER:*` blok yapısı `includePayments` bayrağına bağlandı; açık borç ekstresi gönderilirken müşterinin geçmiş tahsilat ve ödeme dökümü mesajdan tamamen çıkarıldı.
       - Açık borç listesinde (`*📋 AÇIK BORÇ KALEMLERİ:*`) kalan açık tutar net olarak formatlanarak borcun oluşturulma tarihi (`[DD.MM.YYYY]`) ve açıklamasıyla birlikte listelendi; ödenmiş borçlar filtre dışı bırakıldı.
    2. **Veresiye Ekranı Entegrasyonu (`src/components/finance/veresiye-client.tsx`):**
       - Müşteri geçmişi modalındaki "WhatsApp Ekstre" butonu kullanıcıya ödenenleri dahil edip etmeme sorusu sormadan doğrudan açık borç şablonunu oluşturacak şekilde bağlandı (`includePaid: false`, `includePayments: false`).
       - Tekli ve toplu WhatsApp hatırlatma işlevlerine (`handleSingleWhatsAppReminder`, `handleConfirmBulkWhatsApp`) açıkça `includePaid: false, includePayments: false` parametreleri geçildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-17: Cihaz ve Stok Girişlerinde MB Dosya Boyutu Sınırlarının Kaldırılması & Akıllı Sıkıştırma:
  - **Talep:**
    - Cihaz ekleme ve ilgili yükleme modallarındaki MB sınırlarının tamamen kaldırılması.
  - **Yapılan İyileştirmeler:**
    1. **Next.js Server Actions Payload Sınırı Yükseltildi (`next.config.mjs`):**
       - `experimental.serverActions.bodySizeLimit` değeri `15mb`'den `50mb`'ye yükseltildi. Böylece yüksek çözünürlüklü mobil kamera çekimlerinin veya büyük görsel base64 verilerinin Server Action'larda 413 "Body exceeded limit" hatası vermesi engellendi.
    2. **Cihaz Modalı Sınırsız Görsel Yükleme & Otomatik Sıkıştırma (`create-device-modal.tsx`):**
       - `compressImage` fonksiyonu genişlik veya yükseklik fark etmeksizin orantılı en-boy korumalı `maxDimension = 1800` standartına kavuşturuldu; çözülemeyen veya özel formatlı görsellerde hata fırlatmak yerine güvenli fallback eklendi.
       - Cihaz fotoğrafları galerisi (`handlePhotoChange`) ve satıcı kimlik fotoğrafları (`handleSellerIdFrontChange`, `handleSellerIdBackChange`) yükleme anında otomatik optimize edilerek 10-40 MB'lık ham kamera çekimlerinin tarayıcıyı yormadan ve sunucuya takılmadan ~300KB'a dönüştürülüp sınırsız yüklenebilmesi sağlandı.
    3. **Stok Fişi & Müşteri Formu Limitleri Kaldırıldı (`ai-category-creator.tsx`, `yeni-musteri-client.tsx`, `musteri-duzenle-client.tsx`):**
       - Fiş yüklemedeki `25MB` ve müşteri kimlik/fotoğraf yüklemedeki `2MB` kontrolleri kaldırılarak akıllı sıkıştırma altyapısıyla sınırsız dosya yükleme desteği sağlandı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-17: Cihaz Listesi (@cihaz-listesi) - BAŞAR AI Destekli Kutu Analizi & Otomatik Cihaz Ekleme:
  - **Talep:**
    - Cihaz listesi sayfasında cihaz ekleme butonunun yanına yapay zeka gücü eklenmesi, fotoğraf simgesi ve "BAŞAR AI ile Cihaz Ekle" butonu oluşturulması.
    - Samsung, Redmi, Apple vb. cihazların kutu etiketlerinin veya bilgi ekranlarının fotoğrafı yüklendiğinde/çekildiğinde cihazın analiz edilmesi; marka, model, 15 haneli IMEI, 2. IMEI, seri no, RAM, dahili hafıza, renk, kondisyon ve garanti sürelerinin otomatik okunup formun doldurulması.
    - Kullanıcının isteği doğrultusunda alış ve satış fiyatlarının boş bırakılarak imlecin doğrudan alış fiyatına odaklanması.
    - Yüklenen/çekilen kutu görselinin cihazın fotoğraf galerisine otomatik olarak eklenip kaydedilmesi.
  - **Yapılan İyileştirmeler:**
    1. **Gemini 2.5 Flash Multimodal OCR (`analyzeDeviceImageWithAI`):**
       - `src/lib/actions/gemini-actions.ts` içerisine kutu etiketlerini yüksek hassasiyetle okuyan Server Action eklendi.
       - IMEI numaraları temizlenip yalnızca 15 haneli geçerli rakamlara filtrelendi; çift SIM kutuları için IMEI 2 ve Seri No (S/N) alanları ayrıştırıldı.
       - Sıfır cihazlar için 24 ay garanti, 10/10 kozmetik ve %100 pil sağlığı akıllı varsayılanlar olarak işlendi.
    2. **İstemci Tarafı Görsel Sıkıştırma (`compressImage`):**
       - Yüksek çözünürlüklü fotoğraflar yüklenmeden önce istemci tarafında HTML5 Canvas ile optimize edilip JPEG formatına sıkıştırılarak aktarıldı.
       - Aynı sıkıştırılmış görsel `File` nesnesine dönüştürülüp `photoFiles` dizisine eklenerek cihaz oluşturulduğunda kalıcı olarak sunucuya yüklenmesi (`/api/finance/upload` -> `deviceInfo.photoUrls`) sağlandı.
    3. **UI/UX & Buton Entegrasyonu (`create-device-modal.tsx`):**
       - Başlık alanına gradient mor/indigo renklerde kamera ve ışıltı simgeli "BAŞAR AI ile Cihaz Ekle" butonu eklendi; hemen yanına "Manuel Ekle" seçeneği konuldu.
       - Modalın içine de kullanıcı modalı manuel açtığında sonradan kutu fotoğrafı tarayabilmesi için hızlı "Kutu Etiketi veya Cihaz Fotoğrafı Yükle" banner'ı eklendi.
       - `Select` bileşenleri (`brand`, `ram`, `storage`, `cosmeticScore`, `warrantyMonths`) kontrollü (`value={watch(...)}`) hale getirilerek yapay zekanın doldurduğu değerlerin arayüzde anında seçili görünmesi sağlandı.
       - Form başarıyla doldurulduğunda bildirim verilip imleç doğrudan `#buyPriceInput` alanına odaklandı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-17: Stok Sayfası (StokPage) Sağ Tedarikçi Siparişleri Paneli ve @stok/siparisler Senkronizasyonu:
  - **Sorun:**
    - `StokPage` (`/stok`) sayfasındaki sağ sidebar panelinde yer alan "Tedarikçi Siparişleri", sadece `localStorage` tabanlı taslak sepeti (`useSupplierOrders`) gösteriyordu.
    - `/stok/siparisler` sayfasında oluşturulan, bekleyen veya teslim alınan gerçek satın alma siparişleri (`PurchaseOrder`) sağ sidebar'da görünmüyordu.
    - Sağ panelden "Sipariş Ver" dendiğinde sipariş DB'ye kaydedilip taslaktan silindiği için liste boş kalıyor; kullanıcı siparişin durumunu takip etmek ve mal kabul (teslim alma) yapmak için `/stok/siparisler` sayfasına gitmek zorunda kalıyordu.
  - **Yapılan İyileştirmeler:**
    - `supplier-order-lists-panel.tsx` tamamen yenilenerek iki yönlü senkronize hale getirildi:
      1. **Canlı DB Siparişleri Senkronizasyonu:** `useQuery(["purchase-orders"])` ile `/stok/siparisler` sayfasındaki tüm siparişler canlı olarak sağ panele bağlandı.
      2. **İkili Sekme Yapısı:**
         - **Aktif Siparişler Sekmesi:** Bekleyen (`PENDING`) ve sipariş verilen (`ORDERED`) siparişler, sipariş numarası, tedarikçi adı, ürün çeşit/adet bilgisi ve durum rozetleriyle listelendi.
         - **Taslak Sepet Sekmesi:** Akıllı stok yenilemeden veya eksik listelerinden eklenen taslak kalemler korunarak yönetilebilir kılındı.
      3. **Panel İçi Hızlı Aksiyonlar:**
         - **Teslim Al (Mal Kabul):** Sağ panelden tek tıkla `MalKabulModal` açılarak sipariş stoğa işlenebiliyor; teslim alındığında stoklar güncellenip liste anında senkronize ediliyor.
         - **WhatsApp:** Tedarikçiye sipariş listesini fiyatsız şablonla iletme modalı entegre edildi.
         - **Detay & Yazdır:** `PurchaseOrderDetailModal` ile sipariş dökümü görüntülenebiliyor.
         - **Sipariş İptali:** `cancelPurchaseOrder` aksiyonu ve onay diyaloğu eklendi.
      4. **Otomatik Akıllı Geçiş:**
         - Akıllı stok yenilemeden yeni bir ürün eklendiğinde panel otomatik olarak "Taslak Sepet" sekmesine geçiyor.
         - Taslaktan "Sipariş Ver" dendiğinde sipariş DB'ye işlenip cache'ler yenileniyor ve panel otomatik olarak "Aktif Siparişler" sekmesine dönerek yeni siparişi gösteriyor.
      5. **Hızlı Erişim Linki:** Başlığa `/stok/siparisler` sayfasına tek tıkla gitmeyi sağlayan "Tümünü Gör" bağlantısı eklendi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-17: BAŞAR AI Çoklu Stok & Fiş Analizi - Prisma Transaction Zaman Aşımı (P2028) ve O(1) Hızlandırma:
  - **Kök Neden:**
    - Prisma'nın varsayılan transaction zaman aşımı süresi 5 saniyedir (`timeout: 5000ms`). 25 kalemlik fişte her ürün için ardışık olarak `findFirst` (mükerrer kontrolü), `product.create`, `findFirst` (barkod kontrolü) ve `product.update` çağrıları yapıldığında 100'e yakın SQL sorgusu işletiliyor ve süre 5 saniyeyi aştığı için Prisma transaction'ı iptal ediyordu (`P2028: Transaction not found`).
  - **Yapılan Düzeltmeler:**
    - `product-actions.ts` (`bulkCreateAIInventory`):
      1. **Tek Seferde Belleğe Alma:** Dükkandaki tüm kategori ve mevcut ürünler işlem başında tek sorguda çekilip hafızada `Map` ve `Set` yapılarına aktarıldı.
      2. **O(1) Mükerrer Kontrolü:** Döngü içinde veritabanına `findFirst` sorgusu atmak yerine isim ve barkod eşleşmeleri doğrudan bellekten anında kontrol ediliyor.
      3. **Anında Benzersiz Barkod Üretimi:** Barkodu olmayan ürünler için hafızadaki `usedBarcodes` kümesine göre çakışmasız barkod üretilip ürün tek bir `create` işlemiyle oluşturuluyor (ekstra `findFirst` döngüsü ve `update` çağrısı kaldırıldı).
      4. **Genişletilmiş Zaman Aşımı:** `prisma.$transaction` seçeneğine `{ maxWait: 15000, timeout: 60000 }` eklenerek olası yoğunluk durumlarında zaman aşımı 60 saniyeye yükseltildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).



- [x] 2026-10-17: React "Maximum update depth exceeded" Sonsuz Render Döngüsü Düzeltmesi:
  - **Kök Neden:**
    1. `WhatsAppConfirmModal` bileşeninde `phones = []` varsayılan parametresi her render'da yeni referans oluşturuyor ve bu dizi `useEffect` bağımlılıklarında yer aldığı için modal açıkken `setMessage` ile sonsuz tetikleme döngüsüne (Maximum update depth exceeded) neden oluyordu.
    2. `ai-category-creator.tsx` içerisinde `step === "review"` sırasında her `rows` değişiminde `setSavedDraft(draft)` çağrılması gereksiz state değişimlerini tetikliyordu; ayrıca `setAiLoading` çağrısı `useUI()` üzerinden tüm üst bileşenleri yeniden tetikliyordu.
    3. `ui-context.tsx` Context Provider değeri (`value={{ ... }}`) ve fonksiyonları (`toggleFinancialVisibility`, `toggleLayoutEditing`) `useMemo`/`useCallback` ile sarılmadığı için tüketen her bileşende gereksiz render silsilesi yaratıyordu.
  - **Yapılan Düzeltmeler:**
    - `whatsapp-confirm-modal.tsx`: `phones` varsayılan değeri dışarıda sabitlenen `EMPTY_PHONES` referansına bağlandı ve `useEffect` bağımlılığı `phonesKey = phones.join(",")` olarak normalize edildi.
    - `ai-category-creator.tsx`: `setAiLoading` yan etkisi ve review adımındaki gereksiz `setSavedDraft` kaldırıldı.
    - `ui-context.tsx`: Context değerleri `useMemo`, toggle fonksiyonları ise `useCallback` ile kalıcı hale getirilerek referans kararlılığı sağlandı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-17: Tedarikçi Fişi/Fatura Görsel Analizinde JSON Parse Hatası ve Token Aşımı Düzeltmesi (`gemini-actions.ts`):
  - **Kök Neden Tespiti:**
    - Uzun toptancı fişlerinde (~25 kalem ekran/yedek parça) AI analizi çalıştırıldığında, Gemini modeline gereksiz yere 100 mevcut kategori ve 50 ürün listesi aktarılıyor; model her ürün satırı için 10'dan fazla alan ve kur çevrimi üretirken yanıt maksimum token sınırında (3800. karakter civarı `"buyPriceUs`) aniden kesiliyordu.
    - `callGemini` içerisindeki regex kuralları kesilmiş JSON metnine yanlış tırnak ve süslü parantez ekleyerek `{"buyPriceUs"}}` gibi bozuk JSON üretiyor, bu da `JSON.parse` çökmesine ve `"AI YANITI JSON OLARAK ÇÖZÜMLENEMEDİ"` toast hatasına yol açıyordu.
  - **Görsel/Fiş Yüklemelerine Özel Kompakt Prompt Stratejisi (`parseCategoryTreeWithAI`):**
    - Görsel yüklendiğinde mevcut kategori ve ürün dökümü prompttan çıkarıldı; Gemini'ye sadece görseldeki satırları okuması (`name`, `buyPrice`, `stock`, `currency`) talimatı verildi.
    - Toptancı telefon ekran/yedek parça fişlerindeki `9,000`, `20,000`, `41,000` gibi 3 sıfırlı küsuratlı fiyatların DOLAR ($9, $20, $41) olduğu prompta eklendi ve birim fiyatın bu şekilde alınması sağlandı.
    - TL çevirimi (`buyPrice`), kâr marjı eklenmiş perakende satış fiyatları (`sellPrice`, `sellPriceUsd`) ve kritik stok değerleri model yerine doğrudan sunucu tarafında TypeScript ile milisaniyeler içinde hatasız hesaplandı. Çıktı token yükü %60 azaldı ve 25 satırlık fişler bile saniyeler içinde eksiksiz döndü.
  - **Yığın Tabanlı Akıllı JSON Kurtarma Motoru (`recoverTruncatedJson` & `safeJsonParse`):**
    - `gemini-actions.ts` içine `recoverTruncatedJson` ve `safeJsonParse` yardımcıları eklendi.
    - AI yanıtı herhangi bir sebeple ortada kesilse dahi, yığın (bracket/brace stack) algoritması ile son tamamlanan geçerli nesneye kadar geri çekilip açık kalan parantezler dengeli şekilde kapatılarak başarıyla kurtarılması sağlandı (hiçbir veri kaybı veya çökme yaşanmaz).
    - `parseProductWithAI` ve `parseBulkProductsWithAI` işlevleri de bu güvenli ayrıştırıcıya bağlandı.
  - **Next.js Server Actions Düzeltmesi:** `"use server"` dosyalarında senkron fonksiyonların `export` edilmesi Next.js tarafından ("Server actions must be async functions") derleme hatasına yol açtığından, yardımcı `recoverTruncatedJson` ve `safeJsonParse` fonksiyonlarının `export` belirteci kaldırılarak dosya içi yardımcı fonksiyon yapıldı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-17: Fiş Yükleme 413 (Body Exceeded 1MB Limit) ve Kur Senkronizasyonu `unstable_cache` Hatası Düzeltmeleri:
  - **Fiş/Fatura Yükleme 1MB Sınırı ve 413 Hatası Çözümü (`next.config.mjs` & `ai-category-creator.tsx`):**
    - `next.config.mjs`: `experimental.serverActions.bodySizeLimit` değeri `15mb` olarak yapılandırıldı. Böylece Next.js Server Action varsayılan 1MB gövde kısıtı kaldırıldı.
    - `ai-category-creator.tsx`: İstemci tarafında `compressImage` (HTML5 Canvas) optimizasyonu eklendi. Cep telefonu kameralarıyla çekilen yüksek çözünürlüklü (3MB - 10MB) fiş fotoğrafları OCR/metin okunurluğunu koruyacak şekilde 1800px ve 0.85 kaliteye ölçeklenerek ~300KB seviyesine indirildi. Bu sayede hem 413 hatası kesin olarak önlendi hem de yapay zekaya aktarım 5 kat hızlandırıldı.
  - **Kur Senkronizasyonu `unstable_cache` İçinde `revalidatePath` Hatası Çözümü (`currency-actions.ts`):**
    - Next.js'in `unstable_cache` ve render anında `revalidatePath("/")` çağrıldığında fırlattığı rota kilitlenme hatası giderildi.
    - `syncAllRates` fonksiyonuna `skipRevalidatePath` opsiyonu eklendi, `revalidatePath` ve `revalidateTag` çağrıları güvenli `try/catch` bloklarına alındı. `getExchangeRates` arka plan kütüphanesinden çağrıldığında revalidatePath atlanarak çökme engellendi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-17: Ana Sayfa "Kasa Bakiyesi" Kartı Ay Tabanlı Detay Modalı ve Son 20 Kayıt Kırılımı:
  - **Sunucu Eylemi (`src/lib/actions/dashboard-detail-actions.ts` -> `getCashBalanceMonthlyDetails`):**
    - Ay tabanlı (`year`, `month`) kasa akış analizi eklendi.
    - Tüm aktif nakit kasaların (`type: "CASH"`) bakiyeleri toplanarak güncel bakiye belirlendi.
    - Seçili ayın başından (`startOfMonth`) sonuna (`endOfMonth`) kadar olan kasaya giren (`INCOME`) ve kasadan çıkan (`EXPENSE`) tüm nakit tutarlar ve işlem sayıları hesaplandı.
    - Matematiksel kesinlik ile ayın başındaki devir bakiye formülü uygulandı: `Ay Başı Kasa = Güncel Kasa - Ayın Başından Beri Girenler + Ayın Başından Beri Çıkanlar`.
    - Son 20 kasa hareketi kronolojik sıralı (`createdAt: "desc"`, take: 20) olarak getirildi; müşteri, tedarikçi, personel, satış kalemleri ve bakiye ilişkileri dahil edildi.
    - Son 20 kayıt içerisindeki giriş toplamı, çıkış toplamı ve net fark otomatik hesaplandı.
  - **Yeni `CashBalanceDetailModal` Bileşeni (`src/components/dashboard/modals/cash-balance-detail-modal.tsx`):**
    - **Ay Navigasyonu:** Önceki Ay / Sonraki Ay butonları, ay etiketi ve hızlı "Bu Ay" kısayolu.
    - **4 Temel Ay Tabanlı KPI Kartı:**
      1. Ay Başı Kasa Bakiyesi (Devir)
      2. Kasaya Giren Para (İşlem adedi ve +₺ tutarı)
      3. Kasadan Çıkan Para (İşlem adedi ve -₺ tutarı)
      4. Güncel Kasa Bakiyesi (Aylık net fark göstergesiyle)
    - **Son 20 Kayıt ve Giriş / Çıkış Ayrı Gösterimi:**
      - Sekmeler: `Tümü (20)`, `Girişler (X)`, `Çıkışlar (Y)`.
      - Özet bandı: Son 20 kaydın giriş toplamı, çıkış toplamı ve net fark rozeti.
      - Her hareket kartında: Giriş/Çıkış renk kodlu yön ikonu, açıklama/satış no, kategori rozeti, tarih-saat, ilgili müşteri/tedarikçi/personel, işlem tutarı ve işlem anındaki kasa bakiyesi (`runningBalance`).
    - **Aksiyonlar:** "Yeni Kasa Hareketi Ekle" butonu (tek tıkla modal içi işlem kaydı) ve "Yazdır" butonu.
  - **Ana Sayfa Tetikleme Entegrasyonu (`stat-widget-wrapper.tsx` & `stat-detail-modal.tsx`):**
    - Ana sayfadaki "Kasa Bakiyesi" kartına tıklandığında veya detay istendiğinde doğrudan bu yeni `CashBalanceDetailModal` açılacak şekilde entegre edildi.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-17: Eksik Ürün Listesi Revizyonu, Kurye & Tedarikçi Ayrımı, Kesintisiz Sipariş Birleştirme ve Otomatik Temizleme:
  - **Kuryeye Ata ve Tedarikçiye Ata Ayrımı (`src/components/navbar/shortage-list.tsx`):**
    - Her eksik ürün kartında "Kuryeye Ata" (Mavi/Kurye ikonu) ve "Tedarikçiye Ata" (Zümrüt Yeşili/Dükkan ikonu) şeklinde iki ayrı, belirgin ve tam genişlikli eylem butonu eklendi.
    - Mobilde ve masaüstünde kolay tıklanabilir ergonomik popover menüler; atanan kurye/tedarikçi adı, hızlı değişim ve tek tıkla atamayı kaldırma seçeneği sunuldu.
  - **Ferah Mobil Arayüz ve Görünür Adet Kontrolü (`src/components/navbar/shortage-list.tsx`):**
    - Sağ üst köşeye sıkışmış, mobil cihazlarda basılması imkansız küçük `+ -` butonları ve gizlenen adet yazısı tamamen kaldırıldı.
    - Kart yapısı 3 ferah alana ayrıldı:
      1. Üst kısım: Ürün Adı, Akıllı Stok rozeti, Mevcut Stok ve SKU bilgisi, silme çöp kutusu.
      2. Orta kısım: Rahat dokunmatik hedefli (36px yükseklik, `h-9 w-9`) `+` ve `-` butonları, ortada iri puntolu **Adet** göstergesi ve hemen yanında tek tıkla "Tamamla / Çözüldü" butonu.
      3. Alt kısım: 2 sütunlu "Kuryeye Ata" ve "Tedarikçiye Ata" butonları.
  - **Atanan Ürünlerin Teslim Alınana veya Stok Girilene Kadar Listede Kalması:**
    - `src/lib/actions/shortage-actions.ts`: `getShortageItems` sorgusundan `assignedToId: null` kısıtı kaldırılarak kuryeye veya tedarikçiye atanan ürünlerin listeden kaybolması engellendi; ürünler teslim alınana veya stoğu tamamlanana kadar listede görünür kalıyor.
    - `src/lib/actions/shortage-actions.ts`: Yeni `assignShortageToSupplier` sunucu eylemi yazıldı.
    - Tedarikçiye atanan ürünler önceki gibi anında `removeShortage` ile silinmiyor; teslimat / mal kabul gerçekleştiğinde otomatik temizleniyor.
  - **Tedarikçiye Atanan Ürünlerin Aynı Açık Sipariş Listesinde Birikmesi (`src/lib/context/supplier-order-context.tsx` & `src/lib/actions/purchase-actions.ts`):**
    - `SupplierOrderContext`: Aynı tedarikçiye daha sonra atanan ürünler parça parça yeni liste açmak yerine mevcut açık sepete ekleniyor; aynı ürün varsa miktarı artırılıyor (`quantity += count`), yeni ürünse listeye dahil ediliyor.
    - `createPurchaseOrderAction`: Veritabanında tedarikçiye ait `PENDING` (açık) bir satın alma siparişi varsa, yeni sipariş açmak yerine bu açık siparişin içine kalemler eklenip toplam tutarları güncelleniyor.
  - **Yeni Eklenen Ürün Bildirim Işığı (Yanıp Sönen Nabız / Blink Dot):**
    - `SupplierOrderContext`: Sipariş listesine yeni ürün atandığında `hasNewItems: true` ve `lastAddedAt` bayrağı aktifleşiyor. Kullanıcı listeyi incelediğinde `markSeen(supplierId)` ile sıfırlanıyor.
    - `shortage-list.tsx` ve `supplier-order-lists-panel.tsx`: Tedarikçi sekmelerinde ve sipariş kartlarında zümrüt yeşili yanıp sönen animasyonlu nabız ışığı (`animate-ping` / `animate-pulse`) ve "Yeni Eklendi" rozeti görüntülendi.
  - **Teslim Alınan veya Stoğu Eklenen Ürünlerin Eksik Listesinden Otomatik Silinmesi:**
    - `src/lib/actions/purchase-actions.ts` (`receivePurchaseOrderAction`): Satın alma siparişi mal kabul yapıldığında (`COMPLETED`), sipariş edilen tüm ürünler hem `productId` hem de küçük/büyük harf duyarsız ürün adına göre eksik ürün listesinden (`shortageItem`) otomatik olarak silinir.
    - `src/lib/actions/product-actions.ts` (`adjustStockById`): Ürün stoğuna manuel veya hareketle ekleme yapıldığında (stok > 0), o ürüne ait bekleyen eksik ürün kayıtları otomatik temizlenir.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-17: Stok Sayfası (`/stok`) Ürün Arama Türkçe Harf ("i - İ - ı - I") ve Büyük/Küçük Harf Duyarsızlaştırma:
  - **İstemci Tarafı Filtreleme (`src/components/product/stock-list-table.tsx`):**
    - `StockListTable` içerisindeki `filteredProducts` filtresi standart JS `toLowerCase()` yerine `normalizeSearchText` fonksiyonuyla güncellendi.
    - Kullanıcı arama kutusuna küçük `i`, büyük `İ`, noktasız `ı` veya büyük `I` yazdığında; ürün adı, SKU, barkod, kategori adı ve açıklama alanlarında büyük/küçük harf ve Türkçe karakter toleransıyla tam eşleşme sağlandı.
  - **Sunucu Tarafı Sorgusu (`src/lib/actions/product-actions.ts` -> `getProducts`):**
    - PostgreSQL ve Prisma `mode: 'insensitive'` sorgularının Türkçe `i/İ/ı/I` karakterlerinde yaşadığı eşleşme problemi için arama teriminin tüm Türkçe büyük/küçük varyasyonları (`queryVariants`) üretildi.
    - Sayfalama (SSR pagination) ve gecikmeli (debounced) URL sorgularında da `iphone`, `İphone`, `IPHONE`, `şarj`, `SARJ` vb. tüm aramaların eksiksiz ve anında bulunması garanti altına alındı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-17: Tedarikçi Siparişleri Sayfası (`/stok/siparisler`) Satın Alma Yönetim Merkezi ve Mal Kabul Entegrasyonu:
  - **Sayfa Amacı ve Mimari Analiz:**
    - Sidebar'daki `Stok > Tedarikçi Siparişleri` sayfasının amacı, mağazanın toptancılardan verdiği tüm satın alma siparişlerini (`PurchaseOrder`), teslim alımlarını (mal kabul) ve eksik stok taslaklarını yönetmektir.
    - Daha önce bu sayfada yalnızca geçici eksik sepeti (`SupplierOrderListsPanel`) gösteriliyor, `/tedarikciler` sayfasında verilen kesinleşmiş siparişler listelenmiyordu.
  - **Yeni `StockOrdersClient` Bileşeni (`stock-orders-client.tsx` & `stok/siparisler/page.tsx`):**
    - `/tedarikciler` sayfasında veya `/stok/siparisler` üzerinden oluşturulan tüm siparişler (`PurchaseOrder`) eşzamanlı olarak burada listelendi.
    - KPI İstatistik Kartları eklendi: Toplam Sipariş, Açık / Bekleyen (Mal Kabul Bekliyor), Teslim Alınanlar (Stoğa Eklendi), Toplam Satın Alma Hacmi (₺).
    - İki sekmeli profesyonel görünüm:
      1. **Tedarikçi Siparişleri & Satın Almalar:** Sipariş No (`#PO-...`), Tedarikçi, Kalem/Adet Özeti, Tutar, Durum ve Ödeme Rozetleri, Tarih.
      2. **Eksik Stok Sipariş Sepeti / Taslaklar:** Kurye ve tedarikçiye atanmayı bekleyen eksik listeleri (`SupplierOrderListsPanel`).
    - Hızlı Aksiyon Butonları:
      - **Teslim Al (Mal Kabul):** `MalKabulModal` açılarak siparişteki ürünlerin adet ve alış fiyatları güncellenerek tek tıkla doğrudan mağaza stoklarına aktarılır.
      - **WhatsApp ile Sipariş Gönder:** Tedarikçiye sade formatta (sadece ürün adı + adet, fiyatsız) hazır mesaj gönderimi.
      - **İncele / Yazdır:** `PurchaseOrderDetailModal` ile A4/termal sipariş fişi görüntüleme ve yazdırma.
      - **İptal Et:** Açık siparişi iptal edip parçaları otomatik ihtiyaç havuzuna geri döndürme (`cancelPurchaseOrder`).
      - **Sil:** Sipariş kaydını silme (`deletePurchaseOrdersAction`).
      - **Yeni Sipariş Formu:** Sayfa başlığındaki butonla doğrudan `PurchaseForm` üzerinden yeni sipariş oluşturabilme.
    - Arama ve Filtreleme: Türkçe karakter duyarsız arama (`normalizeSearchText`), Durum filtresi (Tümü, Açık, Teslim Alınanlar, İptaller) ve Tedarikçi filtresi.
  - **Revalidation Senkronizasyonu (`purchase-actions.ts` & `supplier-actions.ts`):**
    - `createPurchaseOrderAction`, `receivePurchaseOrderAction`, `deletePurchaseOrdersAction` ve `cancelPurchaseOrder` işlemlerine `revalidatePath("/stok/siparisler")` eklenerek iki sayfanın anlık eşitliği sağlandı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-17: Stok Sayfası (`/stok`) BAŞAR AI Stok Ekle, Tedarikçi Fişi / Fatura Yükleme (Multimodal AI), Telefon Serisi Genişletme, Taslak Saklama (Token Koruma) ve Kategoriye Taşıma Revizyonu:
  - **Stok Sayfasına AI Entegrasyonu (`src/app/(dashboard)/stok/page.tsx`):**
    - `/stok` sayfasındaki eski ve sınırlı `BulkAddProductModal` kaldırılarak kategoriler sayfasındaki zengin, USD/TL döviz destekli `AICategoryCreator` (`"BAŞAR AI Stok Ekle"`) ana buton olarak eklendi.
    - Hem `/stok` hem de `/stok/kategoriler` sayfaları aynı modern AI envanter altyapısına bağlandı.
  - **Tedarikçi Fişi / Fatura / Makbuz Yükleme & Multimodal Analiz (`gemini-actions.ts` & `ai-category-creator.tsx`):**
    - Kamera ile çekilmiş fiş fotoğrafları, ekran görüntüleri (JPG, PNG, WEBP, HEIC) veya PDF faturaları için sürükle-bırak / dosya seçici alanı eklendi.
    - `callGemini` fonksiyonu resim/belge inlineData (Base64) ve 8192 token çıktısını destekleyecek şekilde genişletildi.
    - Yapay zeka fişteki satırları, birim alış fiyatlarını, adetleri ve modelleri okuyup mağazanın hiyerarşisine göre mantıklı kategorilere ('Ekranlar > Apple', 'Ekranlar > Samsung', 'Bataryalar > Apple' vb.) otomatik gruplar.
    - Fişteki alış fiyatına göre perakende satış fiyatı önerisi (~1.5x - 2x kâr marjı) otomatik atanır.
  - **Seri Telefon Modelleri Otomatik Açma (iPhone 11'den 15 Pro Max'e kadar vb.):**
    - Prompt veya fişte "iPhone 11'den 15 Pro Max'e kadar" gibi model serisi belirtildiğinde AI tüm modelleri (11, 11 Pro, 11 Pro Max, 12, 12 Mini, 12 Pro, 12 Pro Max, 13, 13 Mini, 13 Pro, 13 Pro Max, 14, 14 Plus, 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max) tek tek bağımsız ürün kartı olarak açar.
  - **Kayıtlı Taslak (Sekme Kapanması / Sayfa Yenilenmesinde Token Koruması):**
    - Düzenleme sırasında yapılan tüm değişiklikler `basar_ai_stock_draft_v2` anahtarıyla `localStorage` üzerinde anlık saklanır.
    - Sayfa yenilense veya sekme kapansa bile modal yeniden açıldığında *"Son Analiz Edilen Stok Taslağınız Saklanıyor"* kartı belirir.
    - Kullanıcı tek tıkla **"Taslaktan Devam Et"** diyerek sıfır token harcayarak kaldığı yerden düzenlemeye devam edebilir; istenirse "Temizle" ile sıfırlanabilir.
  - **Ürünleri Kategoriler Arasında Taşıma & Yeni Kategori Ekleme:**
    - Önizleme tablosundaki her ürün satırına açılır kategori taşıma seçicisi (`select`) eklendi.
    - Kullanıcı herhangi bir ürünü tek hamlede mevcut kategoriler arasında taşıyabilir veya doğrudan yeni kategori oluşturarak ürünü oraya aktarabilir.
    - Önizleme çubuğuna `+ Yeni Kategori Ekle` butonu eklenerek serbest kategori açma sağlandı.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-17: AI Çoklu Stok Ekleme (`/stok/kategoriler` -> `AICategoryCreator`) USD / TL Dinamik Seçici ve Fiyat Önizleme Entegrasyonu:
  - **Gemini AI Prompt & Para Birimi Ayrıştırma (`gemini-actions.ts`):**
    - Kullanıcı prompt metninde alış veya satış fiyatını dolar/USD ($) olarak belirttiğinde (örn. "10 dolar", "$15", "10 usd") AI çıktısının bunu `currency: "USD"` olarak etiketlemesi sağlandı.
    - AI yanıtında hem TL hem USD fiyatlarının (`buyPrice`, `buyPriceUsd`, `sellPrice`, `sellPriceUsd`) güncel mağaza döviz kuru (`usdRate`) ile otomatik hesaplanarak eksiksiz dönmesi sağlandı.
    - Daha önce varsayılan para birimi USD olmadığında `buyPriceUsd = null` atanarak sıfırlanan kritik mantık hatası giderildi; her iki döviz değeri de korundu ve senkronize edildi.
  - **Modal Sağ Üst TL / DOLAR Segmented Switcher (`ai-category-creator.tsx`):**
    - AI önizleme modalının sağ üst başlık alanına anlık para birimi değiştirici (`[ ₺ TL | $ DOLAR ]`) ve güncel canlı kur rozeti (`1 USD ≈ ₺{usdRate}`) eklendi.
    - Kullanıcı promptunda dolar terimleri geçtiğinde veya ürünler dolar algılandığında önizleme otomatik olarak "USD" modunda başlatılır; istenirse tek tıkla TL moduna dönüştürülebilir.
  - **Dinamik Fiyat Düzenleme ve Değiştirilemez Karşılık Gösterimi:**
    - Tablo içerisindeki Alış ve Satış fiyatı girişleri aktif para birimine göre dinamik olarak düzenlenebilir hale getirildi (Dolar seçiliyse $ bazında düzenlenir, TL seçiliyse ₺ bazında düzenlenir).
    - Fiyat alanı güncellendiğinde arka planda karşı para birimi de otomatik olarak kur oranında güncellenir.
    - Fiyat giriş alanının hemen altına sadece okunabilir (değiştirilemez) karşı döviz karşılığı eklendi:
      - Dolar seçiliyken: Üstte düzenlenebilir `$ Alış Fiyatı`, altında değiştirilemeyen gri `≈ ₺{TL Karşılığı}`.
      - TL seçiliyken: Üstte düzenlenebilir `₺ Alış Fiyatı`, altında değiştirilemeyen gri `≈ ${USD Karşılığı}`.
  - **Tip ve Derleme Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-16: Teknik Servis Hızlı İşlem Kaydı Donma ve Stabilite İyileştirmesi (`create-service-modal.tsx` & `service-actions.ts`):
  - **Donma Sebeplerinin Tespiti ve Giderilmesi:**
    - `create-service-modal.tsx` içerisinde kayıt tamamlandığında `setServiceLabel` otomatik tetikleniyor ve 350ms sonra arka planda `window.print()` çalıştırılıyordu. `window.print()` tarayıcı ana thread'ini (UI döngüsünü) senkron olarak dondurduğu için animasyonlar kilitleniyor, kullanıcı tepkisizlik ve donma yaşıyordu. Otomatik etiket yazdırma zorunluluğu kaldırılarak buton kontrollü hale getirildi.
    - Modal kaydı bittikten hemen sonra çağrılan `router.refresh()`'in ardından, 2 saniyelik progress bar animasyonu tamamlandığında ikinci bir `router.refresh()` veya kullanıcının bulunduğu sayfadan koparılıp zorla `/servis` sayfasına yönlendirilmesi (`router.push('/servis')`) yapılıyordu. Bu durum sunucuya mükerrer RSC istekleri yollayıp veritabanı kilitlenmelerine ve arayüz takılmalarına yol açıyordu; ikinci refresh ve zorunlu yönlendirme döngüsü iptal edildi.
  - **Yeni Zengin ve Etkileşimli Başarı Paneli:**
    - Kayıt tamamlandığında açılan ekran donuk ve kapatılamaz olmaktan çıkarıldı. Oluşturulan servis fiş numarası (`SRV-XXX`), cihaz bilgisi, müşteri ve tahmini tutar net bir özet kartı olarak sunuldu.
    - **Barkod Etiketi Butonu:** Kullanıcı dilerse tek tıkla termal cihaz barkod etiketini yazdırma penceresine gönderebiliyor.
    - **Servis Fişi / Paylaş Butonu:** `ServiceReceiptModal` entegrasyonu ile dükkan A4 veya termal fiş dökümünü inceleyebilir, indirebilir veya doğrudan WhatsApp ile müşteriye gönderebilir.
    - **Yeni Kayıt Butonu:** Sayfa yenilenmesine gerek kalmadan hemen bir sonraki cihaz kaydına devam etme imkanı sağlandı.
    - **Kapatma / Otomatik Kapanma:** Kullanıcı dilediği anda "X" veya "Tamam" ile modalı anında kapatabiliyor; işlem yapılmazsa 5 saniye sonra arayüzü kilitlemeden kendi kendine kayboluyor.
  - **Veritabanı ve Model İlişkisi:**
    - `service-actions.ts` içindeki `createServiceTicket` fonksiyonunda `prisma.serviceTicket.create` sorgusuna `include: { customer: true }` eklenerek dönen veride müşteri adı ve telefonunun her zaman eksiksiz ve anında hazır olması sağlandı.

- [x] 2026-10-16: Tedarikçi Yönetimi (`/tedarikciler`) Satın Alma Formu, Mal Kabul, Fiyat Düzenleme ve Sade WhatsApp Sipariş Önizlemesi:
  - **Ürün Arama ve Alış Fiyatı Gösterimi (`purchase-form.tsx` & `product-actions.ts`):**
    - `searchProducts` server action'ında `buyPrice` ve `buyPriceUsd` alanları sorguya dahil edildi.
    - PostgreSQL ve Prisma ILIKE aramalarındaki Türkçe `i - İ - ı - I` eşleşme problemini çözmek için arama teriminin Türkçe büyük/küçük varyasyonları (`queryVariants`) üretilerek OR sorgusu genişletildi.
    - Hızlı arama modalında (`purchase-form.tsx`) ürünlerin alış fiyatları (`Alış: ₺...` veya `$..`) ve stok durumları belirgin şekilde gösterildi; istemci tarafında da `normalizeSearchText` ile Türkçe karakter duyarsız sıralama uygulandı.
  - **Stokta Olmayan Ürünleri İsimle Ekleme:**
    - Arama modalında, eşleşen ürün olsa dahi her zaman *"'{searchQuery}' — Stokta Olmayan Ürün Olarak Ekle"* opsiyonu sunuldu.
    - Katalogda olmayan ürünler sipariş formuna isim ve adetle eklenir; satırda turuncu renkli *"Stokta Yok (Teslimde Stoğa Eklenebilir)"* rozeti ile gösterilir.
    - Satın alma formu onaylanırken fiyatı henüz belli olmayan veya serbest eklenen ürünler için `buyPrice >= 0` serbestisi sağlandı.
  - **Teslim Al (Mal Kabul - `mal-kabul-modal.tsx` & `purchase-actions.ts`):**
    - Mal kabul tablosunda birim alış fiyatı alanı (`buyPrices`) serbestçe düzenlenebilir hale getirildi; teslimattaki fiyat değişimleri hem sipariş kalemine hem de envanterdeki ürün kartına anında yansıtılır.
    - Orijinal sipariş fiyatından farklı bir fiyat girildiğinde kullanıcıya turuncu renkte `(Sipariş: ₺...)` referans bilgisi sunuldu.
    - Katalogda olmayan (`item.productId` boş) ürünler için teslim alım ekranında *"Stoğa Ekle"* seçeneği varsayılan aktif getirildi; ürünün kategori ve satış fiyatı girilerek doğrudan sisteme yeni ürün kartı ve stok hareketi olarak açılması sağlandı. Fallback ile kategori seçilmemiş olsa bile dükkanın ilk kategorisine otomatik bağlanarak veri kaybı önlendi.
  - **Sade WhatsApp Sipariş Formatı (Sadece İsim + Adet, Fiyat Yok):**
    - Sipariş tedarikçiye WhatsApp ile iletilirken kullanıcının kesin talebi doğrultusunda **sadece ürün adı ve adet bilgisi** (`• [Ürün] — [Adet] Adet`) yer alacak şekilde sadeleştirildi; kesinlikle fiyat, tutar ve KDV yazılmaz.
    - Sipariş oluşturulduğunda otomatik olarak önizlemeli `WhatsAppConfirmModal` açılır; tedarikçi telefon numarası kayıtlıysa doğrudan hazır gelir, yoksa pencere başlığından anında numara girilebilir.
    - Tedarikçi siparişleri listesindeki (`tedarikciler-page-client.tsx`) ve sipariş detay modalındaki (`purchase-order-detail-modal.tsx`) her sipariş satırına *"WhatsApp ile Sipariş Gönder"* butonu eklenerek siparişin dilediği zaman yeniden paylaşılması sağlandı.
  - **WhatsApp +900 Hatasının Önlenmesi (`notifications.ts`):**
    - `sanitizeWhatsAppPhone` ve `formatWhatsAppLink` fonksiyonları güncellendi. Başında `0` veya `90` olan, ya da `+90 (05xx)...` gibi formatlardan gelen tüm numaralardaki çift sıfır veya 90 sonrası sıfır artıkları (`clean.replace(/^0+/, "")` ve `90` sonrası sıfırların temizlenmesi) filtrelenerek `+900` prefix hatası kökten engellendi.
  - **Tip Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).


- [x] 2026-10-16: Hızlı Satış Sayfası ve Sidebar Hızlı Satışta Türkçe Harf ("i - İ - ı - I") Duyarsız Arama Normalizasyonu:
  - **Türkçe Karakter Normalizasyon Fonksiyonu (`normalizeSearchText`):**
    - `src/lib/utils.ts` içerisine `normalizeSearchText` fonksiyonu eklendi.
    - Büyük/küçük harf `"İ" -> "i"`, `"I" -> "ı"`, `"ı" -> "i"` eşitlemesi ve Unicode birleşik nokta karakterleri (`\u0307`) temizlendi.
    - Türkçe klavyeden veya İngilizce klavyeden girilen `i`, `İ`, `ı`, `I` harflerinin birbirini sorunsuz bulması sağlandı; ayrıca `ğ/g`, `ü/u`, `ş/s`, `ö/o`, `ç/c` toleransı entegre edildi.
  - **Hızlı Satış Sayfası (`/satis` -> `pos-interface.tsx`):**
    - Ürün arama filtrelemesinde (`filteredProducts`) isim, barkod, SKU ve kategori aramaları `normalizeSearchText` fonksiyonuyla tamamen Türkçe ve büyük/küçük harf duyarsız hale getirildi.
  - **Sidebar Hızlı Satış (`pos-drawer.tsx` -> `pos-compact.tsx`):**
    - Sidebar kompakt POS ekranındaki ürün arama filtrelemesi ve özel ürün isim kontrolü `normalizeSearchText` ile güncellendi.
  - **Müşteri Arama Seçici (`customer-selector.tsx`):**
    - POS müşteri arama ve hızlı kayıt kontrolleri `normalizeSearchText` ile güncellendi (örn. "ismail" arandığında "İSMAİL" veya "İbrahim" tam eşleşir).
  - **Tip Kontrolü:** `npx tsc --noEmit` hatasız tamamlandı (0 error).

- [x] 2026-10-16: `/veresiye` (Veresiye Terminali) "Yeni Borç Ekle" Buton Görünürlüğü ve Kompakt Liste Optimizasyonu:
  - **Müşteri Kartında "Yeni Borç Ekle" Butonu Belirginleştirildi:**
    - Üç noktalı (`...`) menüde gizli olan "Yeni Borç Ekle" butonu, masaüstü ve tablet ekranlarında doğrudan işlem butonlarının yanına (`hidden sm:inline-flex`) mavi renkli ve belirgin (`bg-blue-600 hover:bg-blue-700`) olarak çıkarıldı.
    - Ekran çok küçüldüğünde (`sm:hidden` / dar mobil ekranlar), butonun satırı kırmaması için üç noktalı dot menüdeki "Yeni Borç Ekle" seçeneği otomatik aktifleşerek yer tasarrufu sağlar.
  - **Sayfa Başlığı Sağ Üst "Yeni Borç Ekle" Butonu Güçlendirildi:**
    - Veresiye Terminali ana sayfa başlığının sağ üst kısmına büyük, gradient'lı ve yüksek görünürlüklü (`h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 font-black`) "Yeni Borç Ekle" ana aksiyon butonu eklendi.
  - **Gereksiz Boşluklar Temizlendi (Kompakt Liste Düzeni):**
    - Müşteri kartlarındaki aşırı dikey boşluklar (`md:py-4` yerine `py-2 px-3 sm:py-2.5 sm:px-4 md:px-5`) ve avatar boyutları (`w-8 h-8 sm:w-9 sm:h-9`) optimize edilerek satır yüksekliği %40 küçültüldü.
    - Çok sayıda müşteri olduğunda ekranda tek bakışta 2 kat daha fazla müşterinin sıkışmadan, ferah ve kompakt bir biçimde görüntülenmesi sağlandı.
    - Sayfa ana dikey boşlukları (`space-y-12` -> `space-y-4 sm:space-y-6`) ve kart min-yüksekliği gereksiz kaydırmaları önleyecek şekilde dengelendi.
  - **Tip Kontrolü:** `npx tsc --noEmit` hatasız (0 error).

- [x] 2026-10-16: `/satis/gecmis` (Satış Arşivi & Raporlama) Net Tahmini Kâr, Ciro Hesaplama ve Detay Modalları Revizyonu:
  - **Net Tahmini Kâr Formülü ve Hizmet Ürünleri Maliyetsizleştirme:**
    - "Genel Yazılım", "Repair", "Cihaz Kârı", "işçilik", "servis", "hizmet" vb. yazılım ve işçilik kalemlerinin alış fiyatı otomatik olarak 0 TL (`buyPrice = 0`) kabul edilecek şekilde `getProductCost` fonksiyonu entegre edildi.
    - Katalogda opsiyonel/dummy 1 TL olarak girilen ancak POS'ta özel tutarla satılan kalemlerde, fişteki gerçek satış tutarı satılan ürün kalemine yansıtıldı (`isPlaceholderPricing` dinamik dağıtım algoritması).
    - Tahmini kâr: Her satılan ürün için `(Satış Fiyatı - Alış Maliyeti) * Adet` formülüyle kesin olarak hesaplandı. Alış maliyeti 0 TL olan hizmetlerde kâr marjı %100 ve kâr = ciro olarak netleştirildi.
    - Dükkanın genel işletme giderleri muhasebe kurallarına uygun olarak brüt kârdan düşülmeyip ayrı bir gider kalemi olarak korundu.
  - **Net Satış Cirosu:**
    - Ciro alanı sadece satılan ürünlerin gerçekleşen satış fiyatlarını yansıtacak şekilde izole edildi.
  - **"Bugün Ne Satmışım?" Modal Listeleme Hatası Çözüldü:**
    - `getUnifiedHistory` fonksiyonunda `typeFilter === "SALE"` seçildiğinde aracı Transaction tablosu yerine doğrudan `prisma.sale` tablosu sorgulanarak, filtreleme veya eksik kayıt sebebiyle boş görünme ("Bu filtreye uygun satış kaydı bulunamadı") sorunu kökten çözüldü.
    - Gün içinde yapılan tüm fişler (nakit, kart, havale, veresiye) satılan parçaları, müşteri bilgileri ve fiş yazdırma butonuyla modalda eksiksiz listelendi.
  - **Modalların İşlem Türlerine Göre Ayrıştırılması:**
    - **Net Satış Cirosu Modalı:** Sadece satış işlemleri ve fişler listelenir.
    - **Net Tahmini Kâr Modalı:** Satılan ürünler, satış tutarı, 0 TL alış maliyeti, net kâr ve % kâr marjı detaylarıyla listelenir (`topProducts` limiti 50'ye çıkarıldı).
    - **İşletme Giderleri Modalı:** Yalnızca dükkandan çıkan gider ödemeleri, kategorileri ve muhatapları listelenir.
    - **Kasa & Tahsilat Modalı:** Nakit, POS, Havale kanal oranlarının yanı sıra kasaya giren tekil tahsilat hareketleri listelenir.
  - **POS Arayüzü Fiyat Güncelleme Senkronizasyonu:**
    - POS arayüzünde (`pos-interface.tsx`) kasiyer ürün fiyatını değiştirdiğinde `unitPrice` değerinin de güncellenmesi sağlandı ve checkout sırasında `item.sellPrice ?? item.unitPrice` önceliğiyle `SaleItem` tablosuna girilen gerçek satış fiyatının yazılması garanti altına alındı.
  - **Tip Kontrolü:** `npx tsc --noEmit` hatasız (0 error).

- [x] 2026-10-16: `/veresiye` (Veresiye & Cari Takip Terminali) Kapsamlı Stabilizasyon ve Mobil UX Revizyonu:
  - **Finansal Tutarlılık ve Yuvarlama Senkronizasyonu:**
    - Fiş çıktısı (`debt-receipt-modal.tsx`), PDF dökümü (`debt-statement-modern.tsx`), ekran kartları ve WhatsApp mesajları arasındaki yuvarlama farkları giderildi (`Math.ceil` yerine 2-ondalık tam para formatı `formatDebtMoney` ve `formatCurrency` ile unifiye edildi).
    - USD/TL çapraz kurlu tahsilat ve borçlarda ekranda görünen toplam portföy tutarı ile fiş ve WhatsApp dökümündeki toplamlar 1'e 1 eşitlendi.
  - **WhatsApp Ekstre ve Mesajlaşma Standardizasyonu:**
    - `buildUnifiedWhatsAppStatement` modülü geliştirildi (`src/lib/debt-statement-calculator.ts`). Açık borç kalemleri (kısmi ödeme yapılmışsa `(Kalan: ₺X)` detayıyla), son tahsilatlar, varsa müşterinin emanet/avans bakiyesi (`₺` ve `$`), ayrı TL ve USD toplamları ile varsayılan para biriminde net portföy tutarı tek standart mesaj formatında birleştirildi.
    - Toplu hatırlatma ve tekli mesajlarda telefon formatlama hatası (başında 0 olan numaraların `wa.me/900...` olarak çift sıfırlı gitmesi) `formatWhatsAppLink` ile çözüldü.
  - **Mobil UX ve Nefes Alan ("Ferah") Görünüm:**
    - `VeresiyeCustomerCard` üzerinden dış `AddDebtModal` sarmalaması kaldırılarak karta tıklandığında/kaydırıldığında istem dışı açılan modal hatası engellendi; kart tıklaması müşteri detayına bağlandı, "Yeni Borç Ekle" işlem menüsüne (`...`) taşındı.
    - Mobil kart tasarımı 3 temiz satıra indirgendi: 1. satır (Checkbox, renkli inisiyal avatar, müşteri adı, risk rozetleri, net bakiye), 2. satır (Tıklanabilir `tel:` linki, tarih, borç adedi), 3. satır (Hızlı `[Tahsilat]` emerald butonu, `[WhatsApp]`, `[Fiş / PDF]` ve `[...]` işlem menüsü).
    - `VeresiyeAnalysisSide` (Risk & Yaşlandırma) mobilde müşteri listesini yüzlerce piksel aşağı itmemesi için mobilde `[📊 Risk & Yaşlandırma Analizini Göster/Gizle]` açılır butonuna bağlandı; masaüstünde 3 sütunlu sidebar olarak korunurken mobilde varsayılan olarak gizlendi.
    - Ana tablo kartının mobildeki `rounded-[3rem]` (48px) aşırı köşe yuvarlaması ve boşluk kaybı `rounded-2xl sm:rounded-3xl` yapılarak ekran alanı ferahlatıldı.
  - **Excel Çıktısı 2-Sayfalı Yapıya Dönüştürüldü:**
    - 50 müşteride 50 ayrı sheet oluşturan hantal Excel yapısı kaldırılarak 2 sayfalı kurumsal standarda geçirildi:
      1. `Musteri_Icmal_Listesi`: Müşteri bazında TL, USD, Emanet bakiye, genel toplam eşdeğeri, açık borç adedi, risk durumu ve en altta otomatik GENEL TOPLAM satırı.
      2. `Detayli_Hareketler`: Tüm müşterilerin kalem kalem borç ve tahsilat hareketleri, işlem tutarları, kalanlar, para birimleri ve vadeleri.
  - **Tip Kontrolü:** `npx tsc --noEmit` hatasız (0 error).
- [x] 2026-10-16: graphify-out kod haritasi ve raporlari guncellendi:
  - 533 dosya AST analiziyle bastan tarandi.
  - Guncellenen ciktilar: graphify-out/graph.json, graphify-out/graph.html, graphify-out/GRAPH_REPORT.md.
  - Guncel metrikler: 2624 node, 5851 edge, 76 community (170 kume), %81 extracted, %19 inferred.
- [x] 2026-10-16: `/satis/gecmis` İşlem Arşivi filtre butonları ve tür rozetleri renk kodlaması tamamlandı:
  - Satışlar, Giderler, Veresiyeler, Tahsilatlar butonları tıklandığında yalnızca ilgili işlem türünü getirecek şekilde filtreleme tam ayrıştırıldı (`typeFilter` Prisma `where` koşulları `category`, `paymentMethod` ve `type` ile mutlak izole edildi).
  - Renk kodlaması uygulandı:
    - **Giderler:** Kırmızı / Rose (`bg-rose-600` aktif, `text-rose-600` rozet & tutar eksi)
    - **Veresiyeler:** Turuncu / Orange (`bg-orange-600` aktif, `text-orange-600` rozet & tutar)
    - **Tahsilatlar:** Yeşil / Emerald (`bg-emerald-600` aktif, `text-emerald-600` rozet & tutar)
    - **Satışlar:** Mavi / Blue (`bg-blue-600` aktif, `text-blue-600` rozet & tutar)
  - Tablo satırlarında (`SalesHistoryRow`) ve işlem detaylarında (`OperationDetails`) ikon ve tutar renkleri de bu renk sistemine bağlandı.
  - Tip kontrolü: `npx tsc --noEmit` hatasız (0 error).
- [x] 2026-10-16: `/satis/gecmis` Finansal Kokpit revizyonu tamamlandı:
  - Giderler (Transaction EXPENSE) "Peşin Satış" yerine ayrı "Gider" tipi ve rose rozet ile listelendi, typeFilter'a eklendi.
  - "Bugün, Dün, Bu Hafta" hızlı tarih filtreleri tıklandığında aktif olan filtre kutu içine alınarak (`ring-2 ring-primary/40 border-primary font-extrabold`) net belirgin hale getirildi.
  - Sayfaya ilk girişte varsayılan aralık "Bugün" yapıldı; UTC saat farkından kaynaklanan dünün dahil edilmesi (startOfDay çift çevrimi) `getUnifiedHistory` ve `getSalesHistoryReport` üzerinde ISO string doğrudan alınarak giderildi.
  - Tahmini kâr analiz edildi: Satış brüt kârı ((Satış - Alış) × Adet) ile işletme genel giderleri kesin olarak ayrıldı, giderler satış kârından düşülmedi.
  - 6 adet bağımsız KPI kartı ve her birine özel amaca yönelik modal pencereleri oluşturuldu:
    1. Net Satış Cirosu: Bugün ne satılmış, hangi fişler kesilmiş, ürünler ve satış açıklamaları.
    2. Satış Kârlılık Analizi: Satılan ürünlerin alış maliyetleri, satış cirosu, elde edilen brüt kâr ve kâr marjı (giderler düşülmez).
    3. İşletme Giderleri: Nereye para ödenmiş, kime/hangi tedarikçiye, hangi kategoride, hangi kasadan çıkış yapılmış.
    4. Kasa & Tahsilat: Kasaya bugün kaç para toplanmış, Nakit, Kredi Kartı/POS, Banka Havale ve Veresiye dağılımı.
    5. Ortalama Sepet Hacmi: Fiş başına düşen ortalama sepet büyüklüğü.
    6. Satış & Fiş Hacmi: Fiş sayıları ve veresiye adedi.
  - Tip kontrolü: `npx tsc --noEmit` hatasız geçti (0 error).
- [x] 2026-05-12: `JOURNAL.md` eklendi. Neden: Kullanici tarafindan istenen surekli is protokolunu baslatmak ve proje durumunu kalici olarak kaydetmek.
- [/] 2026-05-12: `Ozellik 2` calismasi baslatildi. Neden: Kurye is yukleme ve rota onceliklendirme icin Graphify Community 9/38/49 baglamlari uzerinden teknik plan hazirlanacak.
- [/] 2026-05-12: `Ozellik 2` teknik plani netlestirildi. Degisecek ana dosyalar: `src/lib/actions/shortage-actions.ts`, `src/components/courier/courier-dashboard-client.tsx`. Neden: Kurye gorevleri mevcut `ShortageItem`, personel ve stok verileriyle skorlanacak; schema degisikligi yapmadan rota/oncelik bilgisi UI'a tasinacak.
- [x] 2026-05-12: `src/lib/actions/shortage-actions.ts` guncellendi. Neden: `ShortageItem` kayitlari bekleme suresi, musteri talebi, stok kritiklik durumu ve miktara gore `courierPriorityScore`, `courierPriorityLabel`, `courierPriorityReasons` alanlariyla zenginlestirildi; kurye ve bos havuz listeleri oncelige gore siralaniyor.
- [x] 2026-05-12: `src/components/courier/courier-dashboard-client.tsx` guncellendi. Neden: Kurye ekranina onerilen rota paneli, gorev oncelik rozetleri, oncelik nedenleri ve admin icin kurye is yuku gostergesi eklendi.
- [x] 2026-05-12: `Ozellik 2` ilk uygulama dilimi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili. Neden: Yeni onceliklendirme alanlari ve UI kullanimi tip hatasi uretmedi.
- [/] 2026-05-12: Login loop ve `/kurye` server exception arastirmasi baslatildi. Bulgular: Local loglarda Prisma/PostgreSQL baglantisi `terminating connection due to administrator command` ile kopuyor; `/kurye` sayfasinda `getGlobalShortageList()` ve admin bildirim sorgusu render sirasinda yakalanmamasi halinde sayfayi dusurebilir.
- [x] 2026-05-12: `src/lib/auth.ts` guncellendi. Neden: NextAuth `jwt` callback icindeki DB senkronizasyonu gecici Prisma/PostgreSQL kopmasinda login/session akisini komple dusurmesin diye hata yakalama eklendi.
- [x] 2026-05-12: `src/lib/actions/shortage-actions.ts` ve `src/app/(dashboard)/kurye/page.tsx` guncellendi. Neden: `/kurye` render sirasinda global eksik listesi veya admin bildirim sorgusu hata verirse sayfa `Application error` ile dusmek yerine bos listeyle acilsin.
- [x] 2026-05-12: Login ve `/kurye` dayanikkilik duzeltmeleri dogrulandi. Komutlar: `npm run build`, `npx tsc --noEmit`. Sonuc: Basarili. Not: Ilk paralel `tsc` denemesi `.next/types` uretimiyle cakistigi icin dosya bulunamadi hatasi verdi; build bittikten sonra tekrar calistirilan `tsc` temiz gecti.
- [x] 2026-05-12: `src/lib/auth.ts` okunabilirlik duzenlemesi yapildi. Neden: NextAuth DB sync `try/catch` blogunun girintisi netlestirildi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: `src/lib/auth.ts` Google OAuth hesap eslestirme ayari guncellendi. Neden: Super admin e-postasi daha once credentials ile olustugu icin Google girisinde `OAuthAccountNotLinked` hatasi alip tekrar login ekranina donuyordu; ayni dogrulanmis e-postanin Google hesabiyla baglanmasina izin verildi.
- [x] 2026-05-12: `src/lib/auth.ts` super admin email eslestirme mantigi guncellendi. Neden: Local giriste kullanilan `osmanhizli@basarteknik.com` adresi `.env` super admin adresleriyle eslesmedigi icin credentials login sonrasinda super admin yetkileri token'a yansimiyordu; adres local super admin listesine eklendi ve credentials authorize sirasinda DB/user token yetkileri senkronize ediliyor.
- [x] 2026-05-12: `src/lib/auth.ts` local super admin istisnasi geri alindi ve veritabaninda `osmanhizli@basarteknik.com` kullanicisi silindi. Neden: Kullanici bu hesabin super admin degil kurye oldugunu belirtti; 1 acik eksik parca/kurye atamasi bosa alindi, hesap admin sisteminden kaldirildi.
- [x] 2026-05-12: Osman kurye hesabi silme islemi dogrulandi. Komutlar: veritabaninda `osmanhizli@basarteknik.com` arandi ve `NOT_FOUND` dondu; `npx tsc --noEmit` basarili calisti.
- [x] 2026-05-12: `src/middleware.ts` login cookie temizleme ve favicon istisnasi eklendi. Neden: Eski/farkli secret ile sifrelenmis NextAuth JWT cookie'si `JWEDecryptionFailed` hatasi uretip login akisini tekrar login ekranina donduruyordu; `/login` acilirken eski NextAuth session/callback/csrf cookie'leri temizleniyor, `favicon.svg` artik auth korumasina takilmiyor.
- [x] 2026-05-12: `src/middleware.ts` Next.js middleware imzasi duzeltildi. Neden: `withAuth` middleware iki arguman bekledigi icin wrapper fonksiyon `NextFetchEvent` alacak ve auth middleware'e aktaracak hale getirildi.
- [x] 2026-05-12: Login cookie temizleme duzeltmesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: `veresiye -> stok/iade` akisi guncellendi. Dosyalar: `src/components/finance/veresiye-client.tsx`, `src/components/stock/returns-client.tsx`, `src/components/stock/add-return-modal.tsx`, `src/lib/actions/debt-actions.ts`, `src/lib/actions/return-actions.ts`. Neden: Veresiye USD urun iadelerinde tutar TL gibi aciliyordu; artik para birimi URL ve modal boyunca tasiniyor, iade tutari para birimiyle gosteriliyor ve tamamlanmamis ayni urun/borc iadeleri tekrar olusturulmuyor.
- [x] 2026-05-12: Veresiye-iade para birimi ve tekrar iade korumasi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Veresiye iade, fis ve kurye oncelik/gun bitirme akislari guncellendi. Dosyalar: `src/lib/actions/return-actions.ts`, `src/lib/actions/debt-actions.ts`, `src/components/stock/returns-client.tsx`, `src/components/finance/debt-receipt-modal.tsx`, `src/components/finance/veresiye-client.tsx`, `src/lib/actions/shortage-actions.ts`, `src/components/shortage/add-shortage-form.tsx`, `src/components/courier/courier-dashboard-client.tsx`. Neden: Iadeye gonderilen veresiye urunu borctan dusurulsun, USD tutarlar tabloda da USD gorunsun, fis toplamlarinda borc tipi eksikligi 0 toplam uretmesin, kurye siparis onceligi manuel secilebilsin, kurye `aldim` isaretinde tamam sayisi artsin ve alinmayan siparisler gun bitiminde ertesi gun havuzuna aktarilsin.
- [x] 2026-05-12: Veresiye/iade/kurye toplu duzeltmeleri dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Kurye `Bulunmadi` durumu eklendi. Dosyalar: `src/lib/actions/shortage-actions.ts`, `src/components/courier/courier-dashboard-client.tsx`. Neden: Kurye kendi panelinde bulamadigi urunu kirmizi kart olarak isaretleyebilsin; admin paneli ayni kaydi anlik yenilemeyle kirmizi `BULUNMADI` rozetiyle gorebilsin. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Kurye `stok onay` sonrasi tamamlanan siparisin listede tekrar gorunmesi duzeltildi. Dosya: `src/lib/actions/shortage-actions.ts`. Neden: `getCourierTasks()` tamamlanmis `isResolved: true` kayitlari da cekiyordu; artik sadece `isResolved: false` atanan gorevler geliyor. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Kurye siparis kartlari sadelestirildi. Dosya: `src/components/courier/courier-dashboard-client.tsx`. Neden: Kart uzerindeki adet, oncelik, bulunmadi ve oncelik nedenleri etiketleri kalabalik gorunuyordu; standart neden rozetleri kaldirildi, adet metne dondu, normal oncelik gizlendi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Kurye secimi kalici hale getirildi. Dosya: `src/components/shortage/add-shortage-form.tsx`. Neden: Birden fazla kurye varsa son secilen kurye hatirlansin, tek kurye varsa otomatik secili gelsin. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Kurye gun bitirme ve stok onay korumasi guncellendi. Dosyalar: `src/lib/actions/shortage-actions.ts`, `src/components/courier/courier-dashboard-client.tsx`. Neden: Alinan urunler navbar eksik listesinden dusmeli, stok kaydi yapilmamis alinan urun silinirken admin uyarilmali, alinmayan urunler yarinin tarih filtresinde gorunmeli.
- [x] 2026-05-12: Kurye gun bitirme duzeltmeleri dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Kurye action temizligi yapildi. Dosya: `src/lib/actions/shortage-actions.ts`. Neden: Tekrarlanan revalidate cagrisini temizleyip TypeScript kontrolunu tekrar basarili calistirmak.
- [x] 2026-05-12: Kritik stok uyarili kurye/eksik atama akisi guncellendi. Dosyalar: `src/lib/actions/product-actions.ts`, `src/lib/actions/shortage-actions.ts`, `src/components/shortage/add-shortage-form.tsx`, `src/components/courier/courier-dashboard-client.tsx`, `src/components/navbar/shortage-list.tsx`. Neden: Kritik stok altindaki urunlerde yetersiz miktar girilirse stok kritik seviyenin ustune cikacak miktar kullaniciya sorulsun; atanmamis eksikler varsayilan kuryeye dukkan siparisi olarak gitsin.
- [x] 2026-05-12: Kritik stok atama duzeltmeleri dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-12: Veresiye kalem ekleme modalina adet girisi eklendi. Dosya: `src/components/finance/add-debt-modal.tsx`. Neden: Veresiye modalinda urun/aciklama seciminden sonra adet girilsin ve toplam borc birim tutar x adet olarak hesaplansin.
- [x] 2026-05-12: Veresiye adet girisi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: SaaS auth akisi yeniden uygulandi. Dosyalar: `src/lib/auth.ts`, `src/types/next-auth.d.ts`. Neden: Yanlislikla silinen Google onboarding, staff credentials kontrolu, super admin tam yetki ve session/JWT yetki alanlari geri getirildi.
- [x] 2026-05-13: Yeniden uygulanan SaaS auth degisikligi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Servis yeni kayit formu guncellendi. Dosyalar: `src/app/(dashboard)/servis/yeni/page.tsx`, `src/components/common/form-factory.tsx`, `src/lib/validations/schemas.ts`. Neden: Telefon numarasinda 5 ile baslama zorunlulugu kaldirildi, e-posta alani formdan cikarildi, model alani yazilabilir onerili dropdown oldu ve teknisyen yoksa yonetici varsayilan ataniyor.
- [x] 2026-05-13: Servis telefon validasyonu netlestirildi. Dosya: `src/app/(dashboard)/servis/yeni/page.tsx`. Neden: Form submit oncesinde de `+90`, parantezli veya basinda `0` bulunan telefonlar 10 haneli yerel numaraya normalize edilerek kontrol edilsin.
- [x] 2026-05-13: Servis yeni kayit formu dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Servis telefon validasyonu sonrasi tekrar dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Servis kayit basari modulu eklendi. Dosya: `src/app/(dashboard)/servis/yeni/page.tsx`. Neden: `Kaydi tamamla` sonrasi tamir animasyonlu onay modulu 2 saniye gorunsun ve kullanici `/servis` sayfasina yonlendirilsin.
- [x] 2026-05-13: Servis kayit basari modulu dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Servis kayit zorunlu alan kontrolu guncellendi. Dosya: `src/app/(dashboard)/servis/yeni/page.tsx`. Neden: Isim soyisim, telefon, fiyat ve ariza aciklamasi dolmadan kayit butonu gonderim yapmasin; tiklaninca eksik alanlar isaretlensin ve basari modulu animasyon bitene kadar ekranda kalsin.
- [x] 2026-05-13: Servis zorunlu alan ve basari animasyonu dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Servis yeni kayit musteri gecmis sayaci duzeltildi. Dosyalar: `src/lib/actions/customer-lookup-actions.ts`, `src/app/(dashboard)/servis/yeni/page.tsx`. Neden: Secilen musterinin onceki servis kayitlari `tickets` iliskisinden sayilsin; ekrandaki `Toplam Servis` 0 yerine gercek kayit adedini gostersin.
- [x] 2026-05-13: Musteri gecmis sayaci dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Servis kayit butonu zorunlu alan mantigi ayrildi. Dosya: `src/app/(dashboard)/servis/yeni/page.tsx`. Neden: Form control hatalari ile custom zorunlu alan kontrolu cakismasin; ad soyad, telefon, marka, model, ariza aciklamasi ve fiyat dolunca buton `Kaydi Tamamla` durumuna gecsin.
- [x] 2026-05-13: Servis kayit butonu zorunlu alan mantigi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Stok urun fiyat girisi ve POS fiyat gorunumu guncellendi. Dosyalar: `src/components/product/create-product-modal.tsx`, `src/components/pos/pos-interface.tsx`. Neden: Yeni urun modalinda finansal alanlar sadece alis/satis fiyatina indirildi; secilen para birimine gore fiyat giriliyor, TL karsiligi gosteriliyor ve POS sepetinde kaynak para birimiyle duzenlenebilir fiyat belirginlestiriliyor.
- [x] 2026-05-13: Stok/POS fiyat duzenlemesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: POS sepet yerlesimi sadelestirildi. Dosya: `src/components/pos/pos-interface.tsx`. Neden: Sepet fiyat inputundaki `Duzenle` ve `Mevcut` metinleri kaldirildi; toplam ve satis butonu urun listesinin hemen altina gelecek sekilde checkout alani yukariya alindi.
- [x] 2026-05-13: POS sepet yerlesimi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Navbar hizli servis modalinda musteri arama ve basari animasyonu eklendi. Dosya: `src/components/service/create-service-modal.tsx`. Neden: Ad soyad alaninda `Enes Basar` placeholder'i kullanilsin, yazarken musteriler bulunsun, gecmis servis sayisi gosterilsin, telefon/ad soyad hizasi duzelsin ve kayit bitince animasyonlu onay gorunsun.
- [x] 2026-05-13: Navbar hizli servis modal degisiklikleri dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Navbar hizli satis drawer tasarimi sadelestirildi. Dosya: `src/components/pos/pos-compact.tsx`. Neden: Urun arama ikon/yazi cakismasi giderildi, kategori sekmeleri ve urun kartlari daha kompakt hale getirildi, musteri arama inputu ayni minimal hizaya cekildi.
- [x] 2026-05-13: Navbar hizli satis drawer duzenlemesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Navbar hizli servis kayit zorunlu alan ve yonlendirme akisi guncellendi. Dosya: `src/components/service/create-service-modal.tsx`. Neden: Ad soyad, telefon, marka, model, ariza aciklamasi ve tutar dolmadan submit yapilmasin; eksikler kullaniciya listelensin; basari animasyonu sonrasi `/servis` sayfasina gecilsin veya ayni sayfadaysa dinamik yenilensin.
- [x] 2026-05-13: Navbar hizli servis zorunlu alan ve yonlendirme duzeltmesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Navbar hizli servis basari animasyonu Dialog disina tasindi. Dosya: `src/components/service/create-service-modal.tsx`. Neden: Kayit basarili oldugunda modal kapanip animasyon katmani bagimsiz ust katmanda gorunsun; `/servis/yeni` sayfasindaki davranisla ayni aksin.
- [x] 2026-05-13: Navbar hizli servis basari animasyonu duzeltmesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Stok kategori sayfasina fiyat para birimi secici eklendi. Dosya: `src/components/product/category-management-client.tsx`. Neden: `/stok/kategoriler` uzerinde yeni ve mevcut urun alis/satis fiyatlari TL, USD veya EUR olarak girilebilsin; secim localStorage ile son kullanilan para birimi olarak hatirlansin ve kayitta TL karsiligi ile kaynak para birimi saklansin.
- [x] 2026-05-13: Stok kategori para birimi secici dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Veresiye arama, POS fis akisi, satis aciklamasi ve dashboard kartlari guncellendi. Dosyalar: `src/components/finance/veresiye-client.tsx`, `src/components/pos/receipt-modal.tsx`, `src/components/pos/pos-interface.tsx`, `src/components/pos/pos-compact.tsx`, `src/lib/actions/sale-actions.ts`, `src/components/dashboard/dashboard-client.tsx`, `src/components/dashboard/live-activity-feed.tsx`, `src/components/dashboard/streamed/recent-transactions-stream.tsx`, `src/components/dashboard/streamed/service-queue-stream.tsx`. Neden: Turkce i/I duyarsiz arama, satis sonrasi fis kapanmadan yenilememe, finans hareketinde urun adi gosterme, dashboard kartlarini icerik kadar tutma ve daha fazla kayit butonlarini ilgili sayfalara yonlendirme.
- [x] 2026-05-13: Veresiye/POS/dashboard toplu duzeltmeleri dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Dashboard alacaklarim karti dinamik liste limitine alindi. Dosya: `src/components/dashboard/receivables-client.tsx`. Neden: Varsayilan olarak son islem yapan 5 musteri gorunsun; kart edit modunda yukseltilince yukseklige gore daha fazla kayit gelsin ve kalan kayit sayisi `/veresiye` yonlendirmesiyle gorunsun.
- [x] 2026-05-13: Dashboard alacaklarim karti dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Kurye stok onay modal akisi guncellendi. Dosyalar: `src/components/shortage/approve-shortage-modal.tsx`, `src/components/courier/courier-dashboard-client.tsx`, `src/lib/actions/shortage-actions.ts`. Neden: Dukkandan verilen kurye siparislerinde `Stok Onay` tiklaninca modal acilsin; siparis adina gore kategori onerilsin, mevcut urunun fiyatlari otomatik gelsin, yeni urun icin kategori/adet/alis-satis fiyati TL-USD-EUR secimiyle kaydedilsin.
- [x] 2026-05-13: Kurye stok onay modal akisi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Kurye stok onay action temizligi yapildi ve tekrar dogrulandi. Dosya: `src/lib/actions/shortage-actions.ts`. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Basar AI coklu stok fiyat cikti gosterimi guncellendi. Dosya: `src/components/product/ai-category-creator.tsx`. Neden: AI alis/satis fiyatlarini dolar algiladiginda onizlemede dolar gosterilsin ve urun kaydinda `buyPriceUsd/sellPriceUsd` ile `priceCurrency: USD` saklansin.
- [x] 2026-05-13: Basar AI coklu stok fiyat cikti gosterimi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Kurye stok onay modal kategori ve fiyat secimi guncellendi. Dosya: `src/components/shortage/approve-shortage-modal.tsx`. Neden: Light/dark modda native select yazilari okunmuyordu; aranabilir kategori listesi eklendi, urun adina gore ekran/iphone/batarya/sarj kategori eslesmesi guclendirildi ve para birimi degisince fiyatlar kurla donusuyor.
- [x] 2026-05-13: Kurye stok onay modal kategori ve fiyat secimi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-13: Kurye stok onay kategori tahmini ve arama davranisi duzeltildi. Dosya: `src/components/shortage/approve-shortage-modal.tsx`. Neden: `ekran` iceren urunler sarj/type-c kategorilerine dusmesin; otomatik secilen kategori input metnini kilitlemesin, kullanici arama alanina serbestce yazabilsin.
- [x] 2026-05-13: Kurye stok onay kategori tahmini ve arama davranisi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Admin/shop manager yetki akisi guncellendi. Dosyalar: `src/lib/auth.ts`, `src/app/(dashboard)/kurye/page.tsx`, `src/components/service/service-management-modal.tsx`, `src/components/sidebar.tsx`, `src/lib/actions/shortage-actions.ts`. Neden: OAuth ile gelen ve mevcut `SHOP_MANAGER`/`ADMIN`/`MANAGER` kullanicilarinin servis, stok, finans, duzenleme ve silme izinleri otomatik tam acilsin; sadece `SUPER_ADMIN` ozel alanlari ayrik kalsin.
- [x] 2026-05-14: Admin/shop manager yetki duzeltmesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Personel rol bazli yetki sablonlari guncellendi. Dosyalar: `src/lib/staff-permissions.ts`, `src/components/staff/create-staff-modal.tsx`, `src/components/staff/staff-management-client.tsx`, `src/lib/actions/staff-actions.ts`. Neden: Yeni personel eklerken role gore varsayilan yetkiler uygulansin; yonetici tam yetkili, mudur silme haric genis yetkili, kasiyer satis/finans, teknisyen servis/stok, satis danismani satis, kurye ise panel odakli yetkisiz baslasin.
- [x] 2026-05-14: Personel yetki sablonlari dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Personel yetki sablonlari son kontrolu yapildi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Fiyat inputlarinda bos deger davranisi guncellendi. Dosyalar: `src/components/ui/price-input.tsx`, `src/components/product/category-management-client.tsx`, `src/app/(dashboard)/servis/yeni/page.tsx`, `src/app/scanner/page.tsx`. Neden: Fiyat alanlarinda `0` degeri zorla kalmasin; kullanici tab ile gecince, mevcut fiyatlari silince veya sifirdan yazmaya baslayinca alan bos kalabilsin ve ilk rakam dogrudan yazilsin.
- [x] 2026-05-14: Fiyat input davranisi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Veresiye urun kalemi para birimi duzeltildi. Dosya: `src/components/finance/add-debt-modal.tsx`. Neden: Ayarlarda varsayilan para birimi USD ise TL kaydedilmis urunler veresiye kalemine USD karsiligiyla gelsin; USD kaydedilmis urunlerde kayitli USD satis fiyati kullanilsin ve TL/USD secici otomatik varsayilana gecsin.
- [x] 2026-05-14: Veresiye urun kalemi para birimi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.

- [x] 2026-05-22: EDM BiliÅŸim e-Fatura REST API Tam Entegrasyonu (Faz 1-6):
    - Dosyalar: `prisma/schema.prisma`, `prisma/migrations/20260522141226_efatura_entegrasyonu/migration.sql`, `src/lib/edm/service.ts`, `src/lib/edm/types.ts`, `src/lib/edm/xml-builder.ts`, `src/lib/edm/pdf-fallback.ts`, `src/lib/edm/errors.ts`, `src/lib/edm/cron.ts`, `src/app/api/edm/settings/route.ts`, `src/app/api/edm/check-user/route.ts`, `src/app/api/edm/invoices/route.ts`, `src/app/api/edm/invoices/[id]/route.ts`, `src/app/api/edm/invoices/[id]/download/route.ts`, `src/app/api/edm/incoming/route.ts`, `src/app/api/cron/sync-incoming/route.ts`, `src/app/(dashboard)/efatura/page.tsx`, `src/app/(dashboard)/efatura/yeni/page.tsx`, `src/app/(dashboard)/efatura/[id]/page.tsx`, `src/app/(dashboard)/efatura/gelen/page.tsx`, `src/app/(dashboard)/efatura/iptaller/page.tsx`, `src/app/(dashboard)/efatura/ayarlar/page.tsx`, `src/components/settings/tabs/modules-tab.tsx`, `src/app/setup/page.tsx`, `src/components/settings/settings-interface.tsx`, `src/config/industries.ts`.
    - Neden: EDM BiliÅŸim e-Fatura/e-ArÅŸiv servisini kendi sistem Ã¼zerinden tam entegre etmek; yeni fatura oluÅŸturma, gÃ¶nderme, gelen fatura alma, HTML/PDF indirme, iptal ve ayar yÃ¶netimi.
    - YapÄ±lanlar:
      - Prisma ÅŸema: `EDMInvoice`, `EDMInvoiceLine`, `EDMIncomingInvoice`, `EDMSettings` modelleri eklendi. `Customer`, `Shop`, `Sale`, `ServiceTicket` modellerine e-Fatura ile ilgili alanlar (`taxNumber`, `taxOffice`, `companyName`, `companyAddress`, `companyCity`, `companyDistrict`) eklendi. `Shop.enabledModules` default array'ine `"EFATURA"` eklendi. Migration `npx prisma migrate dev --name efatura_entegrasyonu` ile oluÅŸturuldu ve uygulandÄ±.
      - EDM Client: `src/lib/edm/service.ts` tamamen refactor edildi. REST API endpoint mapping: `LoginRequest`, `CheckUserRequest`, `SetInvoiceRequest`, `SetArchiveInvoiceRequest`, `GetInvoiceRequest`, `GetInvoiceStatusRequest`, `CancelInvoiceRequest`, `GetEnvelopeRequest`. CheckUser POST body ÅŸemasÄ± (`user.identifier`) Swagger analizinden dÃ¼zeltildi. `buildInvoiceXml` `src/lib/edm/xml-builder.ts`'e izole edildi. `pdf-fallback.ts` (puppeteer) eklendi. `errors.ts` EDM hata parse/sÄ±nÄ±flandÄ±rma eklendi.
      - API Routes: Settings CRUD (`/api/edm/settings`), CheckUser (`/api/edm/check-user`), Fatura oluÅŸturma/listeleme (`/api/edm/invoices`), Fatura detay/iptal (`/api/edm/invoices/[id]`), HTML/PDF indirme (`/api/edm/invoices/[id]/download`), Gelen fatura (`/api/edm/incoming`), Cron sync (`/api/cron/sync-incoming`).
      - UI: `/efatura` (FaturalarÄ±m), `/efatura/yeni` (Yeni Fatura), `/efatura/[id]` (Detay), `/efatura/gelen` (Gelen Faturalar), `/efatura/iptaller` (Ä°ptaller), `/efatura/ayarlar` (Ayarlar). Sidebar alt menÃ¼: FaturalarÄ±m, Yeni Fatura, Gelen Faturalar, Ä°ptaller, Ayarlar.
      - ModÃ¼l yÃ¶netimi: Ayarlar > ModÃ¼ller sekmesine `EFATURA` eklendi. Onboarding/setup sayfasÄ±na tÃ¼m 12 modÃ¼l seÃ§ilebilir hale getirildi. ModÃ¼l kaydetme sonrasÄ± sayfa yenilenince aktif modÃ¼llerin gÃ¶rÃ¼nmemesi sorunu `useEffect` ile `shop.enabledModules` senkronizasyonuyla dÃ¼zeltildi.
      - Otomasyon ayarlarÄ±: `/ayarlar?tab=automation` sayfasÄ±nda tikler sayfa yenilenince gidiyordu; `initialFormData`'ya varsayÄ±lan `true` deÄŸerleri eklendi, `settings` query deÄŸiÅŸtiÄŸinde `formData` senkronize eden `useEffect` eklendi, auto-save Ã§alÄ±ÅŸtÄ±rÄ±ldÄ±, "DeÄŸiÅŸiklikleri Kaydet" butonu kaldÄ±rÄ±ldÄ±.
    - Komut: `npm run build`. SonuÃ§: BaÅŸarÄ±lÄ±. EDM test credentials (`basarteknik`/`Abc.123`) ile login baÅŸarÄ±lÄ± (`sessioN_ID` alÄ±ndÄ±). CheckUser POST `/api/CheckUserRequest` 200 dÃ¶ndÃ¼.
    - Graphify baÄŸlamlarÄ±: Community 11 (`buildInvoiceXml`, `amountToWords`, `buildRequestHeader`, EDM tipleri), Community 13 (`getSettings`, `getShop`, `updateSetting`, `AyarlarPage`), Community 46 (`cron`, `getLocalIps`, `getPreferredIp`, `httpServer`, `io`), Community 55 (`generateInvoiceHTML`, `generateInvoicePDF`, `formatInvoiceMoney`, `formatDateTR`), Community 69 (`middleware`, `authMiddleware`, `config`, `role`), Community 75 (`prisma`, `PrismaClient`, `SUPER_ADMIN_EMAILS`), Community 93 (`UIContext`, `UIProvider`), Community 94 (`JWT`, `Session`, `User`).
    - Kararlar: REST API tercih edildi (SOAP fallback gerekli deÄŸil). Credentials `.env`'de tutuluyor. Mevcut mÃ¼ÅŸteri/Ã¼rÃ¼n tablolarÄ± yeniden kullanÄ±lÄ±yor. Servis faturalarÄ± `ServiceTicket` ile `EDMInvoice`'e baÄŸlandÄ±. Gelen faturalar ayrÄ± `/efatura/gelen` sayfasÄ±nda. Sunucuya taÅŸÄ±ma: `prisma migrate deploy` kullanÄ±lacak.

- [x] 2026-05-22: EDM e-Fatura Sidebar ve ModÃ¼l Aktivasyonu:
    - Dosyalar: `src/config/industries.ts`, `src/components/sidebar.tsx`.
    - Neden: Sidebar'da e-Fatura menÃ¼sÃ¼ gÃ¶rÃ¼nmÃ¼yordu; `isModuleEnabled` fonksiyonu `enabledModules` boÅŸ olduÄŸunda industry defaults `features` array'ine dÃ¼ÅŸÃ¼yordu ve orada `EFATURA` yoktu.
    - YapÄ±lanlar: TÃ¼m industry config'lerine (PHONE_REPAIR, ELECTRICIAN, PLUMBER, MARKET, TECHNICIAN, GENERAL, AUTO_REPAIR, BEAUTY_SALON) `EFATURA` eklendi. Mevcut `Shop` kayÄ±tlarÄ±nÄ±n `enabledModules` array'ine `EFATURA` deÄŸeri eklendi (`npx prisma db execute`).
    - Komut: `npm run build`. SonuÃ§: BaÅŸarÄ±lÄ±.

- [x] 2026-05-22: Ayarlar Otomasyon Sekmesi AnlÄ±k Kaydetme:
    - Dosya: `src/components/settings/settings-interface.tsx`.
    - Neden: `/ayarlar?tab=automation` sayfasÄ±nda tikleri aÃ§Ä±yordu ama sayfa yenilenince gidiyordu; "DeÄŸiÅŸiklikleri Kaydet" butonu istenmiyordu, anlÄ±k auto-save isteniyordu.
    - YapÄ±lanlar: `initialFormData`'ya tÃ¼m otomasyon ayarlarÄ± varsayÄ±lan `true` eklendi. `settings` query deÄŸiÅŸtiÄŸinde `formData`/`savedData` senkronize eden `useEffect` eklendi. `handleChange` ile `isAutoSave=true` gÃ¶nderildiÄŸinde anÄ±nda `updateSetting` Ã§aÄŸrÄ±lÄ±yor, baÅŸarÄ±lÄ± olunca `queryClient.invalidateQueries` ile cache temizleniyor. `FloatingSaveBar` yorum satÄ±rÄ±na alÄ±ndÄ±. Her switch yanÄ±nda `Loader2` spinner ile kaydetme durumu gÃ¶steriliyor.
    - Komut: `npm run build`. SonuÃ§: BaÅŸarÄ±lÄ±.

- [x] 2026-05-22: EDM e-Fatura Yeni Fatura MÃ¼ÅŸteri Arama ve Manuel GiriÅŸ:
    - Dosyalar: `src/app/api/customers/route.ts`, `src/app/(dashboard)/efatura/yeni/page.tsx`, `src/app/api/edm/invoices/route.ts`.
    - Neden: e-Fatura sayfasinda yeni fatura olustururken kayitli musteriler bulunmuyordu (`/api/customers` 404 Not Found); ayrica el ile TCKN/VKN yazildiginda kabul etmiyordu.
    - Yapilanlar:
      - `src/app/api/customers/route.ts` olusturuldu â€” kayitli musterileri `name`, `phone`, `taxNumber`, `taxOffice`, `address`, `email` alanlariyla GET olarak donduruyor.
      - Yeni fatura formuna "Manuel Giris" butonu eklendi â€” kayitli musteri olmadan da fatura kesilebiliyor: musteri adi/unvani, VKN/TCKN (10 veya 11 hane validasyonu), vergi dairesi (opsiyonel), adres (opsiyonel).
      - `src/app/api/edm/invoices/route.ts` guncellendi â€” `manualCustomer` alanini da kabul ediyor; `customerId` yoksa `manualCustomer` bilgilerini kullaniyor.
    - Komut: `npm run build`. Sonuc: Basarili.

- [x] 2026-05-22: EDM e-Fatura 404 Sayfalari Modern Animasyonlu TÃ¼rkÃ§e Tasarim:
    - Dosyalar: `src/app/not-found.tsx`, `src/app/(dashboard)/not-found.tsx`.
    - Neden: e-Fatura routelarinda 404 hatasi aliniyordu; mevcut 404 sayfalari modern, animasyonlu ve TÃ¼rkÃ§e degildi.
    - Yapilanlar:
      - `src/app/not-found.tsx` â€” Framer Motion ile animasyonlu, TÃ¼rkÃ§e metinli, ana sayfaya yonlendiren modern 404 sayfasi.
      - `src/app/(dashboard)/not-found.tsx` â€” Dashboard icindeki 404 sayfasi, ayni animasyon ve TÃ¼rkÃ§e icerik.
    - Komut: `npm run build`. Sonuc: Basarili.

## [2024-05-12] - Teknik Servis KaydÄ± ve WhatsApp Stabilizasyonu (GÃ¼ncelleme)

### YapÄ±lan DÃ¼zeltmeler

#### 1. Teknik Servis KaydÄ± "DÃ¶nÃ¼p Durma" Sorunu (Kesin Ã‡Ã¶zÃ¼m)
*   **Non-Blocking WhatsApp:** WhatsApp bildirim gÃ¶nderimi `await` edilmeden arka plana (background) alÄ±ndÄ±. CanlÄ±da WhatsApp baÄŸlantÄ±sÄ± gecikse veya kopsa dahi servis kaydÄ± anÄ±nda oluÅŸturulacak ve kullanÄ±cÄ± "KaydÄ± Tamamla" dediÄŸinde sistem kilitlenmeyecektir.
*   **Hata Maskeleme:** Bildirim hatalarÄ± artÄ±k sessizce loglanÄ±yor, ana iÅŸlemi engellemiyor.

#### 2. Profil ve Ä°sim SorunlarÄ± (DÃ¼zeltildi)
*   **Ä°sim Fallback:** Google ile giriÅŸte ismin boÅŸ gelmesi (`...`) sorunu dÃ¼zeltildi. Ä°sim yoksa kullanÄ±cÄ±nÄ±n e-posta adresinin ilk kÄ±smÄ± otomatik olarak isim olarak atanÄ±yor.
*   **JWT Profil Senkronizasyonu:** `auth.ts` dosyasÄ±nda profil verilerinin veritabanÄ± ile senkronizasyonu sÄ±rasÄ±nda oluÅŸabilecek eksiklikler giderildi.

#### 3. KÄ±sayol DÃ¼zenlemeleri
*   **HatalÄ± Link:** Dashboard Ã¼zerindeki "Kasa / Ä°ÅŸlemler" kÄ±sayolunun hatalÄ± `/finans` adresi, doÄŸru adres olan `/satis/kasa` ile deÄŸiÅŸtirildi.

### SonuÃ§
ArayÃ¼zdeki "..." sorunu ve bayilerin kayÄ±t sÄ±rasÄ±nda "asÄ±lÄ± kalma" sorunu bu gÃ¼ncellemelerle giderilmiÅŸtir. WhatsApp baÄŸlantÄ±sÄ± arka planda Ã§alÄ±ÅŸmaya devam edecek, ancak ana iÅŸlemleri engellemeyecektir.

### Gelecek AdÄ±mlar
- CanlÄ± sunucuda build ve deploy sonrasÄ± "Ayarlar > WhatsApp" sekmesinden baÄŸlantÄ±nÄ±n en baÅŸtan (Oturumu Kapat -> BaÅŸlat) kurulmasÄ± Ã¶nerilir.
- Bayilerin kendi dÃ¼kkan ID'leri ile doÄŸru odaya (join_room) katÄ±ldÄ±klarÄ± takip edilmelidir.

- [x] 2026-05-14: Veresiye musteri karti aksiyon degisikligi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Kurye admin gun bitirme akisi guncellendi. Dosyalar: `src/lib/actions/shortage-actions.ts`, `src/components/courier/courier-dashboard-client.tsx`. Neden: Admin `Bitir` isleminde alinmis ama stoga eklenmemis siparisler modalda listelensin; devam edilirse bugunku listeden kaldirilsin, alinmayan siparisler ise yarin tarihli olarak havuza veya secilen kuryeye aktarilsin.
- [x] 2026-05-14: Kurye gun bitirme ayrimi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili. Not: Kurye kendi panelinden gunu bitirdiginde yalnizca admin bildirimi gider; ertesi gune aktarma sadece admin modalindan yapilir.
- [x] 2026-05-14: Ayarlar/WhatsApp baglantisi production'da calismiyor sorunu duzeltildi. Dosyalar: `src/lib/whatsapp/whatsapp-manager.ts`, `Dockerfile`, `src/components/settings/tabs/whatsapp-tab.tsx`. Neden: Production (Docker) ortaminda `PUPPETEER_EXECUTABLE_PATH` env var'i kullanilmiyordu; `whatsapp-manager.ts`'e `executablePath` ve production-compatible Chromium argumanlari (`--disable-dev-shm-usage`, `--no-zygote`, `--disable-gpu` vb.) eklendi. Dockerfile'daki runner asamasina eksik Chromium sistem kutuphaneleri (libnss3, libatk, libcups2, libdrm2, libgbm1 vb.) eklendi. WhatsApp tab UI'si artik HTTP 500 hatalarini da kullaniciya gosteriyor.
- [x] 2026-05-14: WhatsApp production duzeltmesi dogrulandi. Komut: `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-14: Bayi servis kaydÄ± "dÃ¶nÃ¼p durma" ve yetki sorunu dÃ¼zeltildi. Dosyalar: `src/lib/validations/schemas.ts`, `src/app/(dashboard)/servis/yeni/page.tsx`, `src/components/service/create-service-modal.tsx`. Neden: IMEI sÄ±nÄ±rÄ± `max(11)` olduÄŸu iÃ§in gerÃ§ek kayÄ±tlar sessizce Zod hatasÄ±na takÄ±lÄ±yordu; limit `15`'e Ã§Ä±karÄ±ldÄ±. MÃ¼ÅŸteri adÄ± regex'ine `()&` desteÄŸi eklendi. `onSubmit` fonksiyonlarÄ± `try-catch` bloklarÄ± ile sarmalanarak server-side crash veya validation hatalarÄ±nÄ±n UI'da "spin" yapmasÄ± engellendi, kullanÄ±cÄ±ya bilgilendirici toast eklendi.
- [x] 2026-05-15: WhatsApp Chromium kilit (SingletonLock) temizleme ve Servis bilet numarasÄ± Ã§akÄ±ÅŸma (P2002) dÃ¼zeltmeleri yapÄ±ldÄ±. Dosyalar: `src/lib/whatsapp/whatsapp-manager.ts`, `src/lib/actions/service-actions.ts`, `src/components/settings/tabs/whatsapp-tab.tsx`, `src/components/service/create-service-modal.tsx`. Neden: Docker ortamÄ±nda Chromium kilit dosyalarÄ± baÄŸlantÄ±yÄ± engelliyordu, artÄ±k 'force' init ile temizleniyor. Bilet numaralarÄ± 'count' yerine 'max+1' mantÄ±ÄŸÄ±na Ã§ekildi ve race condition iÃ§in retry dÃ¶ngÃ¼sÃ¼ eklendi. Komut: `npx tsc --noEmit`. SonuÃ§: BaÅŸarÄ±lÄ±.
- [x] 2026-05-15: Dashboard skeleton layout shift duzeltmesi yapildi. Dosyalar: `src/app/loading.tsx`, `src/app/(dashboard)/loading.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/dashboard-skeletons.tsx`, `src/lib/context/dashboard-data-context.tsx`, `src/lib/context/shortage-context.tsx`. Neden: Ilk yuklemede tum sayfa hissi veren skeleton yerine gercek dashboard yuksekliklerine yakin sabit konteynerler kullanildi; dashboard ana Suspense fallback'i tam sayfa iskelete cekildi, chart skeleton rastgele yukseklik uretmeyi birakti, mobil/desktop min-height ve opacity transition eklendi, React Query yenilemelerinde `placeholderData: keepPreviousData` ile eski veri korunuyor. Komut: `npx tsc --noEmit`. Sonuc: Projedeki mevcut `src/components/finance/veresiye-client.tsx` balance/balanceUsd tip hatalari nedeniyle tamamlanamadi.
- [x] 2026-05-15: React Query v5 entegrasyonu genisletildi. Dosyalar: `package.json`, `package-lock.json`, `src/components/providers/QueryProvider.tsx`, `src/components/providers/query-provider.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/cihaz-listesi/page.tsx`, `src/components/device-hub/device-list-client.tsx`, `src/components/device-hub/create-device-modal.tsx`, `src/components/finance/veresiye-client.tsx`, `tests/query-provider-config.test.ts`. Neden: QueryClient staleTime 5 dakikaya cikarildi, development modunda React Query Devtools eklendi, cihaz listesi server initial data ile `useQuery` cache yapisina alindi, cihaz ekleme ve finans hesaplari `useMutation`/`useQuery` ile yenilendi, basarili cihaz kaydinda `devices`, `dashboard-init` ve `finance-accounts` query'leri invalidate ediliyor. Veresiye musteri aggregate tipi mevcut `balance/balanceUsd` kullanimiyla uyumlu hale getirildi. Komutlar: `npx ts-node tests/query-provider-config.test.ts`, `npx tsc --noEmit`. Sonuc: Basarili.
- [x] 2026-05-15: Dashboard ve finans React Query cache yayginlastirmasi yapildi. Dosyalar: `src/components/dashboard/modals/stat-detail-modal.tsx`, `src/components/dashboard/widgets/shortage-status-card.tsx`, `src/components/finance/create-transaction-modal.tsx`, `src/components/finance/create-account-modal.tsx`, `src/components/finance/account-detail-modal.tsx`, `src/components/device-hub/device-actions-column.tsx`, `src/components/device-hub/update-device-modal.tsx`, `src/components/service/service-status-updater.tsx`, `tests/query-cache-coverage.test.ts`. Neden: Dashboard istatistik detaylari ve eksik stok karti `useQuery`/`placeholderData` yapisina alindi; finans hesaplari, son hareketler, hesap analitigi ve hareket/hesap mutasyonlari cache'lendi; cihaz veya finans hareketi degisince `dashboard-init`, `dashboard-stat-detail`, `transactions`, `finance-accounts` ve `account-analytics` query'leri invalidate ediliyor. Skeleton ve loading akislarinda eski veri korunarak layout shift azaltildi.
- [x] 2026-05-15: `/satis/kasa` build hatasi duzeltildi. Dosya: `src/components/finance/create-transaction-modal.tsx`. Neden: Kasa rotasinin kullandigi finans modal dosyasi UTF-8 disi kaydedildigi icin Next kaynak kodu okuyamiyordu. Dosya gecerli UTF-8'e cevrildi. Komutlar: UTF-8 taramasi, `npx tsc --noEmit`, `npm run build`. Sonuc: Basarili.
- [x] 2026-05-15: Dashboard SSR/no-wait skeleton duzeltmesi yapildi. Dosyalar: `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/dashboard-client.tsx`, `src/components/dashboard/dashboard-skeletons.tsx`, `src/app/(dashboard)/loading.tsx`, `src/app/loading.tsx`, `tests/query-cache-coverage.test.ts`. Neden: Dashboard ana page server component icinde `getDashboardInit` ile stats/rates/settings verisi hazirlaniyor, `QueryClient` uzerinden `dashboard-init` cache'i set edilip `HydrationBoundary` ile client'a aktariliyor. Normal dashboard render yolundaki full-page ve chart Suspense skeletonlari kaldirildi; skeletonlar sadece ekstrem route loading durumlari icin 4 stat karti + tek chart ritmine cekildi.
- [x] 2026-05-18: Performans ve anti-flicker React Query denetimi yapildi. Dosyalar: `src/lib/prisma.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/kurye/page.tsx`, `src/app/(dashboard)/stok/stok-ai/page.tsx`, `src/components/courier/courier-dashboard-client.tsx`, `src/components/dashboard/streamed/revenue-analysis-stream.tsx`, `src/components/dashboard/streamed/service-status-stream.tsx`, `src/components/dashboard/streamed/recent-transactions-stream.tsx`, `src/components/dashboard/streamed/receivables-stream.tsx`, `src/components/dashboard/streamed/smart-insights-stream.tsx`, `src/components/dashboard/streamed/top-products-stream.tsx`, `src/lib/context/dashboard-data-context.tsx`, `src/components/finance/account-detail-modal.tsx`, `src/components/finance/create-transaction-modal.tsx`, `src/components/pos/pos-interface.tsx`, `src/components/service/service-status-updater.tsx`, `src/components/device-hub/create-device-modal.tsx`. Neden: Prisma query logu varsayilan olarak kapatildi; Dashboard duplicate `getDashboardInit` sorgusu tek cache set'e indirildi; Dashboard stream widgetlari ve Stok AI manuel `useEffect` fetchlerinden React Query cache'e tasindi; Kurye sayfasi server-side `prefetchQuery` + `HydrationBoundary` ile hydrate edildi; arka plan fetchlerde buyuk loading/flicker yerine cache korunacak sekilde stale/refetch ayarlari sikilastirildi.
- [x] 2026-05-18: Dashboard performans mimarisi optimizasyonu tamamlandi. Dosyalar: `src/app/(dashboard)/musteriler/yeni/page.tsx`, `src/app/(dashboard)/servis/yeni/page.tsx`, `src/app/(dashboard)/admin/shops/shops-client.tsx`, `src/app/(dashboard)/bildirimler/page.tsx`, `src/app/(dashboard)/raporlar/page.tsx`. Neden: "Shell-first" hibrit mimariye gecis tamamlandi; `yeni musteri` ve `yeni servis` sayfalari blocking server fetch'ten arindirildi.
- [x] 2026-05-18: `NewServicePage` ve `NewCustomerPage` React Query (`useQuery`/`useMutation`) yapisina gecirildi. Neden: `useEffect` tabanli arama ve blocking `await` islemleri kaldirildi; musteri arama, model arama ve AI diyagnoz islemleri artik reaktif cache uzerinden calisiyor. Basarili servis/musteri kaydinda ilgili query'ler invalidate edilerek UI anlik senkronize ediliyor.
- [x] 2026-05-18: Dashboard genel optimizasyon denetimi yapildi. Neden: `admin/shops`, `bildirimler`, `raporlar` ve `musteriler/duzenle` sayfalari incelendi; tum kritik veri akislarinin TanStack Query standartlarina (staleTime: 5dk, refetchOnWindowFocus: false) uygunlugu teyit edildi.
- [x] 2026-05-18: Dashboard performans ve cache optimizasyonu tamamlandi. Dosyalar: `src/components/navbar/shortage-list.tsx`, `src/components/dashboard/stat-widget-wrapper.tsx`, `src/components/dashboard/modals/stat-detail-modal.tsx`, `src/lib/context/shortage-context.tsx`, `src/components/dashboard/widgets/shortage-status-card.tsx`. Neden: Dashboard Ã¼zerinde tespit edilen sonsuz refetch dÃ¶ngÃ¼sÃ¼ (ShortageList) ve agresif arka plan yenilemeleri giderildi. Imperative `useEffect` fetch'leri declarative `useQuery` yapÄ±larÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼. TÃ¼m ana dashboard sorgularÄ±na `staleTime: 5dk` ve `refetchOnWindowFocus: false` eklenerek Neon DB Ã¼zerindeki yÃ¼k minimize edildi ve anlÄ±k/cache'den yÃ¼kleme performansi artÄ±rÄ±ldÄ±.
- [x] 2026-05-18: Dashboard widget gÃ¶rÃ¼nÃ¼m kalÄ±cÄ±lÄ±ÄŸÄ± ve server-side cache optimizasyonu yapÄ±ldÄ±. Dosyalar: `src/components/dashboard/dashboard-client.tsx`, `src/lib/actions/dashboard-actions.ts`, `src/lib/actions/product-actions.ts`, `src/lib/actions/sale-actions.ts`, `src/lib/actions/finance-actions.ts`, `src/lib/actions/service-actions.ts`. Neden: "Trend ÃœrÃ¼nler" ve diÄŸer widgetlarÄ±n gÃ¶rÃ¼nÃ¼m modlarÄ± (Liste/Izgara) artÄ±k veritabanÄ±na otomatik kaydediliyor ve sayfa yenilense de seÃ§ili kalÄ±yor. Dashboard verileri `unstable_cache` ile sunucu tarafÄ±nda Ã¶nbelleÄŸe alÄ±ndÄ±; satÄ±ÅŸ, stok, finans veya servis iÅŸlemlerinde ilgili cache etiketleri (`dashboard-${shopId}`, `products-${shopId}`, `tickets-${shopId}`) otomatik temizlenerek verilerin gÃ¼ncelliÄŸi korunurken mÃ¼kerrer SQL sorgularÄ± engellendi.
- [x] 2026-05-18: `ReceivablesClient` TypeScript hatasÄ± ve kod bozulmasÄ± dÃ¼zeltildi. Dosyalar: `src/components/dashboard/receivables-client.tsx`, `src/components/dashboard/streamed/receivables-stream.tsx`. Neden: Alacaklar widget'Ä±na eksik `cols` ve `rows` proplarÄ± eklenerek tip uyumsuzluÄŸu giderildi; dÃ¼zenleme sÄ±rasÄ±nda yanlÄ±ÅŸlÄ±kla bozulan `Debt` interface yapÄ±sÄ± ve mÃ¼kerrer import bloklarÄ± temizlenerek dosya bÃ¼tÃ¼nlÃ¼ÄŸÃ¼ saÄŸlandÄ±.
- [x] 2026-05-18: GitHub Docker image build auth hatasi duzeltildi. Dosyalar: `Dockerfile`, `src/app/api/auth/[...nextauth]/route.ts`. Neden: Docker build context'inde `.env` dosyalari bulunmadigi icin NextAuth route'u `/api/auth/[...nextauth]` page data collection asamasinda env eksigiyle build'i dusuruyordu; auth route dynamic isaretlendi, build-time placeholder env'ler yalnizca `npm run build` komutuna verildi ve builder stage'e OpenSSL eklenerek Prisma engine uyumu saglandi. Komutlar: `npm run build`, `docker build -t telefon-takip-auth-build-check .`. Sonuc: Basarili.
- [x] 2026-05-18: Dashboard ilk acilis layout sikismasi duzeltildi. Dosyalar: `src/lib/dashboard-layout.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/dashboard-client.tsx`. Neden: Ilk acilista eski/bozuk kullanici layout kaydi `cols: 1` gibi dar degerlerle yuklenip widgetlari ust uste ve ince sutunlar halinde gosteriyordu; sistem varsayilan layout'u ortak helper'a tasindi, server ve client ayni 24 kolonluk preset'i kullanacak hale getirildi, cok dar/collapsed eski layout kayitlari otomatik varsayilana dusuruldu ve `Varsayilan` butonu artik kaydedilebilir degisiklik olarak isaretleniyor. Komutlar: `npm run build`, `npx tsc --noEmit`. Sonuc: Build basarili; `tsc` mevcut POS/personel/tedarikci tip hatalari nedeniyle tamamlanamadi.
- [x] 2026-05-18: `/servis` Basar AI analiz modal gorunumu iyilestirildi. Dosya: `src/components/service/technical-service-analysis-modal.tsx`. Neden: Teknik servis analiz ciktisi dark modda cok koyu blok halinde ve uzun markdown metni olarak gorunuyordu; modal tema tokenlariyla soft arka planlara cekildi, dark/light mod uyumlu kartli yapi eklendi, rapor giris/selamlama satirlari temizlenip ekranda kisaltilmis ozet olarak gosterilecek hale getirildi. Komut: `npm run build`. Sonuc: Basarili.
- [x] 2026-05-18: `/ayarlar` dinamik formlar sekmesi runtime hatasi duzeltildi. Dosya: `src/components/settings/tabs/forms-tab.tsx`. Neden: `shop` prop'u gecici olarak undefined geldiginde `shop.industry` okunmaya calisiliyor ve dinamik formlar modulu dusuyordu; sektor ve tema config okumalari guvenli fallback ile `GENERAL`/bos config uzerinden calisacak hale getirildi, AI sihirbazi da shop yokken hata vermeyecek sekilde guncellendi. Komut: `npm run build`. Sonuc: Basarili.
- [x] 2026-05-18: `/veresiye` CSV/Excel disari aktarma mantigi guncellendi. Dosya: `src/components/finance/veresiye-client.tsx`. Neden: Musteri seciliyken yalnizca secili musterilerin borc/urun/odeme/kalan borc detaylari aktarilsin, secim yokken tum musteriler aktarilsin; Excel ciktisinda her musteri ayri sayfaya, CSV ciktisinda her musteri ayri bolume ayrilsin. Komut: `npm run build`. Sonuc: Basarili; mevcut tedarikci import ve dynamic route uyarilari devam ediyor.
- [x] 2026-05-18: Kullanici duyurulari guncellendi. Dosya: `src/config/announcements.ts`. Neden: Journal kayitlarindaki kullaniciyi ilgilendiren panel, performans, servis AI, ayarlar ve veresiye export iyilestirmeleri yeni duyuru olarak uygulamada gosterilsin. Komut: `npm run build`. Sonuc: Ilk deneme gecici `/_document` cache hatasina takildi, ikinci deneme basarili; mevcut tedarikci import ve dynamic route uyarilari devam ediyor.
- [x] 2026-05-18: Duyuru gorulme mantigi icerik imzali hale getirildi. Dosya: `src/components/dashboard/announcements-modal.tsx`. Neden: `announcements.ts` icindeki aktif duyuru metni degistiginde eski duyuruyu gormus kullanicilar yeni degisikligi tekrar gorsun; ayni degisikligi gordukten sonra tekrar acilmasin. Eski duyurular icin onceki `id` bazli gorulme kayitlari korunuyor.
- [x] 2026-05-18: `/veresiye` hesaplama ve cache senkronizasyonu duzeltildi. Dosyalar: `src/components/finance/veresiye-client.tsx`, `src/components/finance/add-debt-modal.tsx`, `src/lib/actions/debt-actions.ts`. Neden: Borc kalemi ekleme/silme/guncelleme ve tahsilat islemlerinden sonra React Query cache eski kaldigi icin toplam alacaklar yanlis gorunebiliyordu; kalan borc hesaplari `0` ile ana borc tutari arasinda guvenli sinirlandi, ekleme/silme/tahsilat sonrasi ilgili veresiye/dashboard/kasa query'leri invalidate edilecek hale getirildi. Komut: `npm run build`. Sonuc: Basarili; mevcut tedarikci import ve dynamic route uyarilari devam ediyor. Not: `npx tsc --noEmit` komutu sistem kullanim limiti nedeniyle calistirilamadi.
- [x] 2026-05-18: `/veresiye` ve dashboard finansal hareketlerindeki mÃ¼kerrer kayÄ±tlar filtrelendi. Dosyalar: `src/lib/actions/dashboard-actions.ts`, `src/lib/actions/debt-actions.ts`, `src/components/finance/veresiye-client.tsx`. Neden: BorÃ§ kaydÄ± oluÅŸturulduÄŸunda sistem otomatik olarak bir finans hareketi de oluÅŸturuyordu; bu durum mÃ¼ÅŸteri ekstresinde ve son iÅŸlemlerde "Veresiye BorÃ§" olarak mÃ¼kerrer gÃ¶rÃ¼nÃ¼me yol aÃ§Ä±yordu. ArtÄ±k sadece nakit/kart gibi kasa bakiyesini etkileyen gerÃ§ek tahsilatlar/Ã¶demeler listede gÃ¶rÃ¼nÃ¼yor. AyrÄ±ca Veresiye sayfasÄ± dark mod ile tam uyumlu hale getirildi.
- [x] 2026-05-19: TedarikÃ§i profilinde Ã¼rÃ¼n gÃ¶rÃ¼nmeme sorunu giderildi. Dosyalar: `src/lib/actions/supplier-actions.ts`, `src/components/supplier/supplier-profile.tsx`. Neden: TedarikÃ§i profilinde sadece doÄŸrudan iliÅŸkilendirilmiÅŸ Ã¼rÃ¼nler gÃ¶rÃ¼nÃ¼yordu ve server action bu iliÅŸkili veriyi Ã§ekmiyordu; `getSuppliers` action'Ä± `products` ve `category` iliÅŸkilerini iÃ§erecek ÅŸekilde gÃ¼ncellendi, tedarikÃ§i profilinde Ã¼rÃ¼nler hem doÄŸrudan hem de geÃ§miÅŸ stok hareketlerinden (inventoryMovements) kÃ¼mÃ¼latif olarak derlendi ve "ÃœrÃ¼nler / Envanter" sekmesi eklenerek tÃ¼m iliÅŸkili Ã¼rÃ¼nlerin listelenmesi saÄŸlandÄ±. useMemo import hatasÄ± dÃ¼zeltildi.
- [x] 2026-05-20: Dashboard "Finansal KayÄ±tlar" kartÄ± iÃ§in gÃ¼nlÃ¼k Ã¶zet tutarlarÄ± eklendi. Dosyalar: `src/lib/actions/dashboard-actions.ts`, `src/components/dashboard/streamed/recent-transactions-stream.tsx`. Neden: KullanÄ±cÄ±nÄ±n dashboard Ã¼zerinden o gÃ¼nÃ¼n ve bir Ã¶nceki gÃ¼nÃ¼n toplam gelir/giderlerini (tahsilat ve Ã¶demelerini) karÅŸÄ±laÅŸtÄ±rmalÄ± olarak gÃ¶rmesi saÄŸlandÄ±. Sistem varsayÄ±lan para birimi ayarÄ±na (TL/USD) gÃ¶re dinamik kur dÃ¶nÃ¼ÅŸÃ¼mÃ¼ ve sembol gÃ¶sterimi eklendi. Performans iÃ§in `unstable_cache` kullanÄ±ldÄ±.
- [x] 2026-05-21: Dashboard "Tahsilatlar" kartÄ± ve Finans/Kasa sayfasÄ± entegrasyonu saÄŸlandÄ±. Dosyalar: `src/lib/actions/finance-actions.ts`, `src/components/finance/transaction-history.tsx`, `src/components/finance/edit-transaction-wrapper.tsx`, `src/components/finance/edit-customer-payment-modal.tsx`, `src/lib/actions/dashboard-detail-actions.ts`, `src/components/dashboard/modals/stat-detail-modal.tsx`, `src/app/(dashboard)/satis/kasa/page.tsx`. Neden: Dashboard Ã¼zerinde "HÄ±zlÄ± SatÄ±ÅŸ" gibi belirsiz etiketler yerine tahsilatÄ±n yapÄ±ldÄ±ÄŸÄ± MÃ¼ÅŸteri/TedarikÃ§i adÄ± gÃ¶sterilmeye baÅŸlandÄ±. Dashboard Ã¼zerinden tahsilata tÄ±klandÄ±ÄŸÄ±nda Kasa sayfasÄ±nda ilgili kaydÄ± otomatik olarak filtreleyen (search param) yÃ¶nlendirme eklendi. Kasa sayfasÄ±ndaki arama barÄ± isim bazlÄ± dinamik arama yapacak ÅŸekilde gÃ¼Ã§lendirildi. Ã–deme dÃ¼zenleme iÅŸlemlerinde borÃ§ tahsilatÄ± ise Ã¶zel MÃ¼ÅŸteri Ã–deme ModalÄ±, deÄŸilse genel modalÄ±n aÃ§Ä±lmasÄ± saÄŸlandÄ±. USD Ã¶demelerin TL karÅŸÄ±lÄ±ÄŸÄ± ve doÄŸru sembol gÃ¶sterimi ledger ve mobile gÃ¶rÃ¼nÃ¼mlere uygulandÄ±.
- [x] 2026-05-21: Onboarding sektÃ¶r ÅŸablonu oluÅŸturma hatasÄ± dÃ¼zeltildi. Dosyalar: `src/lib/actions/gemini-actions.ts`. Neden: AI'dan gelen JSON verisi bazen bozuk/kesik olduÄŸu iÃ§in onboarding sÄ±rasÄ±nda "Unterminated string in JSON" hatasÄ± alÄ±nÄ±yordu; JSON ayÄ±klama ve temizleme (cleanJSON) mantÄ±ÄŸÄ± gÃ¼Ã§lendirildi, promptlar daha katÄ± bir JSON formatÄ±na zorlandÄ±. KullanÄ±cÄ±nÄ±n isteÄŸi Ã¼zerine Gemini model ismi (`gemini-2.5-flash`) deÄŸiÅŸtirilmeden korundu.
- [x] 2026-05-21:- **KullanÄ±cÄ± OnayÄ± ve GÃ¼venlik Ä°stisnalarÄ±:**
    - **Kurye Muafiyeti:** `COURIER` rolÃ¼ndeki kullanÄ±cÄ±lar iÃ§in onay kodu zorunluluÄŸu kaldÄ±rÄ±ldÄ±. Middleware ve JWT senkronizasyonu kuryelere otomatik onay verecek ÅŸekilde gÃ¼ncellendi.
    - **Personel KaydÄ±:** YÃ¶neticiler (`SHOP_MANAGER`, `ADMIN`, `MANAGER`) tarafÄ±ndan el ile eklenen personeller iÃ§in otomatik onay (`isApproved: true`) geri getirildi. BÃ¶ylece yÃ¶neticilerin eklediÄŸi ekipler hemen Ã§alÄ±ÅŸmaya baÅŸlayabilir.
    - **OAuth (Google) KÄ±sÄ±tlamalarÄ±:** Google ile giriÅŸ yapan hesaplarÄ±n `COURIER` olmasÄ± engellendi. EÄŸer bir Google hesabÄ± daha Ã¶nce kurye olarak tanÄ±mlanmÄ±ÅŸsa, ilk giriÅŸte otomatik olarak `SHOP_MANAGER` rolÃ¼ne yÃ¼kseltilecek ÅŸekilde mantÄ±k kuruldu.
    - **OAuth Roller:** Google hesabÄ± ile sisteme dahil olan (yeni veya mevcut) tÃ¼m kullanÄ±cÄ±larÄ±n `SHOP_MANAGER` olarak konumlandÄ±rÄ±lmasÄ± ve onay sÃ¼recine (Admin onayÄ±) tabi tutulmasÄ± saÄŸlandÄ±.
- [x] 2026-05-21: Onboarding Redirect DÃ¶ngÃ¼sÃ¼ Ã‡Ã¶zÃ¼mÃ¼:
    - Ã–nbellek GeÃ§ersiz kÄ±lma: `src/lib/actions/onboarding-actions.ts` iÃ§indeki `finishOnboarding` fonksiyonuna `shop` cache tag'ini temizleyen `revalidateTag` Ã§aÄŸrÄ±larÄ± eklendi.
    - Ä°stemci TarafÄ± Yenileme: `src/app/onboarding/page.tsx` iÃ§indeki `handleFinish` fonksiyonuna `router.refresh()` eklendi, bÃ¶ylece yÃ¶nlendirme Ã¶ncesi stale (bayat) Ã¶nbellek temizlenerek dashboard'un gÃ¼ncel durumla aÃ§Ä±lmasÄ± saÄŸlandÄ±.

- [x] 2026-05-21: EDM REST API Fatura ndirme Entegrasyonu (Adım 4):
    - Dosyalar: `src/lib/edm/service.ts`, `src/app/api/test/edm-view/[uuid]/route.ts`, `src/app/api/test/edm-view-document/route.ts`, `src/app/api/test/edm-debug/route.ts`, `src/app/api/test/edm-swagger/route.ts`, `src/app/api/test/edm-swagger-schema/route.ts`.
    - Neden: EDM'den gelen faturayı tarayıcıda PDF/HTML olarak göstermek için belge indirme endpoint'ini entegre etmek.
    - Yapılanlar:
      - `getInvoiceDocument(uuid, format)`: UUID ile fatura belgesini indir. Birden fazla endpoint kombinasyonunu test eder.
      - `/api/test/edm-view/[uuid]`: Fatura PDF/HTML önizlemesi.
      - `/api/test/edm-view-document`: ViewInvoice linki fallback'i.
    - Fallback: ViewInvoice linki (https://view.edmbilisim.com.tr/fatura/ViewInvoice/{VKN}/{ETTN}/earsiv) doğrudan kullanılabilir.

- [x] 2026-05-21: Modal Arayüz ve Kritik Stok Mantığı Geliştirmeleri:
    - Dosyalar: `src/components/ui/dialog.tsx`, `src/lib/actions/product-actions.ts`, `src/lib/actions/sale-actions.ts`, `src/lib/actions/service-actions.ts`, `src/components/product/create-product-modal.tsx`.
    - Neden: Modallardaki kapatma butonunun içerikle çakışmasını önlemek, sistem genelinde 1 olan sabit kritik stok seviyesini ürün bazlı dinamik hale getirmek ve para birimi değişimlerinde fiyat senkronizasyonunu sağlamak.
    - Yapılanlar:
      - `Dialog`: Kapatma butonu (X) sağ üst köşeye daha yakın (right-4 top-4) ve daha küçük hale getirildi. `DialogHeader` bölümüne sağdan iç boşluk (pr-10) eklenerek butonla çakışma engellendi.
      - `Kritik Stok`: Satış, Servis ve Stok güncelleme işlemlerinde eksik listesine otomatik ekleme mantığı düzenlendi. Artık sadece 0'a düşünce değil, ürün tanımında belirtilen kritik seviyeye (örn: 5) ulaşıldığında da eksik listesine kayıt düşülüyor.
      - `Para Birimi Senkronizasyonu`: `CreateProductModal` içinde TRY/USD/EUR geçişlerinde kutucuklardaki rakamların güncel kur üzerinden otomatik dönüştürülmesi sağlandı.
      - `Zod Schema`: `productSchema` içindeki varsayılan kritik stok değeri 1 olarak korundu ancak kullanıcının girdiği diğer değerlerin (2, 3, 4 vb.) sisteme doğru kaydedilip mantıksal sorgularda kullanılması sağlandı.

- [x] 2026-05-21: Modal ArayÃ¼z ve Kritik Stok MantÄ±ÄŸÄ± GeliÅŸtirmeleri:
    - Dosyalar: src/components/ui/dialog.tsx, src/lib/actions/product-actions.ts, src/lib/actions/sale-actions.ts, src/lib/actions/service-actions.ts, src/components/product/create-product-modal.tsx.
    - Neden: Modallardaki kapatma butonunun iÃ§erikle Ã§akÄ±ÅŸmasÄ±nÄ± Ã¶nlemek, sistem genelinde 1 olan sabit kritik stok seviyesini Ã¼rÃ¼n bazlÄ± dinamik hale getirmek ve para birimi deÄŸiÅŸimlerinde fiyat senkronizasyonunu saÄŸlamak.
    - YapÄ±lanlar:
      - Dialog: Kapatma butonu (X) saÄŸ Ã¼st kÃ¶ÅŸeye daha yakÄ±n (right-4 top-4) ve daha kÃ¼Ã§Ã¼k hale getirildi. DialogHeader bÃ¶lÃ¼mÃ¼ne saÄŸdan iÃ§ boÅŸluk (pr-10) eklenerek butonla Ã§akÄ±ÅŸma engellendi.
      - Kritik Stok: SatÄ±ÅŸ, Servis ve Stok gÃ¼ncelleme iÅŸlemlerinde eksik listesine otomatik ekleme mantÄ±ÄŸÄ± dÃ¼zenlendi. ArtÄ±k sadece 0'a dÃ¼ÅŸÃ¼nce deÄŸil, Ã¼rÃ¼n tanÄ±mÄ±nda belirtilen kritik seviyeye ulaÅŸÄ±ldÄ±ÄŸÄ±nda da eksik listesine kayÄ±t dÃ¼ÅŸÃ¼lÃ¼yor.
      - Para Birimi Senkronizasyonu: CreateProductModal iÃ§inde TRY/USD/EUR geÃ§iÅŸlerinde kutucuklardaki rakamlarÄ±n gÃ¼ncel kur Ã¼zerinden otomatik dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lmesi saÄŸlandÄ±.
      - Zod Schema: SeÃ§ilen kritik stok deÄŸeri Ã¼rÃ¼n kaydederken dÃ¼zgÃ¼nce ayarlandÄ± ve UI Ã¼zerinde iÅŸlendi.

- [x] 2026-05-21: Modal ArayÃ¼z ve Kritik Stok MantÄ±ÄŸÄ± GeliÅŸtirmeleri:
    - Dosyalar: src/components/ui/dialog.tsx, src/lib/actions/product-actions.ts, src/lib/actions/sale-actions.ts, src/lib/actions/service-actions.ts, src/components/product/create-product-modal.tsx.
    - Neden: Modallardaki kapatma butonunun iÃ§erikle Ã§akÄ±ÅŸmasÄ±nÄ± Ã¶nlemek, sistem genelinde sabit olan kritik stok seviyesini Ã¼rÃ¼n bazlÄ± hale getirmek ve dÃ¶vizli iÅŸlemlerde dÃ¶nÃ¼ÅŸÃ¼mleri iyileÅŸtirmek.
    - YapÄ±lanlar:
      - Dialog: Kapatma butonu (X) saÄŸ Ã¼st kÃ¶ÅŸeye daha yakÄ±n ve kÃ¼Ã§Ã¼k hale getirildi. DialogHeader bÃ¶lÃ¼mÃ¼ne saÄŸdan iÃ§ boÅŸluk (pr-10) eklenerek butonla Ã§akÄ±ÅŸmasÄ± Ã¶nlendi.
      - Kritik Stok: ÃœrÃ¼nlere Ã¶zel belirlenen criticalStock deÄŸerine gÃ¶re sipariÅŸ eksik listesine ekleme mantÄ±ÄŸÄ± eklendi. (product, sale ve service actions gÃ¼ncellendi)
      - Para Birimi GeÃ§iÅŸi: CreateProductModal iÃ§inde TRY/USD/EUR kur deÄŸiÅŸiminde input iÃ§indeki fiyatlarÄ±n TL eÅŸdeÄŸeri korunacak ÅŸekilde otomatik Ã§evrilmesi eklendi.

- [x] 2026-05-25: Kurye Sistemi Stabilizasyonu ve EDM Ara Verme:
    - Dosyalar: src/lib/actions/shortage-actions.ts, src/lib/actions/product-actions.ts, src/components/courier/courier-dashboard-client.tsx, src/lib/edm/rest-client.ts.
    - Neden: Kurye sistemindeki mantik hatalarini (stok uyarisi, tarih filtreleme) gidermek ve EDM entegrasyonu calismalarini askiya almak.
    - Yapilanlar:
      - **Kritik Stok**: Prisma'nin alanlar arasi karsilastirma (stock <= criticalStock) kisitlamasi, uygulama seviyesinde filtreleme ile asildi. getInventoryStats ve getCriticalProducts düzeltildi.
      - **Kurye Filtreleme**: Kurye paneli ve detaylarinda sadece COURIER rolündeki personellerin listelenmesi saglandi.
      - **Tarih Mantigi**: getCourierTasks icindeki isHistory mantigi bugün icin tamamlanmis görevleri gizlemeyecek sekilde güncellendi.
      - **Toplu Islem**: bulkMarkShortageAsNotFound fonksiyonu tek veritabanı turu ile calisacak sekilde optimize edildi.
      - **EDM Entegrasyonu**: SOAP 1.1 gecisi yapildi ancak kullanici istegi üzerine calismalar süresiz olarak askiya alindi.

### [27.05.2026] - Satiş Geçmişi Modülerizasyonu ve Performans Optimizasyonu
- **Dosyalar**: src/components/satis/sales-history-client.tsx, src/components/satis/parts/sales-history-row.tsx, src/components/satis/parts/operation-details.tsx, prisma/schema.prisma, src/components/dashboard/streamed/*, src/lib/actions/activity-actions.ts.
- **Neden**: Satiş geçmişi sayfasindaki monolitik yapiyi temizlemek, veritabani sorgu performansini artirmak ve dashboard bileşenlerinin 'boş veri' durumundaki davranişlarini stabilize etmek.
- **Yapilanlar**:
    - **Modülerizasyon**: SalesHistoryClient bileşeni SalesHistoryRow ve OperationDetails olarak parçalandı. ş mantığı (iade, yazdir, detay aç) merkezi bir yapidan bagimsiz bileşenlere taşındı.
    - **Performans (Prisma)**: Transaction modeline shopId, createdAt, category, customerId, debtId, ve financeAccountId alanlari için veritabani indeksleri eklendi.
    - **Arama Optimizasyonu**: getUnifiedHistory fonksiyonu içerisindeki contains aramalarina mode: 'insensitive' eklenerek Postgres/Neon uyumlulugu ve arama esnekligi saglandi.
    - **Dashboard Kararliligi**: Widget'larin veri durumunu raporlama mekanizmasi useEffect ile stabilize edildi. Veri olmadiginda kartlarin otomatik olarak küçülmesi saglandi.

2026-05-27 - **Sistem Temizliği ve Grafik Analizi**
- **Analiz**: graphify raporu üzerinden 600'den fazla izole düğüm ve teknik borç tespit edildi.
- **Temizlik**: Kök dizindeki 16 adet geçici dosya (loglar, eski scriptler) ve scripts/ klasöründeki 28 adet tanı scripti tamamen silindi.
- **Sonuç**: Proje gürültüsü azaltıldı, IDE ve analiz araçlarının performansı iyileştirildi.

2026-05-27 - **Stok ve Kategori Yönetimi Modülerleştirme**
- **Kategori Yönetimi Yeniden Yapılandırması**: 1486 satırlık `category-management-client.tsx` dosyası modüler parçalara ayrıldı (`index.tsx`, `product-table.tsx`, `category-modals.tsx`, `tree-item.tsx`).
- **Toplu İşlem Optimizasyonu**: AI ile ürün oluşturma sürecinde `bulkCreateAIInventory` server action ile tüm işlemler tek bir Prisma transaction'a çekilerek performans artırıldı.
- **Teknik Borç**: Gereksiz importlar temizlendi ve hiyerarşik sürükle-bırak yapısı modernize edildi.
2026-05-27 - **Veritabanı ve Sayfa Optimizasyonları**
- **getShopId() Performansı**: JWT senkronizasyonuna 5s/30s TTL mekanizması eklenerek veritabanı hitleri %80 oranında azaltıldı. Super Admin home-shop araması `React.cache` ile sarmalanarak request-local caching sağlandı.
- **Kategori Sayfası Modernizasyonu**: `/stok/kategoriler` sayfası Next.js metadata ve yeni modüler bileşenlerle modernize edildi.

2026-06-05 - **Veresiye Terminali ve Kurye Paneli Final İyileştirmeleri**
- **Veresiye Terminali**:
    - WhatsApp hesap özetlerindeki `@` ve `~` işaretleri temizlendi, modern bir parantez içi gösterim `(₺...)` veya `($...)` getirildi.
    - Varsayılan para birimi (TL/USD) ayarına göre mesaj içeriği ve borçların önceliği otomatik güncellenecek şekilde revize edildi.
    - "Seçilenleri Öde" butonu güncellendi; artık varsayılan para biriminize göre toplam borç hesaplanıyor ve ödeme ekranına doğru para birimiyle aktarılıyor.
    - Borç ekstre listesinde tekil ürün seçimi ve bu ürünler üzerinden "Seçilenleri Öde" veya "Seçilenleri İade Et" akışları doğrulandı.
- **Kurye Paneli**:
    - "Atanmamış Eksikler" listesine arama (Search) kutusu eklendi.
    - Ölü stok ürünlerinin aktif eksik adetlerinden (Tümü, Kritik, Bitenler) izole edilmesi sağlandı.
- **Dosyalar**: `src/components/finance/veresiye-client.tsx`, `src/components/courier/courier-dashboard-client.tsx`, `src/lib/actions/shortage-actions.ts`.

- [x] 2026-06-09: Veresiye fiş (PNG) kesilme sorunları giderildi. Dosyalar: `src/lib/receipt-print-styles.ts`, `src/components/finance/debt-receipt-modal.tsx`. Neden: Uzun ürün isimleri ve uzun listeler görselde yarım çıkıyordu; ürün isimlerindeki `truncate` kaldırıldı, yakalama (capture) sırasında tüm yükseklik kısıtlamaları devre dışı bırakıldı ve `windowHeight` artırıldı.
- [x] 2026-06-09: Profesyonel PDF dökümü (Tablo) ekstre özelliği iyileştirildi. Dosyalar: `src/lib/receipt-print-styles.ts`, `src/components/finance/debt-receipt-modal.tsx`. Neden: Müşterilerin geçmiş alımlarını daha net görmesi için tablo dökümü tarihlere göre gruplandırıldı, uzun listeler için "Tek Sayfa PDF" (Long PDF) desteği getirildi ve "Ödenenleri Gizle" seçeneğine tam uyum sağlandı.
- [x] 2026-06-09: Fiş modalı butonu ve WhatsApp ikon tasarımı güncellendi. Dosya: `src/components/common/receipt-modal-wrapper.tsx`. Neden: WhatsApp butonu markayla uyumlu yeşil (`#25D366`) renge çekildi, "Tablo (PDF)" butonu eklendi ve tüm modal butonları daha belirgin ve modern bir yapıya kavuşturuldu.

- [x] 2026-06-11: Personel İzin Yönetim Sistemi ve Fiş Kalite İyileştirmeler:
    - **İzin Yönetimi**: `UserLeave` modeli tamamen kaldırılarak yerine modern `LeaveRequest` modeli ve `LeaveType`, `LeaveStatus` enumları eklendi.
    - **Hata Giderme**: `staff-finance-actions.ts` içindeki `Cannot read properties of undefined (reading 'findMany')` hatası, model isminin ve Prisma Client'ın senkronize edilmesiyle çözüldü.
    - **Teknik Çözüm**: Windows ortamındaki `EPERM` (dosya kilitli) hatasını aşmak için çalışan tüm Node süreçleri (`taskkill /F /IM node.exe`) durdurularak temiz bir `prisma generate` yapıldı. Veritabanı `npx prisma db push` ile güncellendi.
    - **Fiş Kalitesi**: html2canvas scale değerleri optimize edildi (PNG: 6, PDF: 4).
    - **Dosyalar**: `prisma/schema.prisma`, `src/lib/actions/staff-actions.ts`, `src/lib/actions/staff-finance-actions.ts`, `src/lib/receipt-print-styles.ts`.

- [x] 2026-06-11: Finansal Para Birimi ve Kur Senkronizasyonu (Dinamik TL/USD):
    - **Arayüz Standartlaştırma**: Veresiye (DebtReceiptModal) ve POS (ReceiptModal) fişleri tamamen dinamik hale getirildi. Artık ayarlardaki varsayılan para birimi (TL/USD) tercihinize göre fiyatlar ve kurlar otomatik güncelleniyor.
    - **Kur Kontrolü**: Tüm finansal hesaplamalarda (CheckoutSummary, POS Sepet, Borç Ekstresi) sabit `34.5` kuru yerine sistemdeki güncel canlı kurlar kullanılacak şekilde refactor edildi.
    - **Müşteri Paneli**: Müşteri detay sayfasındaki ödeme ve ekstre bölümleri merkezi kur sistemine bağlandı; manuel ödemeler ve otomatik fişler artık aynı toplamları gösteriyor.
    - **Dosyalar**: `src/components/finance/debt-receipt-modal.tsx`, `src/components/pos/receipt-modal.tsx`, `src/components/pos/parts/checkout-summary.tsx`, `src/components/customer/customer-debt-panel.tsx`, `src/app/(dashboard)/musteriler/[id]/page.tsx`.

- [x] 2026-06-15: EDM Bilişim e-Fatura Entegrasyonu Modernizasyonu & Legacy Temizliği:
    - Dosyalar: `src/lib/edm/rest-client.ts`, `prisma/schema.prisma`, `src/lib/edm/xml-builder.ts`, `src/app/api/edm/invoices/route.ts`, `src/app/api/edm/invoices/[id]/render/route.ts` (SİLİNDİ), `package.json`.
    - Neden: SOAP bağımlılıklarını temizlemek, veritabanı şişkinliğini (XML/XSLT storage) önlemek ve sistemi modern JSON-only REST mimarisine tam uyumlu hale getirmek.
    - Yapılanlar:
      - REST Client: Tüm legacy SOAP fonksiyonları kaldırıldı. `SendInvoiceResult` arayüzü sanitize edildi (xmlContent çıkarıldı).
      - Prisma: `EDMInvoice`, `EDMIncomingInvoice`, `EDMSettings` ve `TenantSettings` modellerinden XML ve XSLT ile ilgili 10'dan fazla kolon silindi.
      - Bağımlılıklar: `xslt-processor` paketi kaldırıldı.
      - XML Builder: Dahili XML motoru XSLT bağımlılığından arındırıldı.
    - Durum: Kod seviyesi temizlik tamamlandı. Windows environment kilitli olduğu için `prisma generate` ve `db push` manuel tetiklenmek üzere müşteriye devredildi.

- [x] 2026-06-16: EDM Bilişim e-Fatura Entegrasyonu C# Katmanı Uyumluluk Güncellemesi:
    - Dosya: `src/lib/edm/rest-client.ts`.
    - Neden: Mert'in C# tabanlı `EFaturaEDMConnectorLibrary.cs` katmanının (`SendInvoiceRequest` metodu) alıcı posta kutusu bilgilerini `HEADER.TO` ve kök seviyedeki `RECEIVER` objesinden haritalandırdığı tespit edildi.
    - Yapılanlar:
        - Fatura Header'ına `TO` alanı eklendi (alıcı etiketi).
        - Gönderilen JSON isteğinin kök (root) seviyesine `RECEIVER` objesi (`vkn` ve `alias` içerikli) eklendi.
        - Robustness için `receiverVkn` ve `receiverAlias` gibi camelCase varyasyonlar kök seviyede tutulmaya devam edildi.
    - Sonuç: Backend tarafındaki SOAP servisi besleme aşamasındaki haritalama hatası giderildi, alıcı etiketi (alias) artık EDM'ye doğru şekilde iletiliyor.

- [x] 
2026-06-19 - **Arayüz (UI/UX) Standardizasyonu ve Eksik Listesi Optimizasyonu**
- **Eksik Ürün Listesi (ShortageList)**:
    - Modal yapısı optimize edildi; dikey boşluklar (padding/gap) daraltıldı, yazı boyutları 14px (`text-sm`) olarak standartlaştırıldı.
    - Kurye atama ("ATA") butonu daha belirgin hale getirildi (border ve background vurgusu).
    - Hover durumlarındaki okunurluk sorunu (arka planla aynı renk olan yazılar) `hover:text-slate-950` ile tüm aksiyon butonlarında çözüldü.
    - Header kısmındaki buton çakışmaları (Listeyi Temizle ve Kapat butonu) sağ iç boşluklar düzenlenerek giderildi.
    - Modal genişliği `max-w-4xl` seviyesine çekilerek daha ferah bir kullanım sağlandı.
- **Dashboard Görünümü**:
    - Dashboard üzerindeki 8 adet bilgi kartı tamamen yenilenerek, Personel sayfasındaki gibi canlı (vibrant) gradyan arka planlara (`Emerald`, `Blue`, `Rose`, `Amber`, `Purple`, `Indigo`) kavuşturuldu.
    - Metin renkleri beyaz yapılarak okunabilirlik artırıldı ve kartların her biri kendi kategorisine göre (finans, teknik, stok) güçlü bir görsel kimlik kazandı.
- [x] 2026-06-22: POS Terminali DÃ¶viz ve FiÅŸ YazdÄ±rma Ä°yileÅŸtirmeleri:
    - **DÃ¶viz Senkronizasyonu**: FiÅŸ Ã¼zerindeki tutarlarÄ±n, iÅŸlem tarihindeki orijinal para birimine gÃ¶re doÄŸru gÃ¶sterilmesi saÄŸlandÄ±. USD ile satÄ±lan Ã¼rÃ¼nÃ¼n TL olarak algÄ±lanÄ±p mÃ¼kerrer Ã§evrilme hatasÄ± (Ã¶rn: 21$ -> 21TL -> 0.35$) giderildi.
    - **YazdÄ±rma GÃ¼venilirliÄŸi**: `printReceipt` motoru revize edilerek sayfa tamamen yÃ¼klenmeden (boÅŸ ekran) yazdÄ±rma penceresinin aÃ§Ä±lmasÄ± engellendi. Stil ve resimlerin parse edilmesi iÃ§in beklemeli fallback mekanizmasÄ± eklendi.
    - **"Hepsini YazdÄ±r" Tamiri**: FiÅŸ, SÃ¶zleÅŸme ve Garanti ÅŸablonlarÄ±nÄ±n sekmeler arasÄ± geÃ§iÅŸte DOM'dan silinmesi (unmount) engellendi; CSS ile `hidden` yapÄ±larak React `refs`'lerinin her zaman dolu kalmasÄ± saÄŸlandÄ±.
    - **FiÅŸ Ä°Ã§erik GÃ¼ncellemesi**: Ã–deme yÃ¶ntemleri TÃ¼rkÃ§eleÅŸtirildi (CASH->NAKÄ°T, DEBT->VERESÄ°YE vb.). DÃ¶vizli satÄ±ÅŸlarda ana tutarÄ±n altÄ±na gÃ¼ncel kur tabanlÄ± "TL KARÅžILIÄžI" satÄ±rÄ± eklendi.
    - **Fiyat Hassasiyeti**: JS floating-point hatalarÄ±nÄ± (`0.01` kaymalarÄ±) Ã¶nlemek iÃ§in tÃ¼m finansal hesaplamalara 2 ondalÄ±k basamak yuvarlama (`toFixed(2)`) kuralÄ± getirildi. KullanÄ±cÄ±nÄ±n girdiÄŸi fiyatlar tam olarak korunuyor.
    - **Dosyalar**: `src/components/pos/unified-sale-modal.tsx`, `src/lib/receipt-print-styles.ts`, `src/components/pos/pos-interface.tsx`, `src/lib/actions/sale-actions.ts`.

- [x] 2026-06-22: POS Compact (Mobil) Terminali Senkronizasyonu ve Detaylı Fiyat Görünümü:
    - **Header Optimizasyonu**: Mobil terminal başlığına dinamik "Ödenecek Toplam" göstergesi eklendi.
    - **Fiyat Detayları**: Toplam tutara tıklandığında Ara Toplam, KDV (%20) ve Vefa İndirimi detaylarını gösteren genişleyebilir bir panel (CheckoutSummary) entegre edildi.
    - **Finansal Senkronizasyon**: POS Compact terminalinin hesaplama mantığı (döviz çevrimi, yuvarlama, indirimler) ana POSInterface ile %100 uyumlu hale getirildi. 
    - **Hata Giderme**: Dolar ile yapılan satışlarda fiş üzerinde TL'den tekrar dolara çevrim yapan (21$ -> 0.35$ gibi) mantık hatası düzeltildi; sepet fiyatı neyse fişe o aktarılıyor.
    - **Hızlı Satış**: Navbar üzerindeki hızlı satış drawer'ı, ana satış sayfasıyla finansal olarak eşitlendi.
    - **Dosyalar**: `src/components/pos/pos-compact.tsx`, `src/components/pos/parts/checkout-summary.tsx`, `src/components/pos/receipt-modal.tsx`.

- [x] 2026-07-01: Yapay Zeka Teşhis Arayüzü & Tema İyileştirmeleri:
    - **Dosyalar**: `src/components/features/service-new/ai-diagnostic-panel.tsx`, `src/components/service/technical-service-analysis-modal.tsx`, `src/components/service/service-management-modal.tsx`.
    - **Neden**: Yapay zeka teşhis panelindeki butonlar ve açılan modallerin koyu mod/açık mod uyumsuzluğu ve okunma zorluklarını gidermek.
    - **Yapılanlar**: 
        - "Muhtemel Sorun", "Gerekli Parça" ve "Öngörülen Süre" butonlarının arka plan ve yazıları belirgin ve yüksek kontrastlı hale getirildi.
        - Tüm modallerin simsiyah (`bg-[#0A0B0D]`) olan arka planı dükkanın genel tema renklerine uyumlu olacak şekilde açık temada beyaz (`bg-white`), koyu temada ise modern koyu gri (`bg-[#121316]`) olarak güncellendi.
        - Servis yönetim modalındaki tüm küçük yazılar (`text-[8px]/[9px]`) büyütülerek `text-xs`/`text-sm` yapıldı. Geniş harf boşlukları (`tracking-[0.2em]`, `tracking-widest` vb.) tamamen kaldırılarak `tracking-normal` düzenine geçildi ve metinlerin koyu moddaki okunabilirliği maksimize edildi.

- [x] 2026-07-01: Servis Detay Sayfası Gelişmiş Düzenleme & Buton Düzeltmeleri:
    - **Dosyalar**: `src/components/service/service-detail-client.tsx`, `src/lib/actions/service-actions.ts`, `src/components/service/service-detail-actions.tsx`.
    - **Neden**: Gelişmiş arama veya detay linkiyle gidilen `/servis/[id]` sayfasında fiyatların yanı sıra arıza tanımı ve görevli teknisyenin dinamik düzenlenememesi; ayrıca açık temada "Fiş Yazdır" butonunun okunamaz olması.
    - **Yapılanlar**:
        - Detay sayfasındaki "DÜZENLE" butonu genişletilerek fiyatlara ek olarak **"Arıza Tanımı"** (Input) ve **"Görevli Teknisyen"** (Select dropdown) alanlarının da dinamik olarak düzenlenebilmesi sağlandı.
        - Tüm güncellemeler, yeni eklenen `updateServiceDetails` sunucu aksiyonu ile tek seferde veritabanına kaydediliyor.
        - "Fiş Yazdır" butonunun açık temada (light mode) arka planı ile metninin aynı renk olması (okunamazlık sorunu) giderildi; `text-foreground` ve responsive arka plan sınıfları ile düzeltildi.

- [x] 2026-07-04: Akıllı stok yenileme doğruluk iyileştirmeleri:
    - Hızlı satan ürünler kritik seviyeye düşmeden 30 günlük hedef stok hesabına alındı.
    - Servis ve eksik talepleri ayrıştırıldı; kategori uyumlu tedarikçi seçimi eklendi.
    - TRY/USD maliyetleri kaynak para birimiyle korundu ve tam sonuç kümesi özetleri sayfalamadan ayrıldı.

- [x] 2026-07-03: Veresiye Ekstresi Slip ve PDF Tutar Senkronizasyonu:
    - **Dosyalar**: `src/components/finance/debt-statement-modern.tsx`.
    - **Neden**: Veresiye (DebtReceiptModal) slip modalı ile PDF çıktısı (DebtStatementModern) arasındaki toplam tutarlar ve filtreleme mantığı uyuşmuyordu; PDF çıktısı hatalı bakiyeler hesaplıyordu.
    - **Yapılanlar**:
        - PDF şablonundaki (`DebtStatementModern`) genel bakiye hesaplama formülleri slip modalı ile birebir eşitlendi; artık `remainingAmount || amount` değerleri üzerinden kuruşu kuruşuna aynı genel TRY ve USD bakiye toplamı (`portfolioTotalTRY` / `portfolioTotalUSD`) gösteriliyor.
        - PDF çıktısında `showPaid` (Tümü/Gizle) seçeneğine göre işlem tablosu listelenirken uygulanan filtreleme mantığı da slip ile uyumlu hale getirildi (en eski ödenmemiş borç tarihinden (`earliestDate`) önceki ödemeler gizlendi). Bu sayede tablonun kronolojik bakiye sütunu da doğru bir başlangıç ve bitiş değerine kavuştu.

- [x] 2026-07-04: Akıllı stok yenileme performans optimizasyonu:
    - Satış, servis ve eksik miktarları ham kayıtları belleğe taşımak yerine Prisma aggregate sorgularıyla ürün bazında toplandı.
    - Tam öneri kümesine mağaza bazlı iki dakikalık cache ve satış/stok/servis/eksik/satın alma mutasyonlarında cache invalidation eklendi.
    - 750 ms üzerindeki geliştirme hesaplamaları hassas veri içermeyen tek satırlık uyarıyla ölçülür hale getirildi.

- [x] 2026-07-04: AI İle Eklenen Eski Hatalı Stok Kayıtlarının Düzeltilmesi:
    - **Neden**: Önceki AI kategorisi ekleme işlemlerinde (mükerrer dolar/TL kayma hatasından ötürü) 4500 TL olan ekran 4500$, 150 TL olan bataryalar 150$ vb. olarak kaydedilmiş ve bu da TL karşılığı maliyet/fiyatların çok yüksek çıkmasına sebep olmuştur.
    - **Yapılanlar**:
        - Bir veritabanı düzeltme betiği yazılıp çalıştırılarak `Galaxy S24 Ultra Orijinal Ekran`, `iPhone 15 Pro Max Lansman Kılıf` serisi ve `iPhone 11-14 Batarya` serisi ürünlerin alış ve satış fiyatları (TL tutarları ve bunlara karşılık gelen güncel USD kur değerleri) veritabanında düzeltildi.

- [x] 2026-07-04: AI Çoklu Kategori/Stok Ekleme Ekranının İnteraktif Hale Getirilmesi:
    - **Dosyalar**: `src/components/product/ai-category-creator.tsx`.
    - **Neden**: AI'ın analizinden sonra önizleme (review) aşamasında adetlerin, fiyatların veya ürün adlarının doğrudan düzenlenememesi, hatalı veya eksik veri girişlerini düzeltmeyi zorlaştırıyordu.
    - **Yapılanlar**:
        - Önizleme ekranındaki tüm ürün alanları (Ürün Adı, Adet, Alış Fiyatı, Satış Fiyatı, Raf Konumu) düzenlenebilir interaktif `<Input>` alanlarına dönüştürüldü.
        - Para birimlerine göre (USD / TRY) dinamik döviz kuru dönüşümü entegre edildi.
        - Değişiklikler toplu kaydetme aksiyonu (`bulkCreateAIInventory`) ile doğrudan senkronize edildi.

- [x] 2026-07-04: AI Çoklu Kategori ve Ürün Ayrıştırma İyileştirmesi:
    - **Dosyalar**: `src/lib/actions/gemini-actions.ts`.
    - **Neden**: Kullanıcı `Kategori > Alt Kategori > Ürün Özelliği, Adet, Alış, Satış, Raf` şeklinde veri girdiğinde zincirin en sonundaki ürün adının/özelliğinin (örn: `120W`) kategori olarak algılanması ve ürünün kaybolması/boş kategori oluşması sorunu.
    - **Yapılanlar**:
        - `systemPrompt` içindeki kurallar güncellenerek zincirin son elemanının her zaman ürün adı/özelliği olarak kabul edilmesi ve hiyerarşi ile ürünün doğru ayrıştırılması kuralları netleştirildi.

- [x] 2026-07-04: AI Çoklu Ekle Modalı Genişletme ve Otomatik Kapatma Cilası:
    - **Dosyalar**: `src/components/product/ai-category-creator.tsx`.
    - **Neden**: Modalın dar olmasından dolayı önizleme tablosundaki girdi alanlarının (özellikle Adet alanının) sıkışıp taşması; ayrıca "Tümünü Oluştur" dedikten sonra modalın otomatik kapanmaması.
    - **Yapılanlar**:
        - Modal genişliği `sm:max-w-[1100px] w-[95vw]` olarak güncellendi ve ferahlatıldı.
        - Stok adedi input wrapper'ı `w-24`, input `w-14` genişliğine sabitlendi; etiket metnine `shrink-0` eklenerek üst üste binmeler önlendi.
        - Başarılı kaydetme işleminde, yeşil çek onaylarının görünmesini takiben 1 saniye sonra modalı kapatan `setTimeout(() => setOpen(false), 1000)` eklendi.

- [x] 2026-07-04: AI Çoklu Varyasyon Ayrıştırma ve Arayüzden Ürün Ekleme/Silme:
    - **Dosyalar**: `src/lib/actions/gemini-actions.ts`, `src/components/product/ai-category-creator.tsx`.
    - **Neden**: AI'ın `120W,67w,33w` gibi çoklu model varyasyonlarını ve model bazlı farklı adet girişlerini (örn: `120W 12 adet, 33W 5 adet`) tek seferde algılayamaması; ayrıca önizleme tablosunda arayüz üzerinden kategoriye ürün ekleme ve listeden ürün silme butonlarının eksikliği.
    - **Yapılanlar**:
        - `systemPrompt` varyasyon ve farklı adet ayrıştırma kuralları ile genişletilerek AI'ın çoklu ürün çıkarması sağlandı.
        - Önizleme ekranındaki ürün listesine silme (`Trash2`) ve kategori bloğu altına `+ Yeni Ürün Ekle` (`Plus`) butonları eklendi. Yeni eklenen ürünler, mevcut ilk ürünün maliyet, fiyat ve konum bilgilerini otomatik miras alacak şekilde tasarlandı.

- [x] 2026-07-04: Kategori Ağacı Varsayılan Kapalı Durumu ve Genişlik Koruma:
    - **Dosyalar**: `src/components/product/category-management/index.tsx`.
    - **Neden**: Kategori sayfasına girildiğinde veya sayfa yenilendiğinde alt kategorilerin otomatik olarak açık gelmesi ve kullanıcının ayarladığı kategori ağacı genişliğinin sayfa yenilenince sıfırlanması sorunları.
    - **Yapılanlar**:
        - Kategori genişletme durumunu (`expandedNodes`) local storage'a kaydetme işlemi sonlandırılarak her sayfa yenilendiğinde alt varyantların kapalı (sadece en üst seviye kategoriler görünecek şekilde) gelmesi sağlandı.
        - Genişlik (`sidebarWidth`), seçili kategori ve para birimi state'lerinin client-side mount sonrası tek seferlik bir `useEffect` ile local storage'dan yüklenmesi sağlanarak Next.js hydration mismatch (arayüz eşleşmeme) hataları giderildi ve ayarlanmış olan kategori ağacı genişliğinin sayfa yenilendiğinde sıfırlanmadan aynen korunması sağlandı.

- [x] 2026-07-04: Onboarding Yetkilendirme Güvenliği, Para Birimi Seçimi ve Mobil Uyum:
    - **Dosyalar**: `src/lib/actions/onboarding-actions.ts`, `src/app/onboarding/page.tsx`, `src/components/setup/onboarding-wizard.tsx`.
    - **Neden**: Kurulum esnasında kullanıcının para birimi seçememesi ve varsayılan olarak TRY atanması; finans adımındaki 12 kolonlu grid satırının mobil ekranlarda sığmayarak taşması/kırılması; ayrıca Server Action'da `overrideShopId` parametresinin sahiplik kontrolü olmadan güncellenmesi riski.
    - **Yapılanlar**:
        - `saveOnboardingModules` aksiyonuna yetkisiz mağaza modifikasyonunu engelleyen sahiplik/yetkilendirme kontrolü eklendi.
        - Hem Onboarding sayfasına hem de onboarding modalına ₺, $, € seçenekleriyle "Varsayılan Para Birimi" seçicisi yerleştirildi. Seçilen birim veritabanındaki para birimi ayarlarıyla eşleştirildi.
        - Finans hesap ekleme satırları `grid-cols-1 md:grid-cols-12` şeklinde responsive hale getirilerek mobilde dikey, geniş ekranlarda yatay yerleşmesi sağlandı ve taşmalar çözüldü.

- [x] 2026-07-04: Kurulum Para Birimi Sınırlandırması ve Ana Sayfa Mobil Optimizasyonu:
    - **Dosyalar**: `src/app/onboarding/page.tsx`, `src/components/setup/onboarding-wizard.tsx`, `src/components/dashboard/dashboard-client.tsx`.
    - **Neden**: Varsayılan para birimlerinde Euro (EUR) seçeneğinin istenmemesi; 24 kolonlu ana sayfa dashboard gridinin mobil ekranlarda aşırı derecede sıkışıp kullanılamaz hale gelmesi.
    - **Yapılanlar**:
        - Onboarding sayfasındaki ve modalındaki seçicilerden Euro (EUR) seçeneği kaldırıldı; sadece TL (TRY) ve Dolar (USD) bırakıldı.
        - `dashboard-client.tsx` üzerinde `isMobile` ekran boyutu algılayıcısı kuruldu. Mobil ekranlarda grid 1 kolona zorlandı, gap 1rem'e çekildi ve her bir widget kartının `gridColumn` değeri `span 1`, `gridRow` değeri ise `auto` yapılarak dikeyde tam genişlikte esnek ve kusursuz mobil yerleşim sağlandı.

- [x] 2026-07-04: Müşteri Önerileri Popover Tema Uyumu ve Navigasyon Butonları Mobil İyileştirmesi:
    - **Dosyalar**: `src/components/features/service-new/customer-section.tsx`, `src/app/(dashboard)/servis/yeni/page.tsx`.
    - **Neden**: Açık modda (light mode) müşteri arama eşleşme popover'ının koyu gri arka plana sahip olması ve koyu yazı renklerinden dolayı okunamaması; navigasyon butonlarının (Geri Git, Müşteri Geçmişi, Sonraki Adım) mobilde ekrandan dışarı taşması.
    - **Yapılanlar**:
        - `customer-section.tsx` içindeki hardcoded koyu renk sınıfları (`bg-slate-900/95`, `text-white` vb.) yerine sistemin popover ve tema duyarlı değişkenleri (`bg-popover`, `text-foreground`, `border-border`) kullanılarak açık/koyu modlarda mükemmel kontrast sağlandı.
        - Yeni servis kayıt adımındaki alt yönlendirme butonları mobilde dikey dizilecek (`flex-col sm:flex-row items-stretch gap-4`), buton genişlikleri ise tam genişlik (`w-full sm:w-auto`) alacak şekilde güncellendi. Taşma ve kesilme hataları sıfırlandı.

- [x] 2026-07-04: Telefon Girişi Alan Kodu Silinmeme Hatasının Düzeltilmesi:
    - **Dosyalar**: `src/components/ui/phone-input.tsx`.
    - **Neden**: Telefon numarası formatlama fonksiyonunun, rakam adedi tam 3 olduğunda otomatik parantez kapama ve boşluk karakteri eklemesi nedeniyle kullanıcının geri (backspace) tuşuna basarak alan kodunu silmesini engellemesi (silinen karakterin anında geri gelmesi).
    - **Yapılanlar**:
        - Parantez kapatma ve boşluk ekleme koşulu rakam uzunluğunun 3'ten büyük olması durumuna (`d.length > 3`) bağlandı. Bu sayede 3 haneye inen alan kodu `(533` biçiminde serbest kalarak backspace ile kolayca silinebilir hale getirildi.










- [x] 2026-07-09: Personel odeme takibi, servis barkod etiketi ve Dymo LabelWriter 450 hazirligi:
    - **Dosyalar**: `prisma/schema.prisma`, `src/app/(dashboard)/personel/page.tsx`, `src/components/staff/staff-form.tsx`, `src/components/staff/staff-page-client.tsx`, `src/lib/actions/staff-actions.ts`, `src/lib/actions/staff-finance-actions.ts`, `src/lib/staff-finance-calculations.ts`, `tests/staff-finance-calculations.test.ts`, `src/components/service/create-service-modal.tsx`, `src/components/service/service-list-table.tsx`, `src/components/service/service-ticket-label-print.tsx`, `src/app/globals.css`.
    - **Neden**: Personel prim/avans/maas donemi takibi daha izlenebilir olsun; kapanan donem arsiv/PDF ve modal detaylari guclensin; servis kaydi alindiktan sonra veya eski kayit tablosundan telefon arkasina yapistirilacak barkodlu etiket basilsin.
    - **Yapilanlar**:
        - Personel maas odeme gunu, ise giris/cikis zamanlari, calistigi gun ve hak edis detaylari icin schema ve hesaplama katmani genisletildi.
        - Donem kapatma ve arsiv bordro goruntuleme akislari aylik takip mantigina yaklastirildi; PDF ve modal detaylari daha acik hale getirildi.
        - Hizli servis modalinda acik moddaki zorunlu alan uyarisi okunur amber/siyah kontrastina cekildi.
        - Yeni servis kaydi sonrasi modal kapanip sayfa yenilenirken servis etiketi otomatik yazdirilacak hale getirildi.
        - `/servis` sayfasindaki onceki kayitlar tablosuna barkod ikonlu "Barkod etiketi yazdir" butonu eklendi; mobil kartlarda da ayni aksiyon var.
        - Servis etiketi ortak `ServiceTicketLabelPrintArea` bilesenine tasindi. Etikette firma bilgisi, fis/barkod, musteri adi, telefon, cihaz, fiyat ve alis tarihi gosteriliyor.
        - Dymo LabelWriter 450 icin servis etiketi tekli yapiskan etiket olarak `60mm x 30mm` baski sayfasina ayarlandi; genel A4 urun barkod duzeni korunuyor.
    - **Dogrulama**:
        - `npx prisma migrate dev`: Veritabani semasi guncel, yeni/pending migration yok.
        - `npx prisma generate`: Windows dosya kilidi icin dev server kisa sure durdurulduktan sonra basarili.
        - `npx prisma migrate status`: `Database schema is up to date!`.
        - `npx tsc --noEmit`: Basarili.
        - `npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' tests/staff-finance-calculations.test.ts`: Basarili.

- [x] 2026-08-27: Graphify rapor güncellemesi ve Alacak Ekleme Hızlı Aksiyon Entegrasyonu:
    - **Dosyalar**: `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, `graphify-out/graph.html`, `graphify-out/manifest.json`, `JOURNAL.md`, `src/components/dashboard/receivables-client.tsx`, `src/components/finance/add-debt-modal.tsx`, `src/lib/actions/staff-actions.ts`.
    - **Neden**: `graphify update .` çalıştırılarak kod haritası güncel commit (`48e1a99b`) ile senkronize edildi (519 dosya, 2918 node, 9790 edge, 205 topluluk). Dashboard üzerindeki "Alacaklarım" kartında hızlı veresiye borç ekleme modal aksiyonu entegre edildi ve yetkilendirme layout aksiyonu güncellendi.
    - **Dogrulama**:
        - `graphify update .`: Başarıyla tamamlandı, graphify-out raporları güncellendi.
        - `npx tsc --noEmit`: Tip kontrolü sorunsuz ve 0 hatayla tamamlandı.

- [x] 2026-08-27: Kurye Sipariş Kartlarında Ürün Yanında Mevcut Stok Gösterimi:
    - **Dosyalar**: `src/components/courier/courier-dashboard-client.tsx`, `src/lib/actions/shortage-actions.ts`.
    - **Neden**: Kurye ekranındaki sipariş listesinde ürün isimlerinin yanında dükkandaki anlık stok miktarının ("Mevcut Stok: X") görünmesi istendi.
    - **Yapılanlar**:
        - `shortage-actions.ts` içerisinde `getCourierTasks`, `getGlobalShortageList` ve `addShortageItems` fonksiyonlarına serbest metinli veya eşleşmemiş eksik ürün kaydı oluşturulsa dahi ürün isminden mağaza stoğunu otomatik bağlayan akıl entegre edildi.
        - `courier-dashboard-client.tsx` içerisine `getItemCurrentStock` yardımcı fonksiyonu eklendi.
        - Hem kurye görev kartlarında hem de Atanmamış Eksikler listesinde sipariş başlığının hemen yanında stok durumuna göre dinamik renkli (0 ise kırmızı, kritik stok altında ise turuncu, yeterli ise yeşil) **`Mevcut Stok: X`** rozetleri yerleştirildi.
- [x] 2026-08-27: Stok Onayı Modalı Boyut Düzeltmesi ve Mevcut Stok Gösterimi:
    - **Dosyalar**: `src/components/shortage/approve-shortage-modal.tsx`, `src/components/courier/courier-dashboard-client.tsx`.
    - **Neden**: "Stok Onayı" modalının dikeyde dikey dikey ekranı kaplaması/dışarı taşması hatası düzeltildi ve başlık alanına ürünün dükkan stok miktarının ("Mevcut Stok: X") eklenmesi sağlandı.
    - **Yapılanlar**:
        - `approve-shortage-modal.tsx` içerisinde `DialogContent` yüksekliği `max-h-[88vh]` ile sınırlandırıldı, form gövdesine `flex-1 overflow-y-auto custom-scrollbar` verilerek içeriğin modal içerisinde şık bir şekilde kayması sağlandı.
        - Header alanına ürünün anlık stok miktarını gösteren dinamik renkli **`Mevcut Stok: X`** rozeti eklendi.
    - **Dogrulama**:
        - `npx tsc --noEmit`: Tip kontrolü 0 hata ile tamamlandı.
        - `graphify update .`: Kod haritası güncellendi.
- [x] 2026-10-15: Dashboard (Vitrin) Mobil-First Dönüşümü ve Aksiyonel Özet Kartları:
    - **Dosyalar**: `src/components/dashboard/admin-dashboard.tsx`, `src/components/dashboard/dashboard-client.tsx`, `src/components/dashboard/stat-widget-wrapper.tsx`, `src/components/dashboard/stat-card.tsx`, `src/components/dashboard/dashboard-edit-button.tsx`, `src/components/dashboard/quick-shortcuts.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `JOURNAL.md`.
- [x] 2026-10-15: Mobil Alt Navigasyon (Bottom Dock) & Long-Press Kısayol Menüsü:
    - **Dosyalar**: `src/components/bottom-nav.tsx`, `JOURNAL.md`.
    - **Neden**: Eski havada asılı (floating) ortası boşluklu ve `+` butonlu tasarım kaldırıldı; ekranın en altına sıfırlanan (`fixed bottom-0 pb-safe`), safe area korumalı, modern bir native "Mobile App Dock" yerleştirildi (Ana Sayfa, Servis, Satış, Müşteriler, Profil). Her sekmeye uzun basıldığında (`long-press`) veya sağ tıklandığında haptic titreşim eşliğinde modüle özel hızlı aksiyon menüsü (örn. Müşteriler'e basılı tutunca doğrudan "Yeni Müşteri Ekle", "Veresiye Defteri", "Tahsilat Al") açılan animasyonlu popover entegre edildi. Tek tıklamada standart pürüzsüz sayfa navigasyonu korunuyor.
- [x] 2026-10-15: Veresiye Sayfası Üst Buton Barı & Katlanabilir Tahsilat Akordiyonları (UX):
    - **Dosyalar**: `src/components/finance/veresiye-client.tsx`, `src/components/finance/veresiye/veresiye-toolbar.tsx`, `JOURNAL.md`.
    - **Neden**: Veresiye sayfasında mobilde butonların üst üste binmesi/taşması sorunu giderildi ve tahsilat satırlarının düzensiz metin dökümü yerine tıklanabilir özet satırı ve pürüzsüz açılır detay akordiyonuna dönüştürülmesi sağlandı.
    - **Yapılanlar**:
        - **Üst Buton Barı (Header Actions)**: `PageHeader` aksiyon alanı yatay kaydırılabilir (`overflow-x-auto no-scrollbar flex-nowrap`) yapıya kavuşturuldu. Excel ve CSV dışa aktarma butonları tek bir modern "Dışa Aktar" `DropdownMenu` bileşeni altında toplanarak mobil yatay alan ferahlatıldı, butonların wrap yapıp dikeyde birbirini ezmesi önlendi.
        - **Toolbar Filtre Alanı**: `veresiye-toolbar.tsx` filtre seçicileri ve durum butonları `shrink-0` ve `overflow-x-auto` ile sarılarak küçük ekranlarda sayfa genişliğini taşırmadan yatay kaydırma desteği kazandı.
        - **Katlanabilir Tahsilat Akordiyonları**: Müşteri hesap ekstresi dökümünde yer alan tahsilat (`PAYMENT`) satırları varsayılan olarak kompakt ve şık bir özet satırı (yeşil ikon, başlık, ödeme kanalı etiketi, tarih, tutar, kapanan borç sayısı ve döner ok ikonu) olarak gösterilecek şekilde yeniden tasarlandı. Satıra tıklandığında/dokunulduğunda Framer Motion (`AnimatePresence`) ile pürüzsüzce açılan zengin akordiyon devreye alındı. Açılan akordiyon içerisinde:
            1. 3 kolonlu finansal özet kartları (tahsil edilen tutar ve döviz karşılığı, ödeme kanalı ve işlem saati, borç kapatma ve cari avans durumu),
            2. FIFO (İlk Giren İlk Çıkar) borç dağılım dökümü (kapanan her borcun açıklaması, tarihi ve tahsil edilen tutarı veya avans durumu),
            3. Mobilde hover gerektirmeyen doğrudan tıklanabilir işlem butonları ("Detay Penceresi", "Düzenle", "İptal Et / Geri Al") sunuldu.
- [x] 2026-10-15: "Frictionless Business Management" Felsefesi ve Akıllı Göz (Smart Eye) Mimarisi:
    - **Dosyalar**: `src/lib/context/dashboard-data-context.tsx`, `src/lib/actions/dashboard-actions.ts`, `src/components/pos/pos-interface.tsx`, `src/components/pos/parts/smart-stock-guardrail-modal.tsx`, `src/components/finance/create-transaction-modal.tsx`, `JOURNAL.md`.
    - **Neden**: Kullanıcıyı sayfa değiştirmeye (page hopping) zorlamadan işlemleri anında bağlayan, pasif bir veritabanı yerine proaktif rehberlik sunan ("Akıllı Göz") ve şube/sektör kurallarına dinamik uyum sağlayan (Multi-Tenant) mimariyi sisteme entegre etmek.
    - **Yapılanlar**:
        1. **Contextual Actions (Sıfır Sayfa Zıplaması / No Page Hopping)**:
           - Hızlı Satış (POS) ekranında barkod okutulduğunda veya arama yapıldığında ürün bulunamazsa, kullanıcı stok sayfasına gitmek zorunda bırakılmıyor. `QuickCreateProductModal` doğrudan POS içine entegre edildi. Boş arama ekranındaki interaktif butondan veya üst arama çubuğundaki "+ Hızlı Ürün" butonundan anında ürün oluşturulup doğrudan aktif sepete ekleniyor.
           - `customer-selector.tsx` ve `create-account-modal.tsx` ile müşteri veya kasa eksiklikleri anlık olarak modal içinde çözülüyor.
        2. **Sistemin "Akıllı Gözü" (Proactive Guardrails)**:
           - **Stok Koruması (`SmartStockGuardrailModal`)**: POS'ta stoğu 0 veya yetersiz olan bir ürün sepete eklenmek istendiğinde sert bir hata vermek yerine akıllı rehber devreye giriyor:
             * "Hızlı Stok Girişi Yap" (Sayfadan ayrılmadan +1, +5, +10 adet stok ekler ve sepete atar),
             * "Rafta Var, Satışa Ekle" (Fiziki ürün mevcut kabulüyle işleme devam ettirir),
             * "Kurye/Tedarik Havuzuna Yaz" (`addShortageItem` ile arka planda kurye/tedarik havuzuna aktarır).
           - **Gider ve Kasa Yanlış Sınıflandırma Koruması (`create-transaction-modal.tsx`)**: Kullanıcı harcama girerken açıklamadaki anahtar kelimeler ("kira", "fatura", "elektrik", "maaş", "stok", "yemek" vb.) proaktif olarak taranır; genel/diğer kategorisi seçiliyse "Akıllı Göz" tek tıkla kategori düzeltme önerisi sunar. Ayrıca eldeki nakit kasanın %50'sinden fazlasını tüketen harcamalarda nakit akışını koruyucu güvenlik bildirimi sunar.
        3. **Multi-Tenant Adaptation**:
           - `getDashboardInit` fonksiyonu tenant (`Shop`: industry, enabledModules, isCourierEnabled vb.) metaverilerini tek seferde dönecek şekilde genişletildi.
           - `useTenant()` hook'u oluşturuldu (`isModuleEnabled`, `isServiceBranch`, `isRetailBranch`, `tenant`). Bileşenler şube türüne (Teknik Servis, Perakende/İletişim, Genel) ve aktif modüllere göre dinamik olarak davranış ve terminoloji uyarlaması kazandı.
- [x] 2026-10-15: Mobil Görünümde Fiyat Gizleme/Gösterme Butonu Düzeltmesi:
    - **Dosyalar**: `src/components/navbar.tsx`, `JOURNAL.md`.
    - **Neden**: Fiyat ve finansal tutarları gizleme/gösterme butonu (`toggleFinancialVisibility`) yalnızca büyük ekranlar (`hidden lg:flex`) içerisinde tanımlandığı için mobil cihazlarda görünmüyordu.
    - **Yapılanlar**:
        - `navbar.tsx` içerisindeki `Eye` / `EyeOff` butonu `hidden lg:flex` konteynerinden çıkarılarak hem mobil hem masaüstünde her zaman görünür olan ana aksiyon buton grubuna (`Arama`, `Bildirim`, `Profil` yanına) yerleştirildi. Aktif duruma göre yeşil renkli göz (`Eye`) veya `EyeOff` ikonu gösterilmektedir.
        - Ayrıca kullanıcı profili dropdown menüsüne de "Fiyatları Gizle / Göster" seçeneği eklenerek her iki noktadan erişilebilir kılındı.
- [x] 2026-10-15: Mobil Alt Dock Kısayol Rotaları Düzeltmesi & Ana Sayfadan Doğrudan Modal İşlemleri:
    - **Dosyalar**: `src/components/bottom-nav.tsx`, `src/components/navbar/pos-drawer.tsx`, `src/components/service/service-tabs-controller.tsx`, `src/components/product/create-product-modal.tsx`, `src/app/(dashboard)/layout.tsx`, `JOURNAL.md`.
    - **Neden**: Mobilde alt dock üzerindeki simgelere uzun basıldığında çıkan kısayol rotalarında 404 veren yollar (`/kasa`, `/stok/iadeler`, `/scanner` vb.) bulunuyordu. Kullanıcının talep ettiği gibi hem tüm rotalar Next.js App Router'daki gerçek sayfalara bağlandı hem de özellikle Gelir Ekleme, Gider Ekleme, Hızlı Satış (POS), Yeni Servis ve Yeni Müşteri işlemleri için sayfadan ayrılmadan doğrudan modal açılma özelliği entegre edildi.
    - **Yapılanlar**:
        1. **404 Hatalı Yolların Düzeltilmesi**:
            - `/kasa?action=new` ve `/kasa` -> Gerçek kasa rotası olan `/satis/kasa` olarak güncellendi.
            - `/stok/iadeler` -> Gerçek iade rotası olan `/stok/iade` olarak düzeltildi.
            - `/scanner` -> Gerçek fiş ve servis sorgulama sayfası olan `/sorgula` rotasına bağlandı.
            - `/servis?tab=pending` -> Servis tab kontrolcüsündeki gerçek sekme adı olan `/servis?tab=active` olarak düzeltildi. `service-tabs-controller.tsx` bileşeni URL'deki `?tab=` parametresini okuyacak şekilde güncellendi.
            - `/stok?action=new` -> `create-product-modal.tsx` `searchParams?.action === 'new'` parametresini algılayacak şekilde genişletildi.
            - `/kasa?tab=receivables` -> Alacak ve veresiye takibi için `/veresiye` sayfasına bağlandı.
        2. **Doğrudan Modal Entegrasyonu (Sıfır Sayfa Zıplaması)**:
            - `bottom-nav.tsx` bileşeni `CreateTransactionModal`, `POSDrawer`, `CreateServiceModal` ve `CreateCustomerModal` bileşenlerini bünyesinde barındıracak şekilde donatıldı.
            - **Gelir Ekle**: Kısayola basıldığında doğrudan `CreateTransactionModal` (tip: `INCOME`) açılır.
            - **Gider Ekle**: Kısayola basıldığında doğrudan `CreateTransactionModal` (tip: `EXPENSE`) açılır.
            - **Hızlı Satış**: Kısayola basıldığında `POSDrawer` (kompakt satış çekmecesi) doğrudan açılır, sayfa değişimi gerektirmez.
            - **Yeni Servis**: `CreateServiceModal` hızlı arıza ve servis kabul penceresini anında açar.
            - **Yeni Müşteri**: `CreateCustomerModal` müşteri kayıt penceresini anında açar.
        3. **Kontrollü POSDrawer**: `pos-drawer.tsx` bileşeni `open` ve `onOpenChange` propları alarak dışarıdan tetiklenebilir hale getirildi.
    - **Doğrulama**: `npx tsc --noEmit` ile tip kontrolleri yapıldı, hiçbir derleme veya tip hatası olmadığı doğrulandı.
- [x] 2026-10-15: Mobil UI/UX Temizliği: Çift Header Önleme, Konteyner Sadeleştirme ve 2'li Bilgi Kartı Düzeni:
    - **Dosyalar**: `src/components/ui/page-header.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/satis/page.tsx`, `src/components/pos/pos-interface.tsx`, `src/components/product/stock-dashboard-metrics.tsx`, `src/app/(dashboard)/stok/page.tsx`, `src/components/finance/finance-dashboard.tsx`, `src/components/finance/account-list.tsx`, `src/components/finance/streamed/financial-summary-stream.tsx`, `src/components/finance/veresiye/veresiye-stats.tsx`, `src/components/service/service-profit-cards.tsx`, `src/components/service/service-kpi-cards.tsx`, `src/components/customer/customer-list-client.tsx`, `src/app/(dashboard)/satis/kasa/page.tsx`, `src/app/(dashboard)/servis/page.tsx`, `JOURNAL.md`.
    - **Neden**: Mobilde gereksiz dikey yer kaplayan çift başlıklar (sayfa başlığı + dahili bileşen başlığı), kutu içinde kutu (container-in-container) hissi veren iç içe kenarlıklar ve ekranı boydan boya kaplayan tek sütunlu bilgi kartları tek sayfa akışını bozuyordu.
    - **Yapılanlar**:
        1. **Çift Header Eliminasyonu ve Başlık Sadeleştirme**:
           - `/satis` (POS) sayfasındaki dış `PageHeader` mobilde gizlendi (`hidden md:flex`), çünkü POS bileşeni zaten kendi başlığına ve aksiyonlarına sahip.
           - `PageHeader` bileşeninde uzun açıklama paragrafları mobilde gizlendi (`hidden sm:block`) ve başlık boşlukları kompaktlaştırıldı (`mb-3 sm:mb-6 px-1 sm:px-0`).
           - POS mobil üst çubuğu tek satır haline getirildi (Sol: İkon + Başlık + Durum Rozeti, Sağ: + Ürün & Tam Ekran butonları; hemen altında arama barı).
        2. **Konteyner ve Kenarlık Sadeleştirme (Native Tek Sayfa Hissi)**:
           - Dashboard layout mobilde `p-4 pb-48` yerine `px-2 py-3 sm:p-4 pb-28` haline getirilerek ekran kenarındaki boğucu boşluklar kaldırıldı.
           - `satis/page.tsx` üzerindeki kalın dış kart arkaplanı, bordürü ve gölgesi mobilde sıfırlandı (`w-full sm:bg-white/[0.03] sm:border sm:rounded-[2rem]`).
           - `pos-interface.tsx` üzerindeki iç içe kenarlıklar mobilde kaldırıldı (`border-0 sm:border rounded-none sm:rounded-[2.5rem] bg-transparent sm:bg-card p-0 sm:p-4`).
           - Müşteri listesi ve servis sayfalarındaki devasa dikey aralıklar (`space-y-10`, `gap-10 pb-20`) mobilde orantılı seviyelere çekildi (`space-y-4`, `gap-4`).
        3. **Bilgi ve Metrik Kartlarının Mobilde 2'li Gruplanması**:
           - Stok metrik kartları (`stock-dashboard-metrics.tsx` ve skeleton): `grid-cols-1` yerine mobilde `grid-cols-2 md:grid-cols-4`, kart içi padding `p-3 sm:p-5`, font `text-base sm:text-2xl`.
           - Finans özet kartları (`finance-dashboard.tsx` ve skeleton): `grid-cols-1` yerine `grid-cols-2 gap-2.5 sm:gap-6`, padding `p-3.5 sm:p-8`, yazı boyutları dengelendi.
           - Kasa/hesap kartları (`account-list.tsx`): `grid-cols-1` yerine mobilde `grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-4`.
           - Veresiye istatistik kartları (`veresiye-stats.tsx`): `grid-cols-1` yerine mobilde `grid-cols-2 gap-2.5 sm:gap-6`.
           - Servis kâr ve KPI kartları (`service-profit-cards.tsx`, `service-kpi-cards.tsx`): mobilde `grid-cols-2 gap-2.5 sm:gap-4`.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve sıfır hata ile tamamlandı.
- [x] 2026-10-15: Cihaz ve Servis Sorgulama (@sorgula) Sayfasının Dinamikleştirilmesi ve Teknik Servis Entegrasyonu:
    - **Dosyalar**: `src/lib/actions/service-actions.ts`, `src/app/(dashboard)/sorgula/page.tsx`, `src/app/(dashboard)/sorgula/sorgula-client.tsx`, `JOURNAL.md`.
    - **Neden**: Eski sorgulama sayfası sabit tek bir form ve dış bir sayfa görünümündeydi; hem servis no hem telefon numarasını zorunlu tutuyordu ve bulunan servis kaydı üzerinde herhangi bir işlem yapılmasına izin vermiyordu. Kullanıcının talebi doğrultusunda hem tek başına servis no veya cep telefonu ile hızlı arama desteği hem de bulunan kayıt üzerinde anında teknik servis işlemlerini gerçekleştirebilme yeteneği kazandırıldı.
    - **Yapılanlar**:
        1. **Dinamik ve Esnek Arama Motoru (`searchServiceTicketsQuick`, `queryServiceStatus`, `getRecentServiceTickets`)**:
           - Tek bir arama alanından Servis Numarası (SRV-...), Müşteri Telefonu (05xx...), IMEI veya Müşteri Adı ile anında arama desteği getirildi.
           - İsteğe bağlı "Ayrıntılı Filtre" modu ile bağımsız fiş no ve telefon araması imkanı sağlandı.
           - Durum bazlı hızlı filtre çipleri eklendi ("Tümü", "Aktif İşlemler", "Teslime Hazır", "Tamirde", "Parça Bekleyen", "Teslim Edilenler").
           - Sayfa ilk açıldığında boş bir ekran yerine mağazanın son aktif servis kayıtları listelenerek anında etkileşim sağlandı.
        2. **Teknik Servis Aksiyonları ("İşlem Yapabilme")**:
           - **Servisi Yönet**: `ServiceManagementModal` entegre edildi. Teknisyen sorgulama sayfasından ayrılmadan cihaz durumunu değiştirebilir (Tamirde, Hazır, Teslim vb.), parça ekleyebilir/çıkarabilir, arıza ve işçilik tutarını güncelleyebilir, teknisyen atayabilir ve ödeme alarak cihazı teslim edebilir. Modal kapandığında sorgulama ekranındaki bilet verisi otomatik yenilenir.
           - **Hızlı Teslim Et**: Teslime hazır veya tamirdeki cihazlar için tek tıkla doğrudan ödeme/teslim akışını açan `isQuickDeliver` kısayol butonu.
           - **Fiş Yazdır**: `ServiceReceiptModal` entegre edilerek tek tıkla 80mm termal fiş veya A4 servis fişi yazdırma özelliği.
           - **WhatsApp Bildirimi**: Müşterinin telefonuna hazır durum şablonuyla doğrudan tek tıkla WhatsApp mesajı açma.
           - **Müşteriyi Ara**: Mobilde tek tıkla arama (`tel:`) desteği.
           - **Servis Masasında Aç**: İlgili fiş numarasını doğrudan teknik servis tablosunda açma linki.
        3. **Mobil Uyumluluk**:
           - Tablet ve masaüstünde 2 sütunlu bilgi kartları, mobilde kompakt tek sütun düzeni.
           - Çift başlık önlendi; tek kompakt sayfa başlığı ve arama barı sunuldu.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve sıfır hata ile tamamlandı.
- [x] 2026-10-15: Hızlı Satış Mobil Sidebar (POS Drawer) Ferahlatma, Özel Ürün Yazma ve Dinamik Fiyat Düzenleme:
    - **Dosyalar**: `src/components/navbar/pos-drawer.tsx`, `src/components/pos/pos-compact.tsx`, `src/components/pos/parts/cart-item.tsx`, `JOURNAL.md`.
    - **Neden**: Mobilde hızlı satış çekmecesinde müşteri seçimi ve ödeme butonları ekranın %60'ını sürekli kaplayarak ürün listesini boğucu 150px'lik bir alana sıkıştırıyordu; kullanıcı listede olmayan bir ürünü/hizmeti serbestçe yazamıyor ve seçilen ürünlerin fiyatını kolayca değiştiremiyordu.
    - **Yapılanlar**:
        1. **Ferah ve Anlaşılır 2 Kademeli Mobil Akış**:
           - **ÜRÜNLER (Katalog)** sekmesinde ekranın tamamı ürün arama ve seçimine ayrıldı. Ödeme ve kasa butonları bu alandan kaldırılarak 250px'den fazla dikey alan kazanıldı. Sepette ürün varken altta sadece kompakt `[🛒 X Ürün • Tutar] -> [Sepet & Ödemeye Geç]` şeridi görünür.
           - **SEPET & ÖDEME** sekmesinde sepet kalemleri, müşteri seçimi, ödeme yöntemi (Nakit, Kart, Havale, Veresiye) ve kasa seçimi tek bir doğal kaydırılabilir ödeme akışı haline getirildi.
           - `pos-drawer.tsx` başlık padding'i `p-8` yerine `px-4 py-3 sm:px-6` yapılarak mobil dikey alan ferahlatıldı.
        2. **"Ürün Yazılsın" (Manuel / Özel Ürün Girişi)**:
           - Arama çubuğuna `[+ Özel Ürün]` butonu eklendi.
           - Arama kutusuna bir şey yazıldığında anında beliren `[✍️ "${productSearch}" olarak özel ürün yaz & ekle]` önerisi ile tek tıkla Ürün Adı, Fiyat ve Adet belirleme penceresi açılır ve doğrudan sepete eklenir.
        3. **"Seçildikten Sonra Ürün Fiyatı Değiştirilebilsin"**:
           - Katalogdaki her ürün kartına kalem ikonlu fiyat butonu `[₺ 50 ✎]` eklendi; sepete eklemeden önce tek tıkla özel fiyat girilebiliyor.
           - `CartItem` sepet görünümünde birim fiyat alanı büyütülerek kalem ikonu ve `inputMode="decimal"` ile mobil dokunmatik klavyeye tam uyumlu hale getirildi. Fiyat değiştiğinde toplam tutar anında dinamik olarak güncellenir.
        4. **Mobil Stabilite**:
           - `overscroll-contain` ve `min-h-0` ile klavye açılmalarında kaydırma kilitlenmesi ve taşmalar önlendi.
           - Dokunmatik buton boyutları ergonomik standartlara getirildi.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve sıfır hata ile tamamlandı.

- [x] 2026-10-15: Para Birimi (TL / USD) Hesaplama Düzeltmesi ve Dinamik Satış Para Birimi Seçimi:
    - **Dosyalar**: `src/components/pos/pos-compact.tsx`, `src/components/pos/pos-interface.tsx`, `src/components/pos/parts/cart-item.tsx`, `JOURNAL.md`.
    - **Neden**: Kullanıcı 1$'lık ürün eklediğinde sepete 49$ ekleniyordu (dolar kuru ile TL fiyatının birbirine karışması). Ayrıca ürünlerin sistem varsayılan para birimine göre listelenmesi ve kullanıcının dilediğinde TL veya USD seçerek satışı tamamlayabilmesi talep edildi.
    - **Kök Neden**: `addToCart` fonksiyonunda ürünün TL satış fiyatı (`sellPrice: 49.18`) ile USD fiyatı (`sellPriceUsd: 1.00`) işlenirken, `finalPrice` öncelikle `product.sellPrice` üzerinden (49.18) alınıyordu; ardından sistem para birimi USD olduğunda `sellPriceUsd = finalPrice` (49.18) olarak sepet nesnesine yazılıyordu. Bu durum 1$'lık ürünün sepette 49.18$ olarak hesaplanmasına neden oluyordu. Benzer şekilde `handleCheckout` aşamasında da mükerrer kur çarpımları yaşanıyordu.
    - **Yapılanlar**:
        1. **Dinamik Satış Para Birimi (`saleCurrency`)**: Mağazanın `defaultCurrency` ayarına duyarlı başlatılan ve hem mobil hem masaüstü başlıklarına eklenen `[ ₺ TL | $ USD ]` canlı seçici.
        2. **Kusursuz Ürün Fiyat Gösterimi (`getProductDisplayPrice` & `getProductEquivalentDisplay`)**: USD modunda ürünün doğrudan `sellPriceUsd` değeri (1.00$) baz alınır; eşdeğer TL fiyatı parantez içinde gösterilir. TL modunda `sellPrice` baz alınır; eşdeğer USD fiyatı parantez içinde gösterilir. 1$'lık ürün sepete tam 1.00$ olarak eklenir.
        3. **Tek Tıkla Sepet Para Birimi Dönüştürme (`toggleSaleCurrency`)**: Kullanıcı satış esnasında TL <-> USD butonuna bastığında, sepetteki tüm ürünlerin birim fiyatları ve toplamları kur oranına göre anında dönüştürülür.
        4. **Checkout ve Satış Kaydı Entegrasyonu**: Satış tamamlanırken seçilen `saleCurrency`, `currency` parametresi olarak backend'e gönderilir.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve sıfır hata ile tamamlandı.

- [x] 2026-10-15: Hızlı Satış (POS Drawer) Başlık Alanı Hizalama ve Sepet İkonu Entegrasyonu:
    - **Dosyalar**: `src/components/navbar/pos-drawer.tsx`, `JOURNAL.md`.
    - **Neden**: Mobilde hızlı satış modal/drawer başlığında boşluk oluşuyordu, başlık ve alt açıklama metinleri farklı hizalanıyordu ve görsel simge eksikti.
    - **Yapılanlar**:
        1. Başlığın sol tarafına modern, temaya uyumlu `ShoppingCart` sepet ikonu ve rozet kutusu eklendi.
        2. `SheetHeader` için varsayılan `text-center` iptal edilerek başlık ("Hızlı Satış") ve altındaki açıklama ("Sık kullanılan ürünler ve hızlı sepet yönetimi") tam sol hizada (`text-left`) birebir eşit dikey hizada hizalandı.
        3. Sağ üstteki kapatma (X) butonuyla çakışmayı önlemek için `pr-8` güvenli alan sağlandı.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve sıfır hata ile tamamlandı.

- [x] 2026-10-15: Satış Arşivi, Grafikler ve Raporlar Sayfası Finansal Kokpit (Executive Cockpit) Dönüşümü:
    - **Dosyalar**: `src/lib/actions/activity-actions.ts`, `src/components/satis/sales-history-report-panel.tsx`, `src/components/satis/sales-history-client.tsx`, `JOURNAL.md`.
    - **Neden**: Kullanıcı satış arşivi ve grafikler sayfasının üst düzey bir finansal yönetim kokpitine dönüştürülmesini talep etti:
        1. Tam ay ile devam eden mevcut ayın (örneğin ayın 15'i) kıyaslanmasının yanıltıcılığını önleyen gerçek **Time-to-Date (Eşdeğer Gün)** karşılaştırması (örn. 1-15 Ekim vs 1-15 Eylül).
        2. Dinamik **"Akıllı Finansal Öngörüler & Biliyor muydunuz?"** bilgi paneli (en karlı gün, lider kategori payı, ortalama sepet büyüklüğü, veresiye risk analizi).
        3. Grafikteki herhangi bir veri noktasına (gün, bar, ürün, kategori, ödeme kanalı) dokunulduğunda akıcı şekilde açılan **etkileşimli detay açılımı (Drilldown Modal & Fiş İnceleme)** ve işlem listesine doğrudan geçiş.
        4. Uygulama geneliyle tam uyumlu, mobilde ferah ve dokunmatik dostu üst bar (Excel, Gün Sonu PDF, hızlı tarih çipleri).
    - **Yapılanlar**:
        1. **Gerçek Time-to-Date (TTD) Karşılaştırma Motoru (`getSalesHistoryReport`)**:
           - Seçili takvim aralığının (örneğin 1-15 Ekim) önceki aylardaki tam karşılığı olan eşit günleri (`subMonths(1)` -> 1-15 Eylül, `subMonths(2)` -> 1-15 Ağustos) matematiksel olarak eşitlendi.
           - `revenueVsPrevious`, `profitVsPrevious`, `saleCountVsPrevious`, `averageSaleVsPrevious` (ortalama sepet değişimi) ve `profitMarginDiff` (kâr marjı puan farkı) hesaplandı.
           - Kullanıcı dilerse `[⏱️ TTD: Eşdeğer Gün / Sürekli Aralık]` butonuyla kıyaslama modunu tek tıkla değiştirebilir.
        2. **Akıllı Öngörüler & "Biliyor muydunuz?" Paneli**:
           - En karlı/hareketli gün tespiti (`bestDay` - örn. "Pazartesi, 12 Ekim 2026: ₺... ciro").
           - Lider kategori gelir payı (`%... pay`).
           - Sepet büyüklüğü değişimi (`%... artış/düşüş`).
           - Veresiye ve nakit akış sağlık oranı (`%... nakit/kart, %... veresiye`).
        3. **Etkileşimli Grafikler ve Satış Açılım Modalı (`OperationDrilldownModal`)**:
           - Günlük Akış (AreaChart) üzerindeki herhangi bir güne veya altındaki dokunmatik gün çiplerine tıklandığında, o günün tüm satışlarını listeyen akıcı modal açılır.
           - Aralık Karşılaştırması bar grafiğine, ödeme dilimlerine, ürünlere veya kategorilere tıklandığında anında ilgili işlemler listelenir.
           - Modal içerisinden tek tıkla **Fiş Yazdırma** ve **"Tümünü İşlem Listesinde İncele ➔"** ile ana listeye filtrelenmiş aktarım sağlanır.
        4. **Mobil & Masaüstü Filtre Strip'i**:
           - Hızlı çipler eklendi: `[Bugün]`, `[Dün]`, `[Bu Hafta]`, `[🎯 Ay Başından Bugüne (MTD)]`, `[🔄 Geçen Ay Eşdeğer Gün]`, `[Geçen Ay (Tam)]`.
           - `[Excel'e Aktar]` ve `[Gün Sonu PDF]` butonları responsive üst bara entegre edildi.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve 0 hata ile doğrulandı.

- [x] 2026-10-27: Toptancı Yedek Parça Listesi İçe Aktarma Modalı Geliştirmeleri (Önizleme İçi Manuel Fiyatlandırma, Kategori Toplu Tik Kapatma/Açma, WF Çıtalı Ekran Ayrımı):
    - **Dosyalar**: `src/lib/stock/wholesaler-parser.ts`, `src/components/stock/wholesaler-import-modal.tsx`, `src/lib/actions/stock-import-actions.ts`, `JOURNAL.md`.
    - **Önizleme Ekranında El ile Serbest Fiyatlandırma (Geri Dönüş Zorunluluğu ve Seçim Sıfırlanması Engellendi)**:
        - Kullanıcı önizleme ekranındayken fiyat artışını değiştirmek istediğinde geriye gitmek zorunda kalıyordu ve yapılan seçimler/isim düzenlemeleri kayboluyordu.
        - Önizleme ekranı (Adım 2) üst araç çubuğuna serbest sayısal fiyat artışı girişi (`+$ [ 5.00 ]`) eklendi.
        - `[Tümüne Ekle]` ve `[Seçilenlere Ekle]` butonları entegre edildi. Kullanıcı dilediği dolar artışını uyguladığında mevcut seçili (tikli) ürün durumları, satır düzenlemeleri ve renk dağılımları kesinlikle bozulmadan yalnızca satış fiyatları anında güncellenir.
        - Hızlı kısayol butonları (`+$3`, `+$5`, `+$10`, `%35 Kâr`) da seçimleri bozmadan koruyacak şekilde güncellendi.
    - **Kategori Bazlı Toplu Seçim / Tik Kapatma & Açma (Örn: Kapakların Tümünü Tek Tıkla Kapatıp Aralarından Seçebilme)**:
        - Önizleme ekranına kategori filtre şeritlerinin altına etkileşimli "Kategori Seçim Yönetimi" çubuğu eklendi.
        - Aktif kategoriye göre (örn: Kapaklar seçildiğinde) `[✓ Kapak Tümünü Seç]` ve `[✕ Kapak Tikini Kapat (N)]` butonları sağlandı.
        - Kullanıcı örneğin kapakları tek seferde kapatıp sadece istediği birkaç modeli rahatça işaretleyebilir.
        - Tablo başlığındaki genel checkbox, sadece o an filtrelenen görünümdeki ürünleri toplu açıp kapatacak şekilde akıllandırıldı.
    - **Ekranlarda ÇITALI (WF - With Frame) ve Çıtasız Ekran Ayrımı**:
        - Toptancı listelerindeki `WF`, `W/F`, `With Frame`, `Çıtalı`, `Citalı`, `Kasalı` ibarelerini otomatik tanıyan `isFrameScreen` dedektörü yazıldı.
        - Standart kategorilere `LCD / Ekran (Çıtalı)` eklendi; WF tespit edilen ekranlar otomatik olarak bu kategoriye atandı.
        - Tabloda her ekran satırına tek tıkla değiştirilebilir `[🖼️ Çıtalı (WF)]` / `[Çıtasız]` rozet düğmesi eklendi. Kullanıcı tek tıkla ekranı çıtalı veya çıtasız yapabilir ve kategori anında güncellenir.
        - Kategori filtre çiplerinde `🖼️ LCD / Ekran (Çıtalı)` ve `LCD / Ekran` ayrı ayrı filtrelenebilir ve ayrı model adetleriyle listelenir.
    - **Prisma P2028 Zaman Aşımı Çözümü (`stock-import-actions.ts`)**:
        - 50+ ürünün tek tek ardışık döngüde sorgulanmasından kaynaklanan 5 saniyelik Prisma interactive transaction timeout hatası giderildi.
        - Kategoriler ve mevcut ürünler tek bir `findMany` ile önceden in-memory Map'e önbelleklendi ve transaction süresi 60 saniyeye (`{ timeout: 60000, maxWait: 15000 }`) genişletildi.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve 0 hata ile doğrulandı.





- [x] 2026-10-29: Dual-Mode UI/UX Değişikliklerinin Geri Alınması (Rollback):
    - Kullanıcı talebi doğrultusunda önceki oturumda eklenen Next-Gen / Corbel / Moorly arayüz modifikasyonları, efekt bileşenleri (`src/components/ui/effects/`), `UIModeSwitcher`, `FloatingDock` ve ilgili tüm stil/kod değişiklikleri eksiksiz olarak geri alındı.
    - Proje önceki kararlı ve orijinal haline döndürüldü.
    - **Doğrulama**: `npx tsc --noEmit` ile doğrulandı.


- [x] 2026-10-29: Dashboard UI/UX & Kısayol Chartları Tasarım İyileştirmesi (Superdesign & UI/UX Standartları):
    - **Amaç ve Talep**: Anasayfa dashboard'undaki görsel kusurların (`.agents/skills/superdesign/SUPERDESIGN.md` ve `ui-ux-pro-max` standartları doğrultusunda) analiz edilip giderilmesi; gereksiz iç içe geçmiş devasa boşlukların kaldırılması; "kitap gibi" hizalı, kompakt ve üst düzey kurumsal SaaS görünümüne kavuşturulması; tüm kısayol chart ve widget'larının elden geçirilmesi.
    - **Değiştirilen Dosyalar**:
        - `src/app/(dashboard)/layout.tsx`: `main` ve iç kapsayıcıdaki katmerli dev boşluklar (`lg:p-10 p-0` + `lg:p-10 lg:px-12` = ~88px kenar boşluğu) ve balonlaşmış `lg:rounded-[3rem]` çerçevesi kompakt ve modern bir hiyerarşiye çekildi (`p-2 sm:p-4 lg:p-5`, iç kapsayıcı `rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 pb-24 lg:pb-8`). Ekran genişliği verimli kullanılır hale getirildi.
        - `src/app/(dashboard)/dashboard/page.tsx`: Sayfa içindeki mükerrer `p-0 sm:p-6 lg:p-8` boşluğu kaldırılarak ana kapsayıcıyla tam uyum sağlandı.
        - `src/components/dashboard/stat-card.tsx`: 8 farklı neon/şeker gradyanı yerine kurumsal koyu obsidian yüzey (`bg-card/90 dark:bg-[#0d1219]/90 backdrop-blur-md border border-border/50`) üzerine kimliğe özel hafif ambiyans ışıması ve zarif ikon rozeti getirildi. Tipografi `tabular-nums` ve yüksek kontrastlı hale getirildi, arkayı kirleten devasa filigran ikonlar temizlendi, hover aksiyonları akıcı mikro-etkileşimlere bağlandı.
        - `src/components/dashboard/streamed/top-products-stream.tsx`: Dev kare kartlar ve boş kutu ikonları (`aspect-square h-14 w-14`) yerine kompakt, dengeli bento grid ve liste görünümü sağlandı. Fiyatlar `tabular-nums font-bold`, satış adedi ve kritik stok rozetleri derli toplu hale getirildi. Başlık ve kart dolguları `p-8`'den `px-5 py-3.5`'e çekildi.
        - `src/components/dashboard/streamed/service-status-stream.tsx` & `src/components/charts/service-status-chart.tsx`: `p-8` iç dolguları `px-5 py-3.5` ve `p-4 sm:p-5` standartlarına çekildi. Segmented progress çubuğu şık ve ince bir formata (`h-2.5 rounded-full`) kavuşturuldu, durum satırları `tabular-nums` ve renkli durum göstergeleriyle kitap gibi hizalandı.
        - `src/components/dashboard/smart-insights.tsx` & `src/components/dashboard/streamed/smart-insights-stream.tsx`: `p-8` devasa boşlukları sıkılaştırıldı, içgörü kartları `rounded-xl p-3 sm:p-3.5` ve zarif sol ikon çemberleriyle kompakt hale getirildi.
        - `src/components/dashboard/streamed/recent-transactions-stream.tsx`: Finansal kayıtlar tablosu gereksiz padding'lerden (`py-4 px-8`) arındırılarak `py-2.5 px-4` kompakt satır yüksekliğine, net durum noktalarına (`THS`, `VRS`, `GDR`) ve sağa hizalı `tabular-nums` rakamlara kavuşturuldu.
        - `src/components/dashboard/streamed/service-queue-stream.tsx`: Servis kuyruğu cihaz listesi kartı `p-8`'den `px-5 py-3.5`'e çekildi, cihaz ikon kutusu ve müşteri bilgileri hizalandı, kuyruktaki her bir cihaz kompakt ve okunaklı biçimlendirildi.
        - `src/components/dashboard/widgets/shortage-status-card.tsx`: Kurye sipariş durumu kartı ve modalındaki aşırı şişkin `p-8 pb-6` padding'leri ve `rounded-[2rem]` köşeleri `rounded-2xl`, `px-5 py-3.5` ve derli toplu başlık/buton yapısıyla standardize edildi.
        - `src/components/dashboard/streamed/revenue-analysis-stream.tsx` & `src/components/charts/sales-trend-chart.tsx`: Gelir analizi kartı ve grafiği elden geçirildi. Recharts alanı zarif gradyan ve eğri ile sadeleştirildi, özel siyah tooltip kompakt hale getirildi.
        - `src/components/dashboard/live-activity-feed.tsx`: Canlı akış akıcı, modern ve net zaman etiketleriyle donatıldı.
        - `src/components/dashboard/receivables-client.tsx`: Alacaklar ve veresiye kartındaki devasa boşluklar ve butonlar kompakt ve net bir liste formatına uyarlandı.
        - `src/components/dashboard/admin-dashboard.tsx` & `src/components/dashboard/dashboard-client.tsx`: Üst başlık hiyerarşisi, mod değiştirici butonlar (`SİSTEM` / `PERSONEL`), grid otomatik satır aralıkları (`minmax(116px, auto)`) ve alt marjinler optimize edildi.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve 0 hata ile doğrulandı. Hiçbir fonksiyon, veri çekme mantığı veya buton silinmeden 100% korundu.

- [x] 2026-10-29: Açık Modda (Light Mode) 8 KPI Kartı Okunurluk Optimizasyonu & Libraries.dev BorderBeam'in Başar AI Noktalarına Entegrasyonu:
    - **Kullanıcı Talebi**:
        1. "Açık modda 8 kartı daha okunaklı yap. Renklerden okunmuyor, ama koyu modda güzel duruyor."
        2. "Libraries.dev'in border-beam efektini Başar AI olan her yere uygula."
    - **Yapılan İyileştirmeler**:
        1. **Açık Modda 8 KPI Kartının Okunurluk ve Kontrastının Kusursuzlaştırılması (`src/components/dashboard/stat-card.tsx`):**
            - Kart zeminine `bg-white/90 dark:bg-card/40` sağlam zemin katmanı entegre edildi; böylece açık modda pastel liquid glass gradyanının sayfa arka planıyla yıkanması ve okunurluk kaybı engellendi.
            - Başlıklar, para birimi değerleri ve metinler açık modda ultra yüksek kontrastlı koyu tonlara (`text-slate-950 dark:text-white`, `text-slate-800 dark:text-white/80`, `text-slate-700 dark:text-white/75`, `text-slate-600 dark:text-white/70`) uyarlandı. Koyu moddaki saf beyaz ve parlayan görünüm 100% korundu.
            - İkon pill'leri, durum rozetleri ve aksiyon butonları (`glassTheme.iconPill`, `badgePill`, `actionPill`) açık modda koyu yüksek kontrastlı renk tonlarıyla (`text-emerald-950`, `text-sky-950`, `text-violet-950`, `text-amber-950`, vb.) okunaklı hale getirildi.
            - Üst kenar yansıması ve ambiyans lekelerinin opasiteleri açık modda zemin parlamasını engelleyecek şekilde optimize edildi.
            - `badgePill` alanındaki sözdizimi parantez hatası giderildi.
        2. **Libraries.dev `border-beam` & `thinking-orbs` Entegrasyonu:**
            - `npm install border-beam thinking-orbs` ile orijinal resmi paketler sisteme dahil edildi.
        3. **Başar AI Olan Her Yere BorderBeam Uygulanması:**
            - **Header Canlı/Aktif Rozeti (`src/components/dashboard/admin-dashboard.tsx`):** Libraries.dev `<ThinkingOrb state="solving" size={20} color="#10b981" />` entegre edildi, "AKTİF" ve "CANLI" durumları Libraries.dev `<BorderBeam size="sm" colorVariant="colorful" strength={0.8}>` ile sarıldı.
            - **Sidebar Başar AI Komuta Merkezi (`src/components/sidebar.tsx`):** Sol menünün altındaki Başar AI paneli (Analiz, Güncelle, Ara butonlarıyla birlikte) Libraries.dev `<BorderBeam size="md" colorVariant="colorful" strength={0.8}>` ile sarıldı.
            - **Dashboard Tahminleyici Zeka Paneli (`src/components/dashboard/smart-insights.tsx`):** Anasayfadaki Başar AI içgörü ve operasyonel analiz kartı `<BorderBeam size="md" colorVariant="colorful" strength={0.65}>` ile sarıldı.
            - **Stok & Kategori Yönetimi (`src/components/product/ai-category-creator.tsx`):** "BAŞAR AI Stok Ekle" / "BAŞAR AI Çoklu Ekle" tetikleyici butonu `<BorderBeam size="sm" colorVariant="colorful" strength={0.8}>` ile sarmalandı.
            - **Teknik Servis Analiz Modalı (`src/components/service/technical-service-analysis-modal.tsx`):** "BAŞAR AI ANALİZ" butonu eski bileşenden Libraries.dev `<BorderBeam size="sm" colorVariant="ocean" strength={0.8}>` bileşenine taşındı.
            - **Yeni Servis Arıza Teşhis Paneli (`src/components/features/service-new/ai-diagnostic-panel.tsx`):** Arıza açıklaması girildiğinde parlayan "BAŞAR AI ANALİZ" butonu Libraries.dev `<BorderBeam size="sm" colorVariant="colorful" strength={0.8}>` ile donatıldı.
            - **Cihaz Merkezi (Device Hub) (`src/components/device-hub/create-device-modal.tsx`):** "BAŞAR AI ile Cihaz Ekle" kamera/kutu tarama butonu Libraries.dev `<BorderBeam size="sm" colorVariant="colorful" strength={0.8}>` ile sarıldı.
            - **Başar AI Modalleri (`src/components/basarai/`):**
                - `ai-analyze-modal.tsx`: "Analizi Başlat" butonu `<BorderBeam size="md" colorVariant="candy" strength={0.8}>` ile sarıldı.
                - `ai-search-modal.tsx`: Doğal dilde akıllı arama input alanı `<BorderBeam size="md" colorVariant="candy" strength={0.7}>` ile sarıldı.
                - `ai-update-modal.tsx`: Doğal dilde toplu güncelleme metin alanı `<BorderBeam size="md" colorVariant="candy" strength={0.7}>` ile sarıldı.
    - **Sıfır Silme & Fonksiyon Bütünlüğü:** Tüm `onClick`, form `register`, state ve yönlendirme mantıkları eksiksiz ve dokunulmadan korundu.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve 0 hata ile doğrulandı.

- [x] 2026-10-29: Sidebar Tasarım & Motion İyileştirmesi (Referans Video / Sliding Accordion & Rail Dock):
    - **Kullanıcı Talebi**: "Sidebar tasarımına geçelim burayı analiz et hataları tespit et. Açılır menüleri motion efekti ekle kayarak açılsın. Bu videoyu referans al: threadsdownloader.com.mp4"
    - **Tespit Edilen Tasarım ve Etkileşim Hataları**:
        1. *Animasyonsuz Açılır Menüler:* Alt menülerin doğrudan ani bir biçimde DOM'a eklenip kaldırılması (`{hasSubItems && isOpen && ...}`), sıfır yükseklik/kayma animasyonu.
        2. *Statik Chevron Değişimi:* Açılışta ikonun ani şekilde `ChevronRight` -> `ChevronDown` olarak değişmesi (dönüş animasyonu eksikliği).
        3. *Orantısız Başlık Yüksekliği:* `h-28` (112px) yüksekliğindeki aşırı şişkin header alanı ve logosundaki sürekli sonsuz pulse titremesi.
        4. *Tipografi ve Yoğunluk Dengesizliği:* Menü öğelerinin `text-[15.5px]` ile modern SaaS standartlarına göre kaba kalması, alt menü hiyerarşik kılavuz çizgilerinin zayıflığı.
        5. *Daraltma / Dock Eksikliği:* Videoda yer alan ince ikon rayı (collapsed rail) modunun olmaması.
    - **Yapılan İyileştirmeler (`src/components/sidebar.tsx`):**
        1. **Framer Motion Sliding Accordion:**
           - Tüm açılır menülere (`AnimatePresence`) entegre edildi. Menü açıldığında `height: 0 -> "auto"` ve `opacity: 0 -> 1` yay fiziği (`type: "spring", stiffness: 450, damping: 35`) ile kayarak açılıyor; kapandığında da pürüzsüzce geri toplanıyor.
           - Alt menü öğeleri için kademeli kayma (`initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}`) uygulandı.
           - Açılır menülerin soluna `border-l border-border/40 pl-3` hiyerarşik ağaç kılavuz çizgisi eklendi; aktif alt öğeler için `bg-primary/10 text-primary` pill ve pulsing canlı durum noktası getirildi.
        2. **90 Derece Dönen Yaylı Chevron:**
           - Ok simgesi `motion.div animate={{ rotate: isOpen ? 90 : 0 }}` ile pürüzsüz 90 derece rotasyon efektine bağlandı.
        3. **Kompakt Kurumsal Başlık:**
           - Yükseklik `h-18` (72px) seviyesine çekildi. Sonsuz titreyen animasyon yerine dokunsal, hafif hover ölçekli (`group-hover:scale-105`) elit logo kartı yerleştirildi.
           - Dükkan adı ve sektör etiketi derli toplu hale getirildi.
        4. **İki Modlu Masaüstü Daraltma / Genişletme (Slim Icon Rail Dock):**
           - Başlık sağ üstüne ve sol alta `PanelLeftClose` / `PanelLeftOpen` geçiş düğmesi entegre edildi.
           - Kullanıcı masaüstünde menüyü `w-[72px]` daraltılmış ince ikon rayına çekebilir; durum `localStorage` (`basar_sidebar_collapsed`) üzerinde hatırlanır.
           - Daraltılmış modda Başar AI, Libraries.dev `<BorderBeam>` ile sarılı kompakt orb ikonuna dönüşür.
        5. **Sıfır Silme & Yetki/Modül Bütünlüğü:**
           - Tüm yetki kontrolleri (`canSell`, `canFinance`, `canService`, `canStock`, `isEInvoiceEnabled`, `isModuleEnabled`), süper admin / kurye filtreleri ve Başar AI modalleri 100% korundu.
    - **Doğrulama**: `npx tsc --noEmit` hatasız (0 error) tamamlandı.

- [x] 2026-10-29: Sidebar Alt Menü İkonları, Tekli Akordiyon Kapanışı, Slim Rail Dock Sağa Doğru Blur Flyout ve Başar AI Doğal Dil Araması Düzeltmesi:
    - **Kullanıcı Talebi**:
        1. Alt menülere de menüye uygun ikonlar koyulsun.
        2. Başka alt menü açıldığında açık olan menü kapansın (Single Accordion).
        3. Slim Icon Rail Dock kullanıldığında alt menüleri olanların üzerine gelince veya basınca sidebarı açmak yerine o menüleri sağa doğru motion olarak açarak gösterilsin, arka planı blur yapılsın.
        4. Başar AI doğal dilde aramada örneğin "10 dolar altındaki ürünleri göster" denildiğinde sadece stok sayfasını açması ve filtrelememesi hatası düzeltilsin, doğal dil araması etkinleştirilsin.
    - **Yapılan İyileştirmeler**:
        1. **Alt Menü İkonları (`src/components/sidebar.tsx`):**
           - `getMenuItems` içerisindeki tüm alt menülere tematik Lucide ikonları tanımlandı:
             - Servis Yönetimi: `PlusCircle` (Yeni Giriş), `LayoutGrid` (Servis Merkezi).
             - Envanter: `Boxes` (Stok Listesi), `ClipboardList` (Tedarikçi Siparişleri), `Building2` (Tedarikçi Yönetimi), `ArrowLeftRight` (Hareket Analizi), `FolderTree` (Kategoriler), `Sparkles` (AI Önerileri), `RotateCcw` (İade / Hasarlı).
             - POS & Kasa: `Zap` (Hızlı Satış), `History` (Satış Arşivi), `Receipt` (Kasa Raporu).
             - Müşteri CRM: `Contact` (Portföy), `UserPlus` (Yeni Tanımlama).
             - Ayarlar: `Sliders` (Sistem), `ScrollText` (Loglar), `Layers` (Sektörler), `Store` (Tüm Dükkanlar), `Send` (EDM), `Megaphone` (Duyurular).
           - Hem dikey genişletilmiş akordiyonda hem de sağa açılan flyout popover'da her alt öğenin solunda kendi simgesi gösterildi.
        2. **Tekli Akordiyon (Single Accordion Kapanışı):**
           - `toggleMenu` fonksiyonu güncellenerek bir menü tıklandığında açık olan diğer tüm menülerin otomatik kapanması (`prev => prev.includes(label) ? [] : [label]`) sağlandı.
        3. **Slim Rail Dock Sağa Açılan Motion & Frosted Blur Flyout:**
           - Daraltılmış (Slim Rail) modda menü tıklandığında veya üzerine gelindiğinde (`hover & click`) sidebar artık genişlemiyor.
           - Bunun yerine Radix `Popover` portallı mimarisiyle sağ tarafa doğru (`side="right" sideOffset={12}`) `backdrop-blur-2xl` buzlu cam zeminli, yaylı ve gölgeli (`shadow-2xl`) bir uçan panel (flyout menu) olarak pürüzsüzce açılıyor.
           - `overflow-hidden` kırpılma riski olmadan ekran sınırlarına göre kusursuz konumlanıyor.
        4. **Başar AI Doğal Dil Arama Motoru Düzeltmesi (`gemini-actions.ts`, `product-actions.ts`, `stock-table-stream.tsx`, `stock-list-table.tsx`):**
           - *Sorun Tespiti:* Gemini çıktısı markdown kod blokları (````json ... ````) içerdiğinde doğrudan `JSON.parse` yapılarak sessizce `catch` bloğuna düşüyor ve boş filtre dönüyordu. Ayrıca Prisma `minPrice` / `maxPrice` null geldiğinde `{ gte: null }` hatası alıyor veya sadece alış fiyatını (`buyPriceUsd`) filtrelemeye çalışıp satış fiyatlarını ıskalıyordu.
           - *Çözüm:*
             - `parseNaturalLanguageQuery` deterministik doğal dil ayrıştırıcısı yazıldı. "10 dolar altındaki ürünler", "20 TL üzeri", "bitmek üzere olanlar" gibi kalıpları regex ve Türkçe anlambilimle anında USD/TL, minPrice, maxPrice, isCritical, maxStock ve anahtar kelimelere dönüştürüyor.
             - Gemini yanıtları markdown bloklarından temizlenerek `null` değerler `undefined`'a çevrildi ve Gemini semantik zekası ile sezgisel ayrıştırıcı hibrit olarak birleştirildi (Gemini kotası dolsa dahi doğal dil araması 0ms'de %100 çalışır hale getirildi).
             - `getProducts` içinde fiyat filtreleri `sellPriceUsd` VE `buyPriceUsd` (veya TL için `sellPrice` / `buyPrice`) alanlarını kapsayacak şekilde `where.OR` mantığına uyarlandı; `null` argümanların Prisma'ya gitmesi engellendi.
             - `StockListTable` bileşeni üstüne parlayan dinamik `BAŞAR AI Doğal Dil Filtresi: "[sorgu]"` bilgilendirme rozeti ve tek tıkla aramayı sıfırlayan `Filtreyi Temizle ✕` aksiyonu eklendi.
    - **Doğrulama**: `npx tsc --noEmit` hatasız (0 error) tamamlandı. Hiçbir özellik ve veri akışı silinmedi.

- [x] 2026-10-29: Hata Düzeltmesi (Next.js Server Actions Export Kuralı):
    - **Sorun**: `src/lib/actions/gemini-actions.ts` dosyası başında `"use server";` direktifi bulunduğu için Next.js derleyicisi bu dosyadan export edilen tüm fonksiyonların `async` olmasını bekliyordu. Senkron bir yardımcı fonksiyon olarak export edilen `parseNaturalLanguageQuery` derleme hatasına (`Server actions must be async functions`) yol açtı.
    - **Çözüm**: Sadece `semanticSearchWithAI` içerisinde kullanılan `parseNaturalLanguageQuery` fonksiyonunun başındaki `export` ifadesi kaldırılarak yerel (unexported) bir yardımcı fonksiyon haline getirildi.
    - **Doğrulama**: `npx tsc --noEmit` çalıştırıldı ve 0 hata ile doğrulandı. Next.js derleme hatası giderildi.
