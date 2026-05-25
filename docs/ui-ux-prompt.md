# UI/UX Tasarim ve Gelistirme Promptu

## Konu: /efatura Listeleme Sayfasinin Apple UI Estetiginde ve Urun Detayli Yeniden tasarlanmasi

### Genel tasarim Dili ve Tipografi

- **Açiklama:** Sayfa tamamen Apple'in minimalist, premium, ferah ve net tasarim felsefesine uygun olarak insa edilecektir.
- **Font Ailesi:** Plus Jakarta Sans veya sistemin orijinal sans-serif fontlari kullanilacaktir.
- **Görsel Bütünlük:** Karmasayi önlemek adina tüm yazilarda büyük harf (CAPS LOCK) zorunlamasi kaldirilacak, standart ve okunabilir yazim kurallari (Sentence/Title case) uygulanacaktir.
- **Arka Plan:** Sayfa genel arka plani hafif mat ve premium bir gri olan #F5F5F7 tonlarinda olacaktir.

### Fatura Kartlari (List Item) Düzeni ve Kurallari

#### Border ve Durum Yönetimi
- Basariyla gönderilen faturalarin dis çerçevesi (border) yumusak bir yesil tonunda (#34c759/30 opakliginda) olacaktir.
- Kartin üzerine gelindiginde (hover) bu border tam belirgin hale gelecek ve hafif bir gölge (shadow-sm) eklenecektir.

#### Sol Kisim (Görsel ve Bilgi Hiyerarsisi)
- En basta, arka plani hafif opak yesil olan yumusak köseli bir kare container içinde yesil renkli bir belge ikonuna yer verilecektir.
- Fatura listesinde teknik fatura ID'leri (INV...) veya karmasik kodlar kesinlikle ön planda yer almayacaktir.
- Kartin ana basliginda dogrudan faturayi kestigimiz kisinin adi ve soyadi temiz bir font agirligiyla (font-medium, #1d1d1f) yazacaktir.
- **[YENI ÖZELLIK]** Ilk Kalem Urun Bilgisi: Ismin hemen altinda, faturadaki ilk satirda yer alan ürünün/hizmetin adi (Örn: iPhone 17 Pro Max Ekran Degisimi veya Renault Megane 4 Gizli Özellik Aktivasyonu) hafif belirgin, sik bir gri tonuyla yer alacaktir.
- **Zaman Bilgisi:** Urun bilgisinin hemen yaninda veya bir alt satirinda, daha küçük ve soft bir griyle (#86868b) Tarih ve Saat bilgisi (Örn: 25 Mayis 2026 • 14:32) listelenecektir.

#### Sag Kisim (Tutar ve Aksiyonlar)
- **Tutar Alani:** Basariyla gönderilen faturalarin tutari canli bir Apple yesili (#34c759) renginde ve kalin (semibold) yazilacaktir. Para birimi olarak TRY veya TL yerine kesinlikle ₺ simgesi kullanilacaktir.
- **Premium Buton Grubu:** En sagda, butonlar Apple'in kontrol panellerindeki gibi tek bir açik gri kapsayicinin (#f5f5f7) içinde, kompakt ve yan yana duracaktir.
- Butonlarin üzerine gelindiginde (hover), ilgili butonun arka plani beyaz olacak ve ikon rengi Apple mavisine (#0071e3) dönecektir.
- **Buton Siralamasi (Soldan Saga):**
  1. Göz Ikonu (Fatura detayina gitmek/görüntülemek için)
  2. PDF Metin/Butonu (Basildiginda faturayi yeni sekmede açacak veya direkt PDF/HTML olarak indirecek)
  3. Yazdir (Printer) Ikonu (Dogrudan yazdirma ekranini tetikleyecek)

### Teknik Gereksinimler
- Next.js + React + TypeScript
- Tailwind CSS ile stilendirme
- shadcn/ui komponentleri (Button, Badge, Card)
- Lucide React ikonlari
- DOMPurify ile HTML sanitization
- XSLTProcessor ile fatura önizleme
