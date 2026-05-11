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
- [ ] Ozellik 2: Kurye Is Yukleme ve Rota Onceliklendirme
  - Graphify baglamlari: Community 38 (`getStaff`, staff performance), Community 49 (`GroupedShortage`, shortage status), Community 9 (`assignShortageToCourier`, courier tasks).
  - Amac: Kurye gorevlerini personel yogunlugu, aciliyet, musteri/tedarikci bekleme suresi ve stok etkisine gore siralamak.
- [ ] Ozellik 3: Finansal Risk ve Nakit Akisi Erken Uyari Paneli
  - Graphify baglamlari: Community 18 (`getCashflowReport`, accounts, transactions), Community 43 (`sales/service metrics`), Community 44-45 (`Receivables`, `Veresiye`).
  - Amac: Geciken alacaklar, kasa acilis/kapanis farklari, tedarikci bakiyeleri ve yaklasan odemeleri tek risk panelinde gostermek.

## Degisiklik Gunlugu

- [x] 2026-05-12: `JOURNAL.md` eklendi. Neden: Kullanici tarafindan istenen surekli is protokolunu baslatmak ve proje durumunu kalici olarak kaydetmek.
