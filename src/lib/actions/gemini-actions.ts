"use server";

import { getCategories, getProducts } from "@/lib/actions/product-actions";
import prisma from "@/lib/prisma";

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
    const limited = categoryList.slice(0, 80);
    return `Sen bir telefon & teknik servis dükkanı yazılımının envanter asistanısın.

MEVCUT KATEGORİ AĞACI (id → name → parentId):
${JSON.stringify(limited, null, 2)}

HİYERARŞİK KATEGORİ VE EŞLEŞTİRME KURALLARI:
1. "categoryPath": Kökten yaprağa doğru isim veya ID listesi olmalı.
2. Eğer kullanıcı "Şarj Aletleri > Type-C > Samsung 25W" gibi bir yapı girdiyse, categoryPath: ["Şarj Aletleri", "Type-C"] olmalı.
3. Mevcut kategorilerle eşleşiyorsa ID'leri kullan, yeni bir kategori hiyerarşisi seziyorsan isimleri kullan.
4. "Şarj Aletleri > Type-C" girdisinde ürün adı "Samsung 25W" olmalı.
5. Fiyat: Alışta USD belirtilirse buyPriceUsd'ye yaz, buyPrice'ı 35 ile çarpıp TL yaz.
6. Belirtilmeyen stok: 1, kritik: 3.
7. confidence: "high", "medium", "low".
İstisnalar: Telefon ekleme önerilerinde bulunma (ama kullanıcı girerse işle).`;
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
- "Şarj Aletleri > Type-C > 20W" gibi hiyerarşik kategori tanımlarını her ürün için categoryPath olarak işle. categoryPath: ["kategori1", "kategori2"] listesi döndür.
- "alış X satış Y" işlemleri: Eğer alış dolar ise (örn. 1.5 dolar), buyPriceUsd: 1.5 yaz, buyPrice (TL maliyeti) için doları 35 ile çarp (52.5). Satış her zaman sellPrice. Döviz belirtilmemişse buyPriceUsd: null.
- Belirsiz modeller için makul isimler üret
- categoryId: null bırak, SADECE categoryPath (isim listesi) döndür (kategoriler review adımında eşleştirilecek veya oluşturulacak)`;

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
    location?: string;
    reason: string;
    status: "Halledildi" | "Eksik Veri";
}

export interface AIUpdateResponse {
    updates: AIUpdateOperation[];
    warnings: string[];
    affectedCount: number;
    summary: string;
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

    const intentResult = await callGemini([intentPrompt]);
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

GÖREVLER:
- updateProductLocation: Ürünlerin raf bilgisini (location) değiştirir.
- bulkPriceUpdate: Ürünlerin fiyatlarını günceller.
- bulkStockUpdate: Stok miktarlarını günceller.

SADECE GEÇERLİ JSON DÖNDÜR:\n${schema}`;

    const userPrompt = `GÜNCELLEME KOMUTU:\n${command}`;

    const result = await callGemini([systemPrompt, userPrompt]);
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
