# Basar Teknik V2 - JOURNAL

## Genel Proje Durumu

- Tarih: 2026-05-12
- Mimari durum: Proje V2 mimarisinde ilerliyor.
- Graphify durumu: `graphify-out/GRAPH_REPORT.md` guncel kabul ediliyor. Rapor `3a23f9c2` commitinden uretilmis; mevcut HEAD `3a23f9c29bd663544e2dd83cc072d3ad06c175f9`.
- Graphify ozeti: 421 dosya, 1700 node, 6387 edge, 114 community. En kritik ortak baglanti noktalarindan bazilari `getShopId()`, `serializePrisma()`, `Button`, `cn()`.
- Rapor sonrasi temizlik: 13 dead-code dosyasi temizlendi; buna ek olarak daha once 3 temp/debug dosyasi silindi.
- Tip durumu: `npx tsc --noEmit` son kontrolde basarili calisti.
- Calisma agaci notu: Dead-code silmeleri, Graphify ciktilari ve son tip duzeltmeleri henuz commitlenmemis durumda.

## To-Do List (Backlog)

- [x] Continuous Work Protocol baslatildi. `JOURNAL.md` olusturuldu; proje durumu ve backlog kayit altina alindi.
- [x] Graphify raporu incelendi. Stok, kurye, finans, raporlama ve tedarik topluluklari yeni ozellik onerileri icin ana baglam olarak belirlendi.
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
