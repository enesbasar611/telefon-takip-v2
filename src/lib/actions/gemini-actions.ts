"use server";

import { getCategories, getProducts } from "@/lib/actions/product-actions";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiApiKey = async (shopId: string) => {
    return unstable_cache(
        async () => {
            const setting = await prisma.setting.findUnique({
                where: {
                    shopId_key: {
                        shopId,
                        key: "gemini_api_key"
                    }
                }
            });
            return setting?.value || process.env.GEMINI_API_KEY || "";
        },
        [`gemini-api-key-${shopId}`],
        { tags: ["settings", `settings-${shopId}`], revalidate: 900 }
    )();
};


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

export interface AIDiagnosticResult {
    possibleCauses: string[];
    suggestedParts: {
        name: string;
        estimatedPrice: number;
        inStock: boolean;
        alternative?: string;
    }[];
    estimatedLaborPrice: number;
    estimatedTotalPrice: number;
    repairTimeRange: string;
    riskLevel: "Düşük" | "Orta" | "Yüksek";
    professionalNote: string;
}

async function buildCategoryContext() {
    const categories = await getCategories();
    return categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId || null,
    }));
}

async function buildProductContext() {
    const { products } = await getProducts();
    // Only return names to save tokens
    return products.slice(0, 300).map((p: any) => p.name);
}

function buildSystemPrompt(categoryList: any[], productList: string[] = [], exchangeRate: number = 35) {
    const usdRate = exchangeRate > 1 ? exchangeRate : 35;
    const limited = categoryList.slice(0, 80);
    return `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.

MEVCUT KATEGORİ AĞACI:
${JSON.stringify(limited, null, 2)}

MEVCUT ÜRÜNLER (Mükerrer eklememek için kontrol et):
${JSON.stringify(productList.slice(0, 50))}

HİYERARŞİK KATEGORİ VE EŞLEŞTİRME KURALLARI:
1. "categoryPath": Kökten yaprağa doğru isim veya ID listesi olmalı.
2. MEVCUT ÜRÜNLER listesinde olan ürünleri TEKRAR ÖNERME. Sadece eksikleri öner.
3. Eğer kullanıcı "iPhone 11'den 15'e kadar" dediyse ve 12-13 zaten varsa, sadece 11, 14, 15 ve bunların Pro/Max versiyonlarını (eğer istenmişse) oluştur.
4. "Şarj Aletleri > Type-C > Samsung 25W" gibi bir yapı girdiyse, categoryPath: ["Şarj Aletleri", "Type-C"] olmalı.
5. Mevcut kategorilerle eşleşiyorsa ID'leri kullan, yeni bir kategori hiyerarşisi seziyorsan isimleri kullan.
 6. FİLER DÖNÜŞÜMÜ (KUR: ${usdRate}): Eğer alış fiyatında "dolar", "USD" veya "$" işareti varsa buyPriceUsd alanına o rakamı yaz, buyPrice (TL) alanına ise o rakamın ${usdRate} katını yaz (sonucu yukarı yuvarla, tam sayı olsun).
7. confidence: "high", "medium", "low".
İstisnalar: Telefon ekleme önerilerilerinde gereksiz model kalabalığı yapma.`;
}

const SINGLE_SCHEMA = `{
  "name": "string",
  "categoryId": "string | null",
  "categoryPath": ["string (ID or name)", "string"], 
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
      "categoryPath": ["string", "string"],
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

// ── CORE GEMINI CALLER with official SDK ─────────────────────
async function callGemini(shopId: string, promptParts: string[], responseType: "json" | "text" = "json", retries = 2): Promise<{ text: string } | { error: string }> {
    const key = await getGeminiApiKey(shopId);
    if (!key) {
        return { error: "GEMINI_API_KEY eksik — Ayarlar > Otomasyon tablosundan veya .env.local dosyasından kontrol edin." };
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel(
            {
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: responseType === "json" ? "application/json" : "text/plain",
                    temperature: 0.1,
                    maxOutputTokens: 2048
                }
            }
        );

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        let text = response.text();

        if (!text || !text.trim()) {
            return { error: "Gemini boş metin döndürdü. Açıklamanızı farklı şekilde ifade edip tekrar deneyin." };
        }

        if (responseType === "json") {
            let rawText = text.trim();
            if (rawText.startsWith("```json")) {
                rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
            } else if (rawText.startsWith("```")) {
                rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
            }
            text = rawText;
        }

        return { text };
    } catch (error: any) {
        console.error("Gemini SDK Error:", error);
        const errMsg = error?.message || "";

        if (errMsg.includes("429")) return { error: "Gemini API kota limitine ulaşıldı." };
        if (errMsg.includes("403")) return { error: "API anahtarı geçersiz veya yetkisi yok (403)" };
        if (errMsg.includes("SAFETY")) return { error: "Güvenlik filtresi nedeniyle içerik reddedildi." };

        return { error: `Gemini API hatası: ${errMsg}` };
    }
}


// ── SINGLE PRODUCT PARSER ──────────────────────────────────────────────────
export async function parseProductWithAI(
    description: string
): Promise<{ success: true; data: AIProductResult } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    if (!description.trim()) return { success: false, error: "Açıklama boş olamaz." };

    const { getExchangeRates } = await import("@/lib/actions/currency-actions");
    const rates = await getExchangeRates(shopId);
    const usdRate = rates.usd > 1 ? rates.usd : 35;

    const categoryList = await buildCategoryContext();
    const productList = await buildProductContext();
    const systemPrompt = buildSystemPrompt(categoryList, productList, usdRate);
    const userPrompt = `SADECE GEÇERLİ JSON DÖNDÜR (başka metin yok):\n${SINGLE_SCHEMA}\n\nKULLANICI AÇIKLAMASI:\n${description}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
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
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    if (!description.trim()) return { success: false, error: "Açıklama boş olamaz." };

    // For bulk parsing, do NOT inject category list (too many tokens for large shops).
    // Categories are better resolved manually in the review step.
    const productList = await buildProductContext();
    const { getExchangeRates } = await import("@/lib/actions/currency-actions");
    const rates = await getExchangeRates(shopId);
    const usdRate = rates.usd > 1 ? rates.usd : 35;

    const systemPrompt = `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.
Kullanıcı BİRDEN FAZLA ürün tanımlamış olabilir. Şu kurallara uy:
- MEVCUT ÜRÜNLER: ${JSON.stringify(productList.slice(0, 100))}
- Eğer bir ürün yukarıdaki MEVCUT ÜRÜNLER listesinde varsa, onu tekrar EKLEME. Sadece listede olmayanları veya yeni modelleri ekle.
- "iPhone 11'den 15'e kadar" gibi seri ifadeleri her model için ayrı kayıt oluştur (max 20 ürün)
- "X adet" ifadesi stock anlamına gelir, ayrı ürün değil
- categoryPath: ["kategori1", "kategori2"] listesi döndür.
- FİYAT DÖNÜŞÜMÜ (KUR: ${usdRate}): Eğer kullanıcı fiyatı "dolar", "USD" veya "$" olarak belirttiyse, buyPriceUsd alanına o rakamı yaz, buyPrice (TL) alanına ise o rakamın ${usdRate} katını yaz (sonucu yukarı yuvarla).
- SADECE GEÇERLİ JSON DÖNDÜR.`;

    const userPrompt = `SADECE GEÇERLİ JSON DÖNDÜR:\n${BULK_SCHEMA}\n\nKULLANICI AÇIKLAMASI:\n${description}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
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
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

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

    const { getExchangeRates } = await import("@/lib/actions/currency-actions");
    const rates = await getExchangeRates(shopId);
    const usdRate = rates.usd > 1 ? rates.usd : 35;

    const productList = await buildProductContext();
    const systemPrompt = `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.
Kullanıcı bir kategori hiyerarşisi ve ürün tanımı yazıyor.
MEVCUT ÜRÜNLER (Mükerrer eklememek için kontrol et): ${JSON.stringify(productList.slice(0, 50))}
Kurallara uy:
1. Eğer bir ürün yukarıdaki MEVCUT ÜRÜNLER listesinde birebir aynı isimle varsa, onu tekrar EKLEME. 
2. "Şarj Aletleri > Type-C > 27W" gibi hiyerarşiler → her seviye ayrı kategori düğümü
3. Her kategorinin parentName'ini bir üst seviyenin name'i olarak doldur (root → null)
4. Seri modeller için HER MODEL ayrı ürün satırı olarak oluştur (max 20 ürün)
5. FİYAT DÖNÜŞÜMÜ (KUR: ${usdRate}): Eğer kullanıcı fiyatı "dolar" veya "$" olarak belirttiyse, buyPriceUsd alanına o rakamı yaz, buyPrice (TL) alanına ise o rakamın ${usdRate} katını yaz (sonucu yukarı yuvarla).
SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `KULLANICI AÇIKLAMASI:\n${description}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
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

async function getProductSummaryFiltered(filters: { categoryName?: string; search?: string } = {}) {
    let categoryIds: string[] = [];

    // If a categoryName is provided, find the category and all its descendants
    if (filters.categoryName) {
        const allCategories = await prisma.category.findMany();

        // Find categories that match the name (bi-directional check)
        const matchingCats = allCategories.filter((c: any) =>
            c.name.toLowerCase().includes(filters.categoryName!.toLowerCase()) ||
            filters.categoryName!.toLowerCase().includes(c.name.toLowerCase())
        );

        if (matchingCats.length > 0) {
            const findDescendants = (parentId: string): string[] => {
                const results = [parentId];
                const children = allCategories.filter((c: any) => c.parentId === parentId);
                children.forEach((child: any) => results.push(...findDescendants(child.id)));
                return results;
            };

            const allTargetIds = new Set<string>();
            matchingCats.forEach((c: any) => {
                findDescendants(c.id).forEach(id => allTargetIds.add(id));
            });
            categoryIds = Array.from(allTargetIds);
        }
    }

    // Fetch products based on categoryIds or search
    const where: any = {};
    if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
    } else if (filters.categoryName) {
        // If we found no specific category IDs but had a name, try searching the name in global products
        where.OR = [
            { name: { contains: filters.categoryName, mode: 'insensitive' } },
            { category: { name: { contains: filters.categoryName, mode: 'insensitive' } } }
        ];
    }

    if (filters.search) {
        const searchCondition = { contains: filters.search, mode: 'insensitive' as const };
        if (where.OR) {
            where.OR.push({ name: searchCondition });
        } else {
            where.OR = [
                { name: searchCondition },
                { sku: searchCondition },
                { barcode: searchCondition }
            ];
        }
    }

    const products = await prisma.product.findMany({
        where,
        include: { category: true },
        take: 200 // More for context, but will be sliced later
    });

    return products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name || "Kategorisiz",
        buyPrice: Number(p.buyPrice),
        buyPriceUsd: p.buyPriceUsd ? Number(p.buyPriceUsd) : null,
        sellPrice: Number(p.sellPrice),
        stock: p.stock,
        location: p.location || "Yok"
    }));
}

export async function semanticSearchWithAI(query: string): Promise<{ success: true; filters: AISearchFilters } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    const summary = await getProductSummaryFiltered();
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

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
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
    location?: string;
    reason: string;
    status: "Halledildi" | "Eksik Veri";
}

export interface AIIntentClarification {
    enhancedPrompt: string;
    clarifiedIntent: string;
    isPerfect: boolean;
}

export interface AIUpdateResponse {
    updates: AIUpdateOperation[];
    warnings: string[];
    affectedCount: number;
    summary: string;
}

export async function enhanceAndClarifyIntent(command: string): Promise<{ success: true; data: AIIntentClarification } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    if (!command.trim()) return { success: false, error: "Komut boş olamaz." };

    const schema = `{
        "enhancedPrompt": "string",
        "clarifiedIntent": "string",
        "isPerfect": "boolean"
    }`;

    const systemPrompt = `Sen bir envanter yönetim asistanısın. Kullanıcının günlük dilde yazdığı (muğlak olabilecek) komutları analiz edip daha net bir formata çevirirsin.
    
    KURALLAR:
    - enhancedPrompt: Kullanıcının niyetini daha teknik ve net ifade eden versiyon.
    - clarifiedIntent: Kullanıcıya 'Bunu mu demek istediniz?' diye sorulacak samimi soru.
    - isPerfect: Eğer komut zaten çok netse true, muğlaklık veya çok günlük dil varsa false.
    
    YANIT SADECE JSON OLMALIDIR: ${schema}`;

    const result = await callGemini(shopId, [systemPrompt, `KULLANICI KOMUTU: ${command}`]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        return {
            success: true,
            data: {
                enhancedPrompt: parsed.enhancedPrompt || command,
                clarifiedIntent: parsed.clarifiedIntent || "Bunu mu demek istediniz?",
                isPerfect: !!parsed.isPerfect
            }
        };
    } catch {
        return { success: false, error: "Komut analiz edilemedi." };
    }
}

export async function parseBulkUpdateWithAI(command: string): Promise<{ success: true; data: AIUpdateResponse } | { success: false; error: string }> {
    const categories = await buildCategoryContext();

    // STEP 1: Extract intent (which category or keyword is targeted?)
    const intentSchema = `{ "categoryName": "string | null", "search": "string | null" }`;
    const intentPrompt = `Kullanıcının komutundan hangi kategori veya ürün grubunu güncellemek istediğini çıkar.
    MEVCUT KATEGORİLER: ${JSON.stringify(categories.map((c: any) => c.name))}
    
    ÖNEMLİ: Kategori adını MEVCUT KATEGORİLER listesinden tam olarak seçmeye çalış. Eğer uygun bir kategori yoksa search alanına genel anahtar kelimeyi yaz.
    SADECE JSON DÖNDÜR: ${intentSchema}
    KOMUT: ${command}`;

    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    const intentResult = await callGemini(shopId, [intentPrompt]);
    let filters = { categoryName: "", search: "" };
    if (!("error" in intentResult)) {
        try {
            const parsed = JSON.parse(intentResult.text);
            filters.categoryName = parsed.categoryName || "";
            filters.search = parsed.search || "";
        } catch { }
    }

    // STEP 2: Fetch ONLY relevant products
    let products = await getProductSummaryFiltered(filters);

    if (products.length === 0) {
        // Fallback: If category filtering returned nothing, try semantic-like search on the command keywords
        const keywords = command.replace(/kategorisindeki|tüm|ürünlerin|yap|konumunu|raf/g, "").trim();
        const fallbackProducts = await getProductSummaryFiltered({ search: keywords });
        if (fallbackProducts.length > 0) products = fallbackProducts;
    }

    if (products.length === 0) {
        // Second Fallback: Just search for the category name if it was extracted but failed
        if (filters.categoryName) {
            const catSearch = await getProductSummaryFiltered({ search: filters.categoryName });
            if (catSearch.length > 0) products = catSearch;
        }
    }

    const schema = `{
  "updates": [
    {
      "id": "string",
      "name": "string",
      "newName": "string | null",
      "sellPrice": "number | null",
      "buyPriceUsd": "number | null",
      "stock": "number | null",
      "location": "string | null",
      "reason": "string",
      "status": "Halledildi | Eksik Veri"
    }
  ],
  "warnings": ["string (uyarı mesajları)"],
  "affectedCount": number,
  "summary": "string"
}`;

    // --- 🛠️ Jules İçin Tamir Kodu 🛠️ ---
    // STEP 3: Build a quota-friendly system prompt
    const limitedProducts = products.slice(0, 100).map((p: any) => ({
        id: p.id,
        name: p.name,
        buyPriceUsd: p.buyPriceUsd,
        sellPrice: p.sellPrice || 0,
        location: p.location || "Yok"
    }));

    const { getExchangeRates } = await import("@/lib/actions/currency-actions");
    const rates = await getExchangeRates(shopId);
    const usdRate = rates.usd > 1 ? rates.usd : 35;

    const systemPrompt = `Sen BAŞAR AI envanter yönetim asistanısın. Kullanıcının toplu güncelleme komutlarını Prisma tabanlı işlemlerine dönüştürürsün.

MEVCUT KATEGORİLER:
${JSON.stringify(filters.categoryName ? [filters.categoryName] : categories.map((c: any) => c.name))}

FİLTRELENMİŞ ÜRÜNLER (SADECE BU ÜRÜNLERİ GÜNCELLE):
${JSON.stringify(limitedProducts)}

DENETLEME KURALLARI (Polis Modu):
1. SADECE yukarıda sana verilen "FİLTRELENMİŞ ÜRÜNLER" listesindeki ürünleri güncelle.
2. Eğer bir ürünün sellPrice değeri 0 ise ve kullanıcı 'Yüzde zam yap' diyorsa (örn: %10 zam), bu ürünü updates listesine EKLEME, warnings listesine ekle (örn: "[Ürün Adı] fiyatı 0 olduğu için yüzde hesaplanamadı").
3. Eğer kullanıcı 'Rafı/Lokasyonu değiştir' diyor ama bir ürünün kategorisi belirsizse bunu warnings'e ekle.
4. Verisi tam olanları (id, name ve en az bir değişiklik alanı doluysa) status: 'Halledildi', eksik olanları 'Eksik Veri' olarak sınıflandır.
5. FİYAT DÖNÜŞÜMÜ (KUR: ${usdRate}): Eğer kullanıcı fiyatı "dolar", "USD" veya "$" olarak belirttiyse, buyPriceUsd alanına o rakamı yaz, buyPrice (TL) alanına ise o rakamın ${usdRate} katını yaz (sonucu yukarı yuvarla).

GÖREVLER:
- updateProductLocation: Ürünlerin raf bilgisini (location) değiştirir.
- bulkPriceUpdate: Ürünlerin fiyatlarını günceller.
- bulkStockUpdate: Stok miktarlarını günceller.

SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `GÜNCELLEME KOMUTU:\n${command}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        return {
            success: true,
            data: {
                updates: parsed.updates || [],
                warnings: parsed.warnings || [],
                affectedCount: parsed.affectedCount || (parsed.updates?.length || 0),
                summary: parsed.summary || `${(parsed.updates?.length || 0)} ürün güncellenecek.`
            }
        };
    } catch {
        return { success: false, error: "Güncelleme komutu anlaşılamadı. Lütfen daha net bir talimat verin." };
    }
}

// ── SHOP ANALYSIS ──────────────────────────────────────────────────────────

export async function getShopHealthAnalysis(): Promise<{ success: true; analysis: string } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    const productsData = await getProducts();
    const products = productsData.products;
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

    const userPrompt = `DÜKKAN ÖZET VERİLERİ: ${JSON.stringify(stats, null, 2)}`;
    const result = await callGemini(shopId, [systemPrompt, userPrompt], "text");
    if ("error" in result) return { success: false, error: result.error };

    return { success: true, analysis: result.text };
}

// ── SERVICE DIAGNOSTIC ──────────────────────────────────────────────────────

export async function parseServiceDiagnosticWithAI(
    problemDescription: string,
    deviceModel?: string,
    industry?: string
): Promise<{ success: true; data: AIDiagnosticResult } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    if (!problemDescription.trim()) return { success: false, error: "Arıza açıklaması boş olamaz." };

    const schema = `{
  "possibleCauses": ["string"],
  "suggestedParts": [
    { "name": "string", "estimatedPrice": number, "inStock": boolean, "alternative": "string | null (eğer asıl parça yoksa stoktaki en yakın muadil)" }
  ],
  "estimatedLaborPrice": number,
  "estimatedTotalPrice": number,
  "repairTimeRange": "string (örn: 1-2 saat)",
  "riskLevel": "Düşük | Orta | Yüksek",
  "professionalNote": "string (teknik tavsiye)",
  "summaryReport": "string (Tüm teknik servisle alakalı analiz raporu özeti: Kronik sorunlar, başarı oranı tahmini ve dükkanın geçmiş tecrübelerine göre tavsiye)"
}`;

    // Get current inventory names and prices for context
    const products = await prisma.product.findMany({
        where: { shopId },
        select: { name: true, sellPrice: true, stock: true },
        take: 300
    });

    // Get last 50 services for general trend analysis
    const pastTickets = await prisma.serviceTicket.findMany({
        where: { shopId },
        select: { deviceModel: true, problemDesc: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const inventoryContext = products.map(p => `${p.name} (TL: ${p.sellPrice}, Stok: ${p.stock})`).join(", ");
    const historyContext = pastTickets.map(t => `${t.deviceModel}: ${t.problemDesc} (${t.status})`).join(" | ");

    const systemPrompt = `Sen profesyonel bir teknik servis danışmanısın. 
Kullanıcının girdiği arıza açıklamasına göre bir ön teşhis koy.

GÜNCEL DÜKKAN STOĞU:
${inventoryContext}

DÜKKAN GEÇMİŞİ (Son 50 Kayıt):
${historyContext}

Kurallar:
1. Gerekli parçaları belirlerken GÜNCEL DÜKKAN STOĞU listesini kontrol et.
2. DÜKKAN GEÇMİŞİ verilerini kullanarak kronik sorunları tespit et ve "summaryReport" alanında dükkan sahibine özel bir özet sun.
3. Eğer parça stokta varsa: name olarak dükkandaki tam adı kullan, estimatedPrice olarak dükkan fiyatını al ve inStock: true set et.
4. Eğer parça stokta YOKSA: name olarak genel adını yaz, inStock: false set et, piyasa fiyatını tahmin et.
5. SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `SEKTÖR: ${industry || 'Bilinmiyor'}\nARIZA AÇIKLAMASI: ${problemDescription}\nCİHAZ MODELİ: ${deviceModel || 'Bilinmiyor'}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        return { success: true, data: parsed };
    } catch {
        return { success: false, error: "Teşhis raporu oluşturulamadı. Lütfen arızayı daha detaylı yazın." };
    }
}

// ── WHATSAPP MESSAGE REFINEMENT ──────────────────────────────────────────────

export async function refineWhatsAppMessageWithAI(
    originalMessage: string,
    tone: "professional" | "friendly" | "urgent" = "professional"
): Promise<{ success: true; refinedMessage: string } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    const systemPrompt = `Sen bir müşteri iletişim uzmanısın. 
Aşağıdaki WhatsApp mesajını, seçilen tona (${tone}) uygun şekilde, daha profesyonel, etkileyici ve nazik bir dille yeniden yaz.
Kurallar:
1. Mesajdaki kritik bilgileri (kayıt no, cihaz, fiyat, tarih vb.) KESİNLİKLE DEĞİŞTİRME.
2. Emojileri yerinde ve profesyonelce kullan.
3. Mesajın sonuna dükkanın kurumsal bir kapanış cümlesini ekle.
4. Yazım kurallarına %100 uy.
5. SADECE YENİ MESAJ METNİNİ DÖNDÜR.`;

    const result = await callGemini(shopId, [systemPrompt, originalMessage], "text");
    if ("error" in result) return { success: false, error: result.error };

    return { success: true, refinedMessage: result.text };
}

// ── SMART STOCK & FINANCE ANALYSIS ──────────────────────────────────────────

export async function getSmartAIStockAnalysis(): Promise<{ success: true; analysis: string } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId();

    try {
        const prisma = (await import("@/lib/prisma")).default;

        // 1. Get current stock levels (top 100 products)
        const products = await prisma.product.findMany({
            where: { shopId },
            select: { name: true, stock: true, criticalStock: true, buyPrice: true, sellPrice: true },
            take: 100
        });

        // 2. Get sales data for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sales = await prisma.saleItem.findMany({
            where: {
                shopId,
                sale: { createdAt: { gte: thirtyDaysAgo } }
            },
            include: { product: { select: { name: true } } },
            take: 200
        });

        // 3. Summarize sales
        const salesSummary: Record<string, number> = {};
        sales.forEach(item => {
            const name = item.product.name;
            salesSummary[name] = (salesSummary[name] || 0) + item.quantity;
        });

        const systemPrompt = `Sen BAŞAR AI Stok Danışmanısın. Verileri analiz edip kısa, öz ve etkileyici bir stratejik rapor oluştur.
Asla JSON veya süslü parantez kullanma. Doğrudan düz metin ve markdown (listeler, kalın yazılar) kullan.
Giriş kısmını çok kısa tut. Teknik detaya boğma, aksiyon söyle.

ÖNEMLİ KURALLAR:
1. Gerekli parça veya ürün önerirken, eğer dükkan stoğunda varsa "Stokta Var - [Fiyat] TL" şeklinde belirt.
2. Eğer dükkan stoğunda yoksa "Stokta Yok - [Tahmini Fiyat] TL" yaz ve varsa dükkanındaki en yakın alternatifini (muadil) öner.
3. Rakamları ve önemli ürün adlarını kalın (bold) yaz.

RAPOR AKIŞI:
1. 📈 POPÜLER: En çok satanlar özeti.
2. ⚠️ KRİTİK: Acil stoklanması gerekenler (Stokta yoksa belirt).
3. 📉 ÖLÜ STOK: Hareket etmeyenler için tavsiye.
4. 🛡️ TAVSİYE: Önümüzdeki 15 gün için 3 kısa altın kural.

KULLANICI VERİLERİ (Son 30 Gün):
- Mevcut Stok Listesi: ${JSON.stringify(products.slice(0, 50))}
- Satış Özetleri: ${JSON.stringify(salesSummary)}`;

        const result = await callGemini(shopId, [systemPrompt, "Genel analiz raporu oluştur."], "text");
        if ("error" in result) return { success: false, error: result.error };

        return { success: true, analysis: result.text };
    } catch (error) {
        console.error("Smart Analysis Error:", error);
        return { success: false, error: "Veriler analiz edilirken bir hata oluştu." };
    }
}

/**
 * Technical Service Analysis Report
 */
export async function getTechnicalServiceAnalysis(): Promise<{ success: boolean; analysis?: string; error?: string }> {
    try {
        const { getShopId } = await import("@/lib/auth");
        const shopId = await getShopId();

        // Get last 30 days of service tickets
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const tickets = await prisma.serviceTicket.findMany({
            where: {
                shopId,
                createdAt: { gte: thirtyDaysAgo }
            },
            include: {
                usedParts: { include: { product: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 100 // Last 100 for context
        });

        if (tickets.length === 0) {
            return { success: false, error: "Analiz için yeterli servis kaydı bulunamadı." };
        }

        // Aggregate some data
        const statusSummary = tickets.reduce((acc: any, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {});

        const commonProblems = tickets.map(t => t.problemDesc).slice(0, 20);
        const deviceModels = tickets.map(t => `${t.deviceBrand} ${t.deviceModel}`).slice(0, 20);

        const systemPrompt = `Sen BAŞAR AI Teknik Servis Analistisin. Teknik servis operasyonlarını analiz edip dükkan sahibine yol gösterecek bir özet rapor sun.
Asla JSON veya süslü parantez kullanma. Doğrudan düz metin ve markdown (listeler, kalın yazılar) kullan.
Kısa, öz ve aksiyon odaklı ol.

RAPOR AKIŞI:
1. 🔧 OPERASYON: Genel durum özeti.
2. 📱 CİHAZ/ARIZA: En çok gelen cihazlar ve kronikleşen arızalar.
3. 💸 KARLILIK: Servis ücretleri ve maliyetler üzerine kısa bir yorum.
4. 🚀 TAVSİYE: Teknik servis hızını veya kalitesini artıracak 2 altın kural.

ANALİZ VERİLERİ (Son 30 Gün):
- Toplam Kayıt: ${tickets.length}
- Durum Dağılımı: ${JSON.stringify(statusSummary)}
- Örnek Arızalar: ${commonProblems.join(", ")}
- Örnek Cihazlar: ${deviceModels.join(", ")}`;

        const result = await callGemini(shopId, [systemPrompt, "Teknik servis genel analiz raporu oluştur."], "text");
        if ("error" in result) return { success: false, error: result.error };

        return { success: true, analysis: result.text };
    } catch (error) {
        console.error("Technical Service Analysis Error:", error);
        return { success: false, error: "Teknik servis verileri analiz edilirken bir hata oluştu." };
    }
}

// ── API KEY VALIDATION ──────────────────────────────────────────────────────

/**
 * Validates a Gemini API Key by attempting a simple generation
 */
export async function validateGeminiKeyAction(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.length < 20) {
        return { success: false, message: "Geçersiz anahtar formatı." };
    }

    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Simple ping request
        const result = await model.generateContent("Merhaba, sistem bağlantı testi. Sadece 'OK' cevabı ver.");
        const response = await result.response;
        const text = response.text();

        if (text) {
            return { success: true, message: "Bağlantı başarılı! BAŞAR AI kullanıma hazır." };
        }

        return { success: false, message: "API yanıt vermedi, lütfen anahtarı kontrol edin." };
    } catch (error: any) {
        console.error("Gemini Validation Error:", error);
        let errorMsg = "Bağlantı başarısız.";

        if (error?.message?.includes("API_KEY_INVALID")) {
            errorMsg = "Geçersiz API Anahtarı. Lütfen kopyalarken hata yapmadığınızdan emin olun.";
        } else if (error?.message?.includes("location not supported")) {
            errorMsg = "Bu API anahtarı bölgenizde desteklenmiyor olabilir.";
        }

        return { success: false, message: errorMsg };
    }
}

// ── INDUSTRY CONFIG AI FALLBACK ──────────────────────────────────────────────

export async function generateIndustryConfigWithAI(sectorName: string): Promise<{ success: true; data: { serviceFields: any[], productFields: any[], accessories: string[] } } | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId(false) || "";

    // Mapping for UI values to config keys
    const sectorMapping: Record<string, string> = {
        "TELEFONCU": "PHONE_REPAIR",
        "ELEKTRIKCI": "ELECTRICIAN",
        "TERZI": "CLOTHING",
        "OTOMOTIV": "AUTOMOTIVE",
        "BILGISAYAR": "COMPUTER_REPAIR",
        "KUAFOR": "BARBER"
    };

    const configKey = sectorMapping[sectorName] || sectorName;
    const { industries } = await import("@/config/industries");
    const preset = (industries as any)[configKey];

    if (preset) {
        console.log(`[AI-BYPASS] Using preset for sector: ${sectorName}`);
        return {
            success: true,
            data: {
                serviceFields: preset.serviceFormFields,
                productFields: preset.inventoryFormFields,
                accessories: preset.accessories || []
            }
        };
    }

    const schema = `{
  "serviceFields": [
    { "key": "string (İngilizce camelCase)", "label": "string", "type": "text | number | select | textarea", "required": "boolean (opsiyonel)", "placeholder": "string (opsiyonel)", "options": ["string"] }
  ],
  "productFields": [
    { "key": "string (İngilizce camelCase)", "label": "string", "type": "text | number | select | textarea", "required": "boolean (opsiyonel)", "placeholder": "string (opsiyonel)", "options": ["string"] }
  ],
  "accessories": ["string"]
}`;

    const systemPrompt = `Sen bir B2B SaaS konfigürasyon asistanısın. Kullanıcının işletme sektörüne (${sectorName}) özel olarak, servis/arıza kaydı oluştururken (serviceFields) ve stok/ürün eklerken (productFields) kullanılması en mantıklı 5'er form alanı oluştur.
Kurallar:
1. "deviceBrand", "deviceModel", "imei", "barcode", "location", "buyPrice", "sellPrice", "stock" gibi varsayılan ana alanları TEKRAR EKLEME. Sadece sektöre spesifik (örn: Elektrikçi için 'Voltaj', Terzi için 'Kumaş Türü', Giyim için 'Beden') dinamik özellik alanları üret.
2. type olarak sadece 'text', 'number', 'select', 'textarea' kullan.
3. select tipi için mantıklı birkaç 'options' sağla.
4. "accessories": Bu kategoriye giren dükkanlarda müşteriden teslim alınırken kontrol edilecek en mantıklı 5 aksesuarı (örn. terzi için 'Askı', 'Kılıf', telefoncu için 'Şarj Aleti') içeren bir dizi döndür.
5. SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `SEKTÖR: ${sectorName}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        return { success: true, data: parsed };
    } catch {
        return { success: false, error: "AI yapılandırması oluşturulamadı." };
    }
}

/**
 * Analyzes the sector during onboarding to suggest modules, terminology and initial categories.
 */
export async function onboardingAISectorAnalysis(sectorName: string): Promise<{
    success: true;
    data: {
        suggestedModules: string[];
        labels: Record<string, string>;
        suggestedCategories: string[];
        businessAdvice: string;
    }
} | { success: false; error: string }> {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId(false) || "";

    // Mapping for UI values
    const sectorMapping: Record<string, string> = {
        "TELEFONCU": "PHONE_REPAIR",
        "ELEKTRIKCI": "ELECTRICIAN",
        "TERZI": "CLOTHING",
        "OTOMOTIV": "AUTOMOTIVE",
        "BILGISAYAR": "COMPUTER_REPAIR",
        "KUAFOR": "BARBER"
    };

    const configKey = sectorMapping[sectorName] || sectorName;
    const { industries } = await import("@/config/industries");
    const preset = (industries as any)[configKey];

    if (preset) {
        console.log(`[AI-BYPASS-ANALYSIS] Using preset for sector: ${sectorName}`);
        return {
            success: true,
            data: {
                suggestedModules: preset.features,
                labels: preset.labels,
                suggestedCategories: preset.suggestedCategories,
                businessAdvice: preset.businessAdvice
            }
        };
    }

    const schema = `{
  "suggestedModules": ["SERVICE", "STOCK", "SALE", "FINANCE", "LOYALTY", "APPOINTMENT"],
  "labels": {
    "serviceTicket": "string (örn: Servis Kaydı, Arıza Formu)",
    "customerAsset": "string (örn: Cihaz, Ürün, Araç)",
    "inventory": "string (örn: Stok, Parça Havuzu, Reçete)",
    "productLabel": "string (örn: Parça, Malzeme, Ürün)"
  },
  "suggestedCategories": ["string (en mantıklı 5 kategori)"],
  "businessAdvice": "string (kısa bir tavsiye)"
}`;

    const systemPrompt = `Sen bir iş geliştirme uzmanısın. Kullanıcının yeni açtığı dükkanın sektörüne (${sectorName}) bakarak sistemi nasıl yapılandırması gerektiğini belirle.
Kurallar:
1. SADECE kullanıcı için gerçekten GEREKLİ olan modülleri suggestedModules içine ekle.
2. Sektöre en uygun terimleri (labels) belirle.
3. Dükkana başlangıç için en mantıklı 5 ana kategoriyi öner.
4. SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `SEKTÖR: ${sectorName}`;

    const result = await callGemini(shopId, [systemPrompt, userPrompt]);
    if ("error" in result) return { success: false, error: result.error };

    try {
        const parsed = JSON.parse(result.text);
        return { success: true, data: parsed };
    } catch {
        return { success: false, error: "AI analizi başarısız oldu." };
    }
}

export async function generateAndCacheIndustryTemplate(sectorName: string) {
    const { getShopId } = await import("@/lib/auth");
    const shopId = await getShopId(false) || "";

    // ── STEP 1: PRE-SLUGGER ─────────────────────────────────────────────────
    // Normalize any variant name ("Terzi Salonu", "Moda Evi") → canonical slug ("terzi")
    // This prevents duplicate IndustryTemplate rows for the same sector.
    let canonicalSlug: string;
    const slugResult = await callGemini(shopId, [
        `Aşağıdaki sektör adını, farklı yazılışlardan bağımsız, veritabanında birleştirici bir canonical slug'a çevir.
Kurallar: sadece küçük harf İngilizce karakter, Türkçe/özel karakter yok, kelimeler tire ile birleşik, sadece kök/ana sektör.
Örnekler:
  "Terzi Salonu" → "terzi"
  "Moda Atölyesi" → "terzi"
  "Oto Yıkamacı" → "oto-yikama"
  "Araç Yıkama" → "oto-yikama"
  "Elektrik Ustası" → "elektrikci"
  "Bilgisayar Tamiri" → "bilgisayar-servisi"
  "Kuaför Salonu" → "kuafor"
SADECE slug metnini döndür (tırnak işareti olmadan, başka metin ekleme): ${sectorName}`
    ]);

    if ("error" in slugResult) {
        // Fallback: basic normalization without AI
        canonicalSlug = sectorName
            .toLowerCase()
            .replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i")
            .replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[üÜ]/g, "u")
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    } else {
        canonicalSlug = slugResult.text.trim().replace(/[^a-z0-9-]/g, '').slice(0, 64) || "genel";
    }

    // ── STEP 2: CACHE LOOKUP ────────────────────────────────────────────────
    const existing = await (prisma as any).industryTemplate.findUnique({ where: { slug: canonicalSlug } });
    if (existing) {
        console.log(`[INDUSTRY-CACHE-HIT] Returning cached template: ${canonicalSlug}`);
        return existing;
    }

    // ── STEP 3: MASTER_PROMPT — FULL TEMPLATE GENERATION ───────────────────
    const MASTER_PROMPT = `Sen dünyanın en iyi SaaS iş analisti ve UI/UX mimarısın. Sana verilen sektörü profesyonel bir dükkan yönetim yazılımı için tam bir "Sektör Şablonuna" dönüştüreceksin.

HEDEF SEKTÖR: ${sectorName}
CANONICAL SLUG: ${canonicalSlug}

### KRİTERLER:
1. TERMINOLOJİ: Menü isimleri esnafın anlayacağı dilden (Terzi için "Cihaz" değil "Tamirat", Oto Yıkama için "Araç Peron").
2. IKONLAR: Sadece Lucide React ikon isimleri (Wrench, Scissors, Car, Shirt, Box vb.).
3. WHATSAPP: Sektöre özel, profesyonel, {customer} {item} {price} {id} placeholder içeren Türkçe şablonlar.
4. DASHBOARD: Dükkan sahibinin sabah açtığında ilk görmek istediği istatistikler.
5. PRIMARY_COLOR: Bu sektörün ruhuna uygun bir HEX renk kodu. Örnekler: terzi → "#7c3aed", oto-yikama → "#0ea5e9", elektrik → "#f59e0b", kuafor → "#ec4899".

### JSON ÇIKTI FORMATI (sadece geçerli JSON, başka metin yok):
{
  "slug": "${canonicalSlug}",
  "displayName": "Sektörün Türkçe Tam Adı",
  "primaryColor": "#HEXKOD",
  "sidebar": [
    { "title": "Ana Sayfa", "icon": "LayoutDashboard", "path": "/dashboard" },
    { "title": "İş Takibi", "icon": "LucideIkon", "path": "/service" },
    { "title": "Kasa", "icon": "Wallet", "path": "/finance" },
    { "title": "Stok", "icon": "Package", "path": "/stock" }
  ],
  "serviceForm": {
    "title": "Kayıt Başlığı",
    "fields": [
      { "name": "item_name", "label": "Ürün/Hizmet Adı", "type": "text", "required": true },
      { "name": "description", "label": "İşlem Detayı", "type": "textarea" },
      { "name": "status", "label": "Durum", "type": "select", "options": ["Beklemede", "İşlemde", "Tamamlandı", "Teslim Edildi"] }
    ]
  },
  "whatsappTemplates": {
    "new_record": "Sayın {customer}, {item} kaydınız oluşturuldu. Takip No: {id}",
    "ready": "Sayın {customer}, {item} hazır. Teslim alabilirsiniz. Tutar: {price} TL",
    "reminder": "Sayın {customer}, yarınki randevunuzu hatırlatmak isteriz."
  },
  "dashboardStats": [
    { "label": "Aktif İşler", "key": "active_works", "color": "blue" },
    { "label": "Bugünkü Ciro", "key": "daily_revenue", "color": "green" }
  ]
}`;

    const result = await callGemini(shopId, [MASTER_PROMPT]);
    if ("error" in result) {
        throw new Error(result.error);
    }

    try {
        const config = JSON.parse(result.text);

        // ── STEP 4: UPSERT (safe against race conditions) ───────────────────
        const template = await (prisma as any).industryTemplate.upsert({
            where: { slug: canonicalSlug },
            update: {
                displayName: config.displayName || sectorName,
                sidebarConfig: config.sidebar || [],
                whatsappTemplates: config.whatsappTemplates || {},
                serviceFields: config.serviceForm || {},
                dashboardStats: config.dashboardStats || [],
                primaryColor: config.primaryColor || "#6366f1",
            },
            create: {
                slug: canonicalSlug,
                displayName: config.displayName || sectorName,
                sidebarConfig: config.sidebar || [],
                whatsappTemplates: config.whatsappTemplates || {},
                serviceFields: config.serviceForm || {},
                dashboardStats: config.dashboardStats || [],
                primaryColor: config.primaryColor || "#6366f1",
            }
        });

        console.log(`[INDUSTRY-TEMPLATE] Created/updated template: ${canonicalSlug} (color: ${template.primaryColor})`);
        return template;
    } catch (e: any) {
        console.error("Failed to parse or save AI config:", e);
        throw new Error(`Sektör şablonu işlenemedi: ${e.message}`);
    }
}



