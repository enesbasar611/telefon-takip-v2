import * as z from "zod";

// --- Base Types ---
const phoneSchema = z.string()
    .min(1, "Telefon numarası gereklidir")
    .transform(val => val.replace(/\D/g, "").slice(-10))
    .refine((val) => val.length === 10 && val.startsWith("5"), "Geçerli bir numara girin (5xx xxx xxxx)");

const priceSchema = z.coerce.number().min(0, "Geçerli bir tutar giriniz");

// --- Customer Schemas ---
export const customerSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    phone: phoneSchema.optional().or(z.literal("")),
    secondaryPhone: z.string().optional().or(z.literal("")),
    email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
    address: z.string().optional(),
    notes: z.string().optional(),
    type: z.string().optional().default("BIREYSEL"),
    isVip: z.boolean().optional().default(false),
    photo: z.string().optional(),
});

// --- Product Schemas ---
export const productSchema = z.object({
    name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
    categoryId: z.string().optional().nullable(),
    categoryPath: z.array(z.string()).optional(),
    buyPrice: priceSchema,
    buyPriceUsd: z.coerce.number().optional().nullable(),
    sellPrice: priceSchema,
    stock: z.coerce.number().int().default(0),
    criticalStock: z.coerce.number().int().default(5),
    barcode: z.string().optional(),
    sku: z.string().optional(),
    location: z.string().optional(),
    supplierId: z.string().optional(),
    isSecondHand: z.boolean().optional().default(false),
    imei: z.string().optional(),
    color: z.string().optional(),
    capacity: z.string().optional(),
    attributes: z.record(z.any()).optional().nullable(),
});

// --- Service Ticket Schemas ---
export const serviceTicketSchema = z.object({
    customerName: z.string()
        .min(2, "Müşteri adı en az 2 karakter olmalıdır")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s0-9]+$/, "Müşteri adı geçersiz karakterler içeriyor"), // Added 0-9 support
    customerPhone: phoneSchema,
    customerEmail: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
    deviceBrand: z.string().min(1, "Marka gereklidir"),
    deviceModel: z.string().min(1, "Model gereklidir"),
    imei: z.string().optional().or(z.literal("")),
    serialNumber: z.string().optional().or(z.literal("")),
    problemDesc: z.string().min(3, "Sorun açıklaması gereklidir"),
    cosmeticCondition: z.string().optional(),
    estimatedCost: priceSchema,
    notes: z.string().optional(),
    technicianId: z.string().optional().or(z.literal("")),
    estimatedDeliveryDate: z.string().optional().or(z.literal("")),
    downPayment: z.number().optional().default(0),
    photos: z.array(z.string()).optional().default([]),
    devicePassword: z.string().optional().or(z.literal("")),
    serviceType: z.string().optional().or(z.literal("")),
    priority: z.number().optional().default(1),
    attributes: z.record(z.any()).optional().nullable(),
});

// --- Transaction Schemas ---
export const transactionSchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: priceSchema,
    description: z.string().min(3, "Açıklama en az 3 karakter olmalıdır"),
    paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
    accountId: z.string().optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    attachments: z.array(z.object({
        url: z.string(),
        filename: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
    })).optional(),
});

// --- Sale Schemas ---
export const saleSchema = z.object({
    customerId: z.string().optional(),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.coerce.number().int().min(1),
        unitPrice: priceSchema,
    })).min(1, "En az bir ürün eklenmelidir"),
    totalAmount: priceSchema,
    paymentMethod: z.string(),
    discountAmount: z.coerce.number().optional().default(0),
    usedPoints: z.coerce.number().optional().default(0),
});
