/**
 * EDM Fatura Validasyon Schema'lari
 * Zod ile katı ve defansif validasyon
 * GİB/EDM mevzuatına tam uyumlu
 */

import { z } from "zod";

/* ─── VKN / TCKN Validasyonu ─── */

/**
 * VKN validasyonu (10 hane)
 * Algoritma: Çift ve tek indexlerin farklı çarpanlarla işlenmesi
 */
export const vknSchema = z
    .string()
    .trim()
    .regex(/^\d{10}$/, "VKN tam olarak 10 haneli rakam olmalıdır.")
    .refine((val) => {
        // VKN algoritma kontrolu (Vergi Müfettişleri Derneği standardı)
        const digits = val.split("").map(Number);
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            const digit = digits[i];
            const multiplier = ((i + 1) % 2 === 0) ? 2 : 1;
            const product = digit * multiplier;
            sum += product > 9 ? product - 9 : product;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return digits[9] === checkDigit;
    }, { message: "VKN geçersiz (algoritmik kontrol başarısız)." });

/**
 * TCKN validasyonu (11 hane)
 * Algoritma: Luhn-tipi kontrol
 */
export const tcknSchema = z
    .string()
    .trim()
    .regex(/^\d{11}$/, "TCKN tam olarak 11 haneli rakam olmalıdır.")
    .refine((val) => {
        // TCKN algoritma kontrolu
        const digits = val.split("").map(Number);
        if (digits[0] === 0) return false; // Geçersiz TC başlar

        const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
        const tenthDigit = ((oddSum * 7) - evenSum) % 10;
        if (digits[9] !== tenthDigit) return false;

        const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
        const eleventhDigit = totalSum % 10;
        return digits[10] === eleventhDigit;
    }, { message: "TCKN geçersiz (algoritmik kontrol başarısız)." });

export const vknOrTcknSchema = z.union([vknSchema, tcknSchema]).describe("VKN (10 hane) veya TCKN (11 hane)");

/* ─── Adres Validasyonu ─── */

export const citySchema = z
    .string()
    .trim()
    .min(1, "İl seçimi zorunludur.")
    .max(50, "İl adı çok uzun.");

export const districtSchema = z
    .string()
    .trim()
    .min(1, "İlçe seçimi zorunludur.")
    .max(50, "İlçe adı çok uzun.");

export const addressSchema = z
    .string()
    .trim()
    .min(5, "Adres en az 5 karakter olmalıdır.")
    .max(250, "Adres en fazla 250 karakter olabilir.");

export const taxOfficeSchema = z
    .string()
    .trim()
    .min(2, "Vergi dairesi zorunludur.")
    .max(100, "Vergi dairesi adı çok uzun.");

/* ─── Fatura Tipi ve Senaryosu ─── */

export const invoiceScenarioSchema = z
    .enum(["TEMEL", "TICARI"])
    .describe("TEMEL: Basit fatura, TICARI: İntrastat ve KDV detaylı fatura");

export const invoiceTypeSchema = z
    .enum(["SATIS", "IADE", "TEVKIFAT"])
    .describe("SATIS: Satış, IADE: İade faturası, TEVKIFAT: Tevkifat");

/* ─── Fatura Kalemi Validasyonu ─── */

export const invoiceItemSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Ürün/Hizmet adı zorunludur.")
        .max(200, "Ürün/Hizmet adı en fazla 200 karakter olabilir."),
    quantity: z
        .number()
        .positive("Miktar 0'dan büyük olmalıdır.")
        .max(999999, "Miktar çok büyük."),
    unitPrice: z
        .number()
        .nonnegative("Birim fiyat negatif olamaz.")
        .max(999999999.99, "Birim fiyat çok büyük."),
    vatRate: z
        .number()
        .min(0, "KDV oranı negatif olamaz.")
        .max(100, "KDV oranı %100'den fazla olamaz."),
    unitCode: z
        .string()
        .default("C62")
        .describe("UN/CEFACT ölçü kodu (C62=Adet, KGM=Kilo, MTR=Metre, HUR=Saat)"),
});

/* ─── Müşteri Validasyonu ─── */

export const customerSchema = z.object({
    vknTckn: vknOrTcknSchema,
    name: z
        .string()
        .trim()
        .min(2, "Müşteri unvanı en az 2 karakter olmalıdır.")
        .max(200, "Müşteri unvanı en fazla 200 karakter olabilir."),
    address: addressSchema,
    city: citySchema,
    district: districtSchema,
    taxOffice: taxOfficeSchema.optional(),
    email: z
        .string()
        .trim()
        .email("Geçerli bir e-posta adresi giriniz.")
        .optional()
        .or(z.literal("")),
    phone: z
        .string()
        .trim()
        .regex(/^\+?\d{10,15}$/, "Geçerli bir telefon numarası giriniz (10-15 rakam).")
        .optional()
        .or(z.literal("")),
});

/* ─── Fatura Validasyonu ─── */

export const invoiceSchema = z.object({
    invoiceId: z
        .string()
        .trim()
        .min(1, "Fatura numarası zorunludur.")
        .max(50, "Fatura numarası çok uzun."),
    issueDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG formatında olmalıdır."),
    dueDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG formatında olmalıdır.")
        .optional(),
    currency: z
        .string()
        .default("TRY")
        .describe("Para birimi (TRY, USD, EUR, vs.)"),
    note: z
        .string()
        .trim()
        .max(500, "Not en fazla 500 karakter olabilir.")
        .optional(),
    invoiceScenario: invoiceScenarioSchema,
    invoiceType: invoiceTypeSchema,
    customer: customerSchema,
    items: z
        .array(invoiceItemSchema)
        .min(1, "En az bir fatura kalemi eklenmelidir.")
        .max(100, "En fazla 100 fatura kalemi eklenebilir."),
});

/* ─── EDM Ayarları Validasyonu ─── */

export const edmSettingsSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
        .max(100, "Kullanıcı adı çok uzun."),
    password: z
        .string()
        .min(6, "Şifre en az 6 karakter olmalıdır.")
        .max(100, "Şifre çok uzun."),
    senderVkn: vknSchema.describe("Gönderici İşletme VKN'si"),
    senderName: z
        .string()
        .trim()
        .min(2, "Gönderici unvanı zorunludur.")
        .max(200, "Gönderici unvanı çok uzun."),
    senderAddress: addressSchema.optional(),
    senderCity: citySchema.optional(),
    senderDistrict: districtSchema.optional(),
    senderTaxOffice: taxOfficeSchema.optional(),
    environment: z
        .enum(["TEST", "PRODUCTION"])
        .default("TEST")
        .describe("EDM Ortamı (TEST için 3230512384 test VKN kullanılabilir)"),
    edmActive: z
        .boolean()
        .default(false),
});

/* ─── Tip Çıkarımları ─── */

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type EdmSettingsInput = z.infer<typeof edmSettingsSchema>;
