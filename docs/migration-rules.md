# Veritabani Migration Kurallari

## Temel Prensip

- **ASLA** `npx prisma db push` kullanma
- **HER ZAMAN** `npx prisma migrate dev` kullan
- Migration dosyalarini versiyonla ve takip et

## Dogru Kullanim

### 1. Schema Degisikligi Yap

`prisma/schema.prisma` dosyasinda degisiklikleri yap.

### 2. Migration Olustur

```bash
npx prisma migrate dev --name <anlamli-isim>
```

Ornek:
```bash
npx prisma migrate dev --name add_xml_xslt_fields
npx prisma migrate dev --name add_earsiv_xslt_column
```

### 3. Migration Dosyalarini Kontrol Et

`prisma/migrations/` klasorunde olusan dosyalari incele:
- `migration.sql` - SQL komutlari
- `migration_lock.toml` - Lock dosyasi

### 4. Production'da Uygula

```bash
npx prisma migrate deploy
```

## Neden `migrate dev`?

| Ozellik | `db push` | `migrate dev` |
|---------|-----------|---------------|
| Migration dosyasi | Yok | Var |
| Versiyon kontrolu | Yok | Var |
| Rollback | Zor | Kolay |
| Takim calismasi | Sorunlu | Duzenli |
| Production | Riskli | Guvenli |

## Hafiza Notu

Kullanici: "bundan sonra npx prisma db push --accept-data-loss bunun yerine sadece migration dev kullanarak migrations aç ve öyle verileri dbye gönder db push görmek istemiyorum."

Tarih: 2026-05-25
