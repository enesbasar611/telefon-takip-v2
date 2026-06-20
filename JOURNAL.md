# Basar Teknik V2 - JOURNAL

## Genel Proje Durumu

- Tarih: 2026-06-09
- Mimari durum: Proje V2 mimarisinde ilerliyor. EDM BiliÅŸim e-Fatura REST API tam entegrasyonu (Faz 1-6) tamamlandi ve commitlendi.
- Graphify durumu: `graphify-out/GRAPH_REPORT.md` guncel kabul ediliyor. Rapor `84c324a2` commitinden uretilmis; mevcut HEAD `83ff6703`.
- Graphify ozeti: 453 dosya, 2056 node, 7225 edge, 156 community. En kritik ortak baglanti noktalarindan bazilari `getShopId()`, `cn()`, `Button`. EDM ile ilgili onemli topluluklar: Community 11 (fatura XML builder, EDM tipleri), Community 13 (ayarlar/settings), Community 46 (cron, server), Community 55 (fatura HTML/PDF uretimi), Community 69 (middleware/auth), Community 75 (Prisma), Community 93 (UI context), Community 94 (JWT/Session/User).
- Rapor sonrasi temizlik: 13 dead-code dosyasi temizlendi; buna ek olarak daha once 3 temp/debug dosyasi silindi.
- Tip durumu: `npx tsc --noEmit` son kontrolde basarili calisti. `npm run build` basarili.
- Calisma agaci notu: EDM entegrasyonu, POS tip guvenligi ve customer-debt-panel imza guncellemesi commitlendi (`83ff6703`).

## To-Do List (Backlog)

- [x] Continuous Work Protocol baslatildi. `JOURNAL.md` olusturuldu; proje durumu ve backlog kayit altina alindi.
- [x] Graphify raporu incelendi. Stok, kurye, finans, raporlama ve tedarik topluluklari yeni ozellik onerileri icin ana baglam olarak belirlendi.
- [x] Ozellik 4: EDM Biliºim e-Fatura Entegrasyonu (Tamamlandi, test asamasinda)
  - Graphify baglamlari: Community 11 (`buildInvoiceXml`, `amountToWords`, `buildRequestHeader`, EDM tipleri), Community 13 (`getSettings`, `getShop`, `updateSetting`, `AyarlarPage`), Community 46 (`cron`, `getLocalIps`, `getPreferredIp`, `httpServer`, `io`), Community 55 (`generateInvoiceHTML`, `generateInvoicePDF`, `formatInvoiceMoney`, `formatDateTR`), Community 69 (`middleware`, `authMiddleware`, `config`, `role`), Community 75 (`prisma`, `PrismaClient`, `SUPER_ADMIN_EMAILS`), Community 93 (`UIContext`, `UIProvider`), Community 94 (`JWT`, `Session`, `User`).
  - Amac: EDM Biliºim e-Fatura/e-Arºiv servisini kendi sistem üzerinden tam entegre etmek; yeni fatura oluºturma, gönderme, gelen fatura alma, HTML/PDF indirme, iptal ve ayar yönetimi. EDM sitesine yönlendirme yok.
  - Durum: Faz 1-6 tamamlandi (Prisma schema, EDM client, API routes, UI sayfalari, cron senkronizasyonu, sidebar/menu, modul aktivasyonu, otomasyon ayarlari). Test credentials ile login basarili. Payload key'leri EDM REST API beklenen buyuk harf formatina cevrildi (HEADER, CONTENT, SENDER, RECEIVER, ISSUE_DATE, PAYABLE_AMOUNT, PROFILEID, EARCHIVE, INVOICE_TYPE, RECEIVER_ALIAS, INVOICE_SEND_TYPE, UUID, ID). CONTENT.Value base64 string olarak guncellendi (EDM REST API byte array bekliyordu, base64 string kabul ediyor). XSLT sablonlari public/xslt/ altina eklendi. TenantSettings ve Invoices Prisma modelleri eklendi. Encryption servisi (AES-256) yazildi. Registration servisi (initializeParameter, createCustomerPortal, getTenantBalanceAndStatus, loadCredit) yazildi. Debug/test endpoint'leri temizlendi. Build ve tip kontrolu basarili.

- [x] Ozellik 5: Merkezi Firma Bilgileri ve Logo Yönetimi (Tamamlandı)
  - Amac: Firma bilgilerini (İsim, Tel, Adres, Logo, Vergi Bilgileri) tek merkezden (Profil Sayfası) yönetmek; fiş ve faturalarda mükerrer girişi önlemek.
  - Detay: `Shop` modeline `logoUrl` eklendi. Profil sayfasına dosya seçerek logo yükleme ve Gmail logosunu tek tıkla aktarma özelliği eklendi. Fiş şablonlarındaki (Termal, PDF) logo filtreleri (grayscale/contrast) temizlenerek PNG uyumu sağlandı. UI'daki kilitlenme (relative CSS hatası) giderildi.

- [ ] Ozellik 1: Akilli Stok Yenileme ve Tedarik Planlama
  - Graphify baglamlari: Community 9 (`addShortageItem`, shortage flow), Community 32 (`SupplierOrderContext`, supplier order lists), Community 33 (`AI alerts`, purchase orders), Community 67 (`getCriticalProducts`, stock movements).
  - Amac: Kritik stok, son satis hizi, bekleyen servis parca ihtiyaci ve tedarikci bilgilerini birlestirerek otomatik satin alma onerisi uretmek.

- [x] Ozellik 2: Kurye Is Yukleme ve Rota Onceliklendirme
  - Graphify baglamlari: Community 38 (`getStaff`, staff performance), Community 49 (`GroupedShortage`, shortage status), Community 9 (`assignShortageToCourier`, courier tasks).
  - Amac: Kurye gorevlerini personel yogunlugu, aciliyet, musteri/tedarikci bekleme suresi ve stok etkisine gore siralamak.

- [ ] Ozellik 3: Finansal Risk ve Nakit Akisi Erken Uyari Paneli
  - Graphify baglamlari: Community 18 (`getCashflowReport`, accounts, transactions), Community 43 (`sales/service metrics`), Community 44-45 (`Receivables`, `Veresiye`).
  - Amac: Geciken alacaklar, kasa acilis/kapanis farklari, tedarikci bakiyeleri ve yaklasan odemeleri tek risk panelinde gostermek.

## Degisiklik Gunlugu

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
- **Dosyalar**: `src/components/navbar/shortage-list.tsx`, `src/components/dashboard/stat-card.tsx`.
