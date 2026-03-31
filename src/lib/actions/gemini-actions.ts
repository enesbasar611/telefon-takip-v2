"use server";

import { getCategories, getProducts } from "@/lib/actions/product-actions";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


export interface AIProductResult {
    name: string;
    categoryId: string | null;
    categoryPath: string[]; // ordered list of category IDs from root to leaf
    buyPrice: number;
    buyPriceUsd?: number | null;
    sellPrice: number;
    stock: number;
    criticalStock: number;
    barcode?: string;
    location?: string;
    confidence: "high" | "medium" | "low";
}

async function buildCategoryContext() {
    const categories = await getCategories();
    return categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId || null,
    }));
}

function buildSystemPrompt(categoryList: any[]) {
    // Limit category list to max 80 entries to stay well under token limits
    const limited = categoryList.slice(0, 80);
    return `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.

MEVCUT KATEGORİ AĞACI (id → name → parentId):
${JSON.stringify(limited, null, 2)}

KATEGORİ EŞLEŞTİRME KURALLARI:
- categoryPath: kök kategoriden yaprağa doğru sıralı ID listesi ver. Örn: ["rootId", "childId"]
- Uygun kategori bulunamazsa null ver, categoryPath: []
- Fiyat kuralı: Satış işlemi her zaman TL (sellPrice). Ancak alışta DOLAR/USD belirtilirse, buyPriceUsd alanına doları yaz, buyPrice alanına doları 35 ile çarpıp (TL maliyet) yaz. Dolar yoksa sadece buyPrice gir.
- Belirtilmeyen stok → 1, kritik stok → 3, fiyat → 0
- confidence: "high" (çoğu alan doluysa), "medium" (bazısı belirsizse), "low" (sadece isim çıkarılabildiyse)`;
}

const SINGLE_SCHEMA = `{
  "name": "string",
  "categoryId": "string | null",
  "categoryPath": ["id1", "id2"],
  "buyPrice": number,
  "buyPriceUsd": "number | null",
  "sellPrice": number,
  "stock": number,
  "criticalStock": number,
  "barcode": "string | null",
  "location": "string | null",
  "confidence": "high | medium | low"
}`;

const BULK_SCHEMA = `{
  "products": [
    {
      "name": "string",
      "categoryId": "string | null",
      "categoryPath": ["id1", "id2"],
      "buyPrice": number,
      "buyPriceUsd": "number | null",
      "sellPrice": number,
      "stock": number,
      "criticalStock": number,
      "barcode": "string | null",
      "location": "string | null",
      "confidence": "high | medium | low"
    }
  ]
}`;

function sanitizeProduct(parsed: any): AIProductResult {
    return {
        name: parsed.name || "",
        categoryId: parsed.categoryId || null,
        categoryPath: Array.isArray(parsed.categoryPath) ? parsed.categoryPath : [],
        buyPrice: Number(parsed.buyPrice) || 0,
        buyPriceUsd: parsed.buyPriceUsd ? Number(parsed.buyPriceUsd) : null,
        sellPrice: Number(parsed.sellPrice) || 0,
        stock: Number(parsed.stock) || 1,
        criticalStock: Number(parsed.criticalStock) || 3,
        barcode: parsed.barcode && parsed.barcode !== "null" ? parsed.barcode : undefined,
        location: parsed.location && parsed.location !== "null" ? parsed.location : undefined,
        confidence: parsed.confidence || "medium",
    };
}

// ── CORE GEMINI CALLER with retry + full error details ─────────────────────
async function callGemini(promptParts: string[], retries = 3): Promise<{ text: string } | { error: string }> {
    if (!GEMINI_API_KEY) {
        return { error: "GEMINI_API_KEY eksik — .env.local dosyasını kontrol edin." };
    }

    const body = {
        contents: [{ parts: promptParts.map(text => ({ text })) }],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 4096
        }
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        let resp: Response;
        try {
            resp = await fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch (networkErr: any) {
            return { error: `Ağ bağlantısı kurulamadı: ${networkErr?.message || "Bilinmeyen hata"}` };
        }

        // 429 → wait and retry
        if (resp.status === 429) {
            if (attempt < retries) {
                const waitMs = Math.pow(2, attempt + 1) * 2000; // 4s, 8s, 16s
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }
            return { error: `Gemini API kota limitine ulaşıldı. ${retries} deneme sonrası başarısız oldu. Birkaç dakika bekleyip tekrar deneyin veya Google AI Studio'dan kota yükseltmesi yapın.` };
        }

        if (!resp.ok) {
            let details = "";
            try { const errBody = await resp.json(); details = errBody?.error?.message || ""; } catch { }
            if (resp.status === 400) return { error: `Geçersiz istek (400)${details ? ": " + details : ""}` };
            if (resp.status === 403) return { error: "API anahtarı geçersiz veya yetkisi yok (403)" };
            return { error: `Gemini API hatası ${resp.status}${details ? ": " + details : ""}` };
        }

        let json: any;
        try { json = await resp.json(); } catch {
            return { error: "Gemini yanıtı JSON olarak okunamadı." };
        }

        const candidate = json?.candidates?.[0];
        if (!candidate) {
            const blockReason = json?.promptFeedback?.blockReason;
            if (blockReason) {
                return { error: `Gemini bu içeriği güvenlik filtresi nedeniyle reddetti (${blockReason}). Açıklamayı sadeleştirip tekrar deneyin.` };
            }
            return { error: "Gemini yanıt üretemedi. Açıklamayı kısaltıp tekrar deneyin." };
        }

        const finishReason = candidate?.finishReason;
        if (finishReason === "MAX_TOKENS") {
            return { error: "Yanıt çok uzun oldu. Daha az model listeleyin (örn: iPhone 11-13 yerine 11-17 değil)." };
        }
        if (finishReason === "SAFETY") {
            return { error: "Gemini güvenlik filtresi devreye girdi. Açıklamayı sadeleştirip tekrar deneyin." };
        }

        const text = candidate?.content?.parts?.[0]?.text;
        if (!text || !text.trim()) {
            return { error: "Gemini boş metin döndürdü. Açıklamanızı farklı şekilde ifade edip tekrar deneyin." };
        }

        return { text };
    }

    return { error: "Tüm denemeler başarısız oldu. Lütfen daha sonra tekrar deneyin." };
}


// ── SINGLE PRODUCT PARSER ──────────────────────────────────────────────────
export async function parseProductWithAI(
    description: string
): Promise<{ success: true; data: AIProductResult } | { success: false; error: string }> {
    if (!GEMINI_API_KEY) return { success: false, error: "Gemini API anahtarı eksik." };
    if (!description.trim()) return { success: false, error: "Açıklama boş olamaz." };

    const categoryList = await buildCategoryContext();
    const systemPrompt = buildSystemPrompt(categoryList);
    const userPrompt = `SADECE GEÇERLİ JSON DÖNDÜR (başka metin yok):\n${SINGLE_SCHEMA}\n\nKULLANICI AÇIKLAMASI:\n${description}`;

    const result = await callGemini([systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        return { success: true, data: sanitizeProduct(JSON.parse(result.text)) };
    } catch {
        return { success: false, error: "AI yanıtı JSON olarak çözümlenemedi. Açıklamayı farklı ifade edip tekrar deneyin." };
    }
}

// ── BULK PRODUCT PARSER ────────────────────────────────────────────────────
export async function parseBulkProductsWithAI(
    description: string
): Promise<{ success: true; data: AIProductResult[] } | { success: false; error: string }> {
    if (!GEMINI_API_KEY) return { success: false, error: "Gemini API anahtarı eksik." };
    if (!description.trim()) return { success: false, error: "Açıklama boş olamaz." };

    // For bulk parsing, do NOT inject category list (too many tokens for large shops).
    // Categories are better resolved manually in the review step.
    const systemPrompt = `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.
Kullanıcı BİRDEN FAZLA ürün tanımlamış olabilir. Şu kurallara uy:
- "iPhone 11'den 15'e kadar" gibi seri ifadeleri her model için ayrı kayıt oluştur (max 20 ürün)
- "X adet" ifadesi stock anlamına gelir, ayrı ürün değil
- "alış X satış Y" işlemleri: Eğer alış dolar ise (örn. 1.5 dolar), buyPriceUsd: 1.5 yaz, buyPrice (TL maliyeti) için doları 35 ile çarp (52.5). Satış her zaman sellPrice. Döviz belirtilmemişse buyPriceUsd: null.
- Belirsiz modeller için makul isimler üret
- categoryId ve categoryPath: [] olarak bırak (kategoriler ayrıca seçilir)`;

    const userPrompt = `SADECE GEÇERLİ JSON DÖNDÜR:\n${BULK_SCHEMA}\n\nKULLANICI AÇIKLAMASI:\n${description}`;

    const result = await callGemini([systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        const products: AIProductResult[] = (parsed.products || []).map(sanitizeProduct);
        if (products.length === 0) return { success: false, error: "Hiç ürün tespit edilemedi. Açıklamayı daha net yazın." };
        return { success: true, data: products };
    } catch {
        return { success: false, error: "AI yanıtı JSON olarak çözümlenemedi. Açıklamayı farklı ifade edip tekrar deneyin." };
    }
}

// ── CATEGORY TREE + PRODUCT PARSER ────────────────────────────────────────
export interface AICategoryNode {
    name: string;
    parentName: string | null;
    products: {
        name: string;
        buyPrice: number;
        buyPriceUsd?: number | null;
        sellPrice: number;
        stock: number;
        criticalStock: number;
        barcode?: string;
        location?: string;
    }[];
}

export async function parseCategoryTreeWithAI(
    description: string
): Promise<{ success: true; data: AICategoryNode[] } | { success: false; error: string }> {
    if (!GEMINI_API_KEY) return { success: false, error: "Gemini API anahtarı eksik." };
    if (!description.trim()) return { success: false, error: "Açıklama boş olamaz." };

    const schema = `{
  "categories": [
    {
      "name": "string (kategori adı)",
      "parentName": "string | null (üst kategori adı; yoksa null)",
      "products": [
        {
          "name": "string (ürün adı)",
          "buyPrice": number,
          "buyPriceUsd": "number | null",
          "sellPrice": number,
          "stock": number,
          "criticalStock": number,
          "barcode": "string | null",
          "location": "string | null"
        }
      ]
    }
  ]
}`;

    const systemPrompt = `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.
Kullanıcı bir kategori hiyerarşisi ve ürün tanımı yazıyor.
Kurallara uy:
- "Şarj Aletleri > Type-C > 27W" gibi hiyerarşiler → her seviye ayrı kategori düğümü
- Her kategorinin parentName'ini bir üst seviyenin name'i olarak doldur (root → null)
- Ürünler ayrı kayıtlar; stok belirtilmemişse 1, kritik stok 3, fiyat 0
- Fiyatlar: Alış Dolar/USD verilirse, buyPriceUsd alanına yaz, buyPrice (TL) alanına dolar x 35 yaz.
- Seri modeller için HER MODEL ayrı ürün satırı olarak oluştur (max 20 ürün)
SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `KULLANICI AÇIKLAMASI:\n${description}`;

    const result = await callGemini([systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        const cats: AICategoryNode[] = (parsed.categories || []).map((c: any) => ({
            name: c.name || "",
            parentName: c.parentName || null,
            products: (c.products || []).map((p: any) => ({
                name: p.name || "",
                buyPrice: Number(p.buyPrice) || 0,
                buyPriceUsd: p.buyPriceUsd ? Number(p.buyPriceUsd) : null,
                sellPrice: Number(p.sellPrice) || 0,
                stock: Number(p.stock) || 1,
                criticalStock: Number(p.criticalStock) || 3,
                barcode: p.barcode && p.barcode !== "null" ? p.barcode : undefined,
                location: p.location && p.location !== "null" ? p.location : undefined,
            }))
        }));
        if (cats.length === 0) return { success: false, error: "Hiç kategori tespit edilemedi. Açıklamayı daha net yazın." };
        return { success: true, data: cats };
    } catch {
        return { success: false, error: "AI yanıtı JSON olarak çözümlenemedi. Açıklamayı farklı ifade edip tekrar deneyin." };
    }
}
// ── SEMANTIC SEARCH ──────────────────────────────────────────────────────────

export interface AISearchFilters {
    name?: string;
    categoryName?: string;
    minPrice?: number;
    maxPrice?: number;
    minStock?: number;
    maxStock?: number;
    isCritical?: boolean;
    currency?: "TL" | "USD";
}

async function getProductSummary() {
    const products = await getProducts();
    // Return a minimal list of product names and their categories for context
    return products.map((p: any) => ({
        name: p.name,
        category: p.category?.name || "Kategorisiz",
        buyPrice: p.buyPrice,
        buyPriceUsd: p.buyPriceUsd,
        stock: p.stock
    }));
}

export async function semanticSearchWithAI(query: string): Promise<{ success: true; filters: AISearchFilters } | { success: false; error: string }> {
    const summary = await getProductSummary();
    const categories = await buildCategoryContext();

    const schema = `{
  "name": "string | null (ürün adı veya parçası)",
  "categoryName": "string | null (kategori adı)",
  "minPrice": "number | null",
  "maxPrice": "number | null",
  "minStock": "number | null",
  "maxStock": "number | null",
  "isCritical": "boolean | null",
  "currency": "TL | USD | null"
}`;

    const systemPrompt = `Sen bir telefon dükkanı envanter arama asistanısın.
Kullanıcının doğal dildeki arama sorgusunu teknik filtrelere dönüştür.

MEVCUT KATEGORİLER:
${JSON.stringify(categories.map((c: any) => c.name))}

ÖRNEK ÜRÜNLER (Bağlam için):
${JSON.stringify(summary.slice(0, 20))}

KURALLAR:
- Kullanıcı "10 dolardan ucuz" diyorsa: currency: "USD", maxPrice: 10
- Kullanıcı "bitmek üzere olanlar" diyorsa: isCritical: true veya maxStock: 5
- "Ekranlar" diyorsa: categoryName: "Ekranlar"
- SADECE JSON DÖNDÜR, METİN EKLEME:\n${schema}`;

    const userPrompt = `ARAMA SORGUSU:\n${query}`;

    const result = await callGemini([systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const filters = JSON.parse(result.text) as AISearchFilters;
        return { success: true, filters };
    } catch {
        return { success: false, error: "Arama terimi anlaşılamadı. Lütfen daha net bir ifade kullanın." };
    }
}

// ── BULK UPDATE ──────────────────────────────────────────────────────────────

export interface AIUpdateOperation {
    id: string;
    name: string;
    newName?: string;
    sellPrice?: number;
    buyPriceUsd?: number;
    stock?: number;
    reason: string;
}

export async function parseBulkUpdateWithAI(command: string): Promise<{ success: true; updates: AIUpdateOperation[] } | { success: false; error: string }> {
    const products = await getProductSummary();

    const schema = `{
  "updates": [
    {
      "id": "string",
      "name": "string (mevcut isim)",
      "newName": "string | null",
      "sellPrice": "number | null",
      "buyPriceUsd": "number | null",
      "stock": "number | null",
      "reason": "string (neden güncelleniyor? Örn: %15 zam)"
    }
  ]
}`;

    const systemPrompt = `Sen bir envanter yönetim asistanısın. Kullanıcının toplu güncelleme komutunu analiz et.

MEVCUT ÜRÜNLER:
${JSON.stringify(products.slice(0, 50))}

KURALLAR:
- Kullanıcı "%15 zam yap" diyorsa, mevcut fiyata %15 ekle.
- "Kabloların fiyatını 200 yap" diyorsa, sadece o kategoriyi/ismi bul.
- Sadece değişen alanları doldur, değişmeyenleri null bırak.
- SADECE JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `GÜNCELLEME KOMUTU:\n${command}`;

    const result = await callGemini([systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        return { success: true, updates: parsed.updates || [] };
    } catch {
        return { success: false, error: "Güncelleme komutu anlaşılamadı." };
    }
}

// ── SHOP ANALYSIS ──────────────────────────────────────────────────────────

export async function getShopHealthAnalysis(): Promise<{ success: true; analysis: string } | { success: false; error: string }> {
    const products = await getProducts();
    const categories = await getCategories();

    // Minimal stats for context
    const stats = {
        totalProducts: products.length,
        totalStock: products.reduce((acc: number, p: any) => acc + p.stock, 0),
        criticalItems: products.filter((p: any) => p.stock <= p.criticalStock).length,
        categoriesCount: categories.length,
    };

    const systemPrompt = `Sen profesyonel bir telefon dükkanı danışmanısın. 
Verilen özet verilere bakarak dükkan sahibine kısa (3-4 paragraf), etkileyici ve aksiyon odaklı bir BAŞAR AI raporu sun.
Raporunda stok durumunu, kritik ürünleri ve genel dükkan verimliliğini yorumla.
Türkçe, profesyonel ama samimi bir dil kullan.`;

    const userPrompt = `DÜKKAN ÖZET VERİLERİ:
${JSON.stringify(stats, null, 2)}`;

    const result = await callGemini([systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    return { success: true, analysis: result.text };
}
