/**
 * Toptancı Liste Ayrıştırıcı (Wholesaler List Parser)
 * CSV (noktalı virgül, virgül, sekme), Excel ve kopyalanan ham metin formatlarını
 * temizleyerek yapılandırılmış ürün listesine dönüştürür.
 */

export interface ParsedWholesalerItem {
    id: string; // İstemcide benzersiz geçici kimlik
    sku?: string; // Ürünle alakalı rastgele stok kodu (örn: KPK-IPH11-482)
    name: string; // Net ürün adı (örn: "iPhone 11 Arka Kapak")
    category: string; // "Kapak", "LCD / Ekran", "LCD / Ekran (Çıtalı)" vb.
    brand?: string; // "Apple (iPhone)", "Samsung" vb.
    quantity: number; // Giriş adedi
    buyPriceUsd: number; // Alış birim fiyatı ($)
    sellPriceUsd: number; // Satış birim fiyatı ($)
    color?: string; // "Siyah", "Beyaz" vb. (varsa)
    hasFrame?: boolean; // Çıtalı ekran mı? (WF - With Frame)
    isColorSplit?: boolean; // Renklere ayrılmış satır mı?
    parentItemId?: string; // Hangi ana satırdan bölündüğü
    selected?: boolean; // İçe aktarılmak üzere seçili mi?
}

export interface ParseWholesalerResult {
    items: ParsedWholesalerItem[];
    totalQuantity: number;
    totalBuyUsd: number;
    skippedCount: number;
}

// Popüler renk anahtar kelimeleri
export const KNOWN_COLORS = [
    "Siyah", "Beyaz", "Mavi", "Gece Mavisi", "Kırmızı", "Yeşil",
    "Mor", "Altın", "Gold", "Gümüş", "Silver", "Gri", "Grafit",
    "Pembe", "Sarı", "Turuncu", "Lacivert", "Titanium", "Titanyum"
];

/**
 * Fiyat metninden sayısal dolar tutarını ayıklar.
 * Örn: "$2,00" -> 2.00, "$1.581,51" -> 1581.51, "26.50" -> 26.50
 */
export function cleanUsdPrice(val: any): number {
    if (typeof val === "number") return isNaN(val) ? 0 : Number(val.toFixed(2));
    if (!val) return 0;

    let str = String(val).trim();
    // $ işaretini ve boşlukları kaldır
    str = str.replace(/[$€₺\s]/g, "");

    // Eğer binlik ayraç nokta, ondalık virgül ise (örn: 1.581,51)
    if (str.includes(".") && str.includes(",")) {
        str = str.replace(/\./g, "").replace(",", ".");
    } else if (str.includes(",")) {
        // Sadece virgül varsa (örn: 2,50 veya 14,00)
        str = str.replace(",", ".");
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
}

/**
 * Ürün adından varsa bilinen rengi tespit eder.
 */
export function detectColorInName(name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const color of KNOWN_COLORS) {
        const regex = new RegExp(`\\b${color.toLowerCase()}\\b`, "i");
        if (regex.test(lower)) {
            return color;
        }
    }
    return undefined;
}

/**
 * Satırın başlık, ara toplam veya ayraç satırı olup olmadığını kontrol eder.
 */
function isIgnoredRow(rowText: string): boolean {
    const lower = rowText.toLowerCase().trim();
    if (!lower) return true;

    // Ayraçlar ve başlıklar
    if (lower.startsWith("---") || lower.includes("--- ")) return true;
    if (lower.includes("ara toplam") || lower.includes("genel toplam") || lower.includes("toplamı")) return true;
    if (lower.includes("birim fiyat") && lower.includes("toplam tutar")) return true;
    if (lower.includes("fiyat ve stok listesi") || lower.includes("f?yat ve stok l?stes?")) return true;
    if (lower.includes("model / ürün tanımı") || lower.includes("model / rn tan?m?")) return true;

    return false;
}

/**
 * Ürün adı, marka ve kategoriden anlamlı, okunaklı ve benzersiz bir stok kodu (SKU) üretir.
 * Örnek: "iPhone 11 Arka Kapak" -> "KPK-IPH11-482"
 * "DE Iph 11 Pro Hard Oled Ekran WF" -> "EKR-WF-IPH11P-632"
 */
export function generateProductSku(productName: string, category: string, brand?: string): string {
    let catPrefix = "STK";
    const c = (category || "").toLowerCase();
    if (c.includes("çıtalı") || c.includes("citali") || c.includes("wf")) {
        catPrefix = "EKR-WF";
    } else if (c.includes("ekran") || c.includes("lcd")) {
        catPrefix = "EKR";
    } else if (c.includes("kapak")) {
        catPrefix = "KPK";
    } else if (c.includes("batarya") || c.includes("pil")) {
        catPrefix = "BAT";
    } else if (c.includes("soket")) {
        catPrefix = "SOK";
    } else if (c.includes("kamera")) {
        catPrefix = "KAM";
    } else if (c.includes("kasa")) {
        catPrefix = "KAS";
    } else if (c.includes("flex")) {
        catPrefix = "FLX";
    } else if (c.includes("hoparlör") || c.includes("ahize")) {
        catPrefix = "SES";
    } else if (c.includes("set şarj")) {
        catPrefix = "SARJ-S";
    } else if (c.includes("şarj başlığı")) {
        catPrefix = "SARJ-B";
    } else if (c.includes("type-c")) {
        catPrefix = "KBL-TC";
    } else if (c.includes("lightning")) {
        catPrefix = "KBL-LT";
    } else if (c.includes("kablo")) {
        catPrefix = "KBL";
    } else if (c.includes("kılıf")) {
        catPrefix = "KLF";
    } else if (c.includes("ekran koruyucu") || c.includes("cam")) {
        catPrefix = "CAM";
    } else if (c.includes("kulaklık")) {
        catPrefix = "KLK";
    } else if (c.includes("powerbank")) {
        catPrefix = "PWR";
    }

    // Temizleme ve kısaltma
    let p = (productName || "")
        .replace(/---.*?---/g, "")
        .replace(/\b(arka kapak|full kapak|lensli kapak|kapak|batarya|hard oled|soft oled|oled|amoled|incell|servis|ekran|lcd|lumix|mosgoo|alfa|hk|org|diognastic|diagnostic|full)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Özel kısaltmalar
    p = p.replace(/\biphone\b/gi, "IPH")
         .replace(/\bredmi note\b/gi, "RN")
         .replace(/\bredmi\b/gi, "RDM")
         .replace(/\bsamsung\b/gi, "SAM")
         .replace(/\bpro max\b/gi, "PM")
         .replace(/\bpro\b/gi, "P");

    let modelCode = p.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (modelCode.length > 6) {
        modelCode = modelCode.substring(0, 6);
    }
    if (!modelCode) modelCode = "MDL";

    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${catPrefix}-${modelCode}-${randomNum}`;
}

/**
 * Ekranın çıtalı ("WF" - With Frame / Kasalı) olup olmadığını tespit eder.
 */
export function isFrameScreen(name: string, rawCat?: string): boolean {
    const combined = `${rawCat || ""} ${name || ""}`.toLowerCase();
    // WF ayrımı: \bwf\b veya w/f veya with frame veya çıtalı / kasalı
    return (
        /\b(wf|w\/f)\b/i.test(combined) ||
        combined.includes("with frame") ||
        combined.includes("çitalı") ||
        combined.includes("çıtalı") ||
        combined.includes("citali") ||
        combined.includes("kasalı") ||
        combined.includes("kasali")
    );
}

export const STANDARD_CATEGORIES = [
    // Yedek Parça
    "LCD / Ekran",
    "LCD / Ekran (Çıtalı)",
    "Kapak",
    "Batarya",
    "Şarj Soketi",
    "Kamera",
    "Kasa",
    "Flex / Entegre",
    "Hoparlör / Ahize",
    "Yedek Parça",
    // Aksesuar
    "Şarj Başlığı",
    "Set Şarj",
    "Type-C Kablo",
    "Lightning Kablo",
    "Kablo",
    "Kılıf",
    "Ekran Koruyucu",
    "Kulaklık",
    "Powerbank",
    "Araç Aksesuarı",
    "Aksesuar",
];

/**
 * Ürün adı ve toptancı kategori başlığını analiz ederek akıllı kategorize eder.
 * Yedek parça (Kapak, Ekran vb.) ile Aksesuar (Şarj Başlığı, Set Şarj, Type-C Kablo vb.)
 * ayrımını yüksek doğrulukla yapar.
 */
export function smartDetectCategory(productName: string, rawCat?: string): string {
    const p = (productName || "").toLowerCase();
    const c = (rawCat || "").toLowerCase();
    const combined = `${c} ${p}`;

    // 1. AKSESUARLAR:
    // Set Şarj (Başlık + Kablo Seti)
    if (
        combined.includes("set şarj") || combined.includes("şarj set") ||
        combined.includes("hızlı şarj set") || combined.includes("adaptör set") ||
        (combined.includes("set") && (combined.includes("şarj") || combined.includes("kablo")))
    ) {
        return "Set Şarj";
    }

    // Şarj Başlığı (Adaptör)
    if (
        combined.includes("şarj başlığ") || combined.includes("şarj baslig") ||
        combined.includes("adaptör") || combined.includes("adapter") ||
        combined.includes("şarj aleti") || combined.includes("sarj aleti") ||
        combined.includes("şarj cihazı") || combined.includes("gan şarj") ||
        (/\b(20w|25w|30w|33w|45w|65w|67w|100w|120w)\b/i.test(p) && !combined.includes("soket") && !combined.includes("bord"))
    ) {
        if (!combined.includes("kablo") && !combined.includes("soket") && !combined.includes("bord")) {
            return "Şarj Başlığı";
        }
    }

    // Type-C Kablo
    if (
        combined.includes("type-c") || combined.includes("type c") ||
        combined.includes("usb-c") || combined.includes("usb c")
    ) {
        if (!combined.includes("soket") && !combined.includes("bord") && !combined.includes("flex")) {
            return "Type-C Kablo";
        }
    }

    // Lightning Kablo
    if (combined.includes("lightning") || (combined.includes("iphone") && combined.includes("kablo"))) {
        return "Lightning Kablo";
    }

    // Genel Kablo
    if (combined.includes("kablo") && !combined.includes("soket") && !combined.includes("flex")) {
        return "Kablo";
    }

    // Kılıf
    if (
        combined.includes("kılıf") || combined.includes("kilif") ||
        combined.includes("magsafe kılıf") || combined.includes("silikon kılıf") ||
        combined.includes("tank kılıf") || combined.includes("case")
    ) {
        return "Kılıf";
    }

    // Ekran Koruyucu (Kırılmaz Cam)
    if (
        combined.includes("kırılmaz cam") || combined.includes("kirilmaz cam") ||
        combined.includes("hayalet cam") || combined.includes("nano cam") ||
        combined.includes("seramik cam") || combined.includes("ekran koruyucu") ||
        combined.includes("lens koruyucu")
    ) {
        return "Ekran Koruyucu";
    }

    // Kulaklık
    if (
        combined.includes("kulaklık") || combined.includes("kulaklik") ||
        combined.includes("airpods") || combined.includes("tws") ||
        combined.includes("bluetooth kulaklık") || combined.includes("headphone")
    ) {
        return "Kulaklık";
    }

    // Powerbank
    if (combined.includes("powerbank") || combined.includes("power bank") || combined.includes("taşınabilir şarj")) {
        return "Powerbank";
    }

    // Araç Aksesuarı
    if (combined.includes("araç tutucu") || combined.includes("araç şarj") || combined.includes("oto şarj")) {
        return "Araç Aksesuarı";
    }

    // 2. YEDEK PARÇALAR:
    // Kapak (Arka Kapak)
    if (
        combined.includes("arka kapak") || combined.includes("lensli kapak") ||
        combined.includes("full kapak") || combined.includes("pil kapağı") ||
        combined.includes("kapak")
    ) {
        return "Kapak";
    }

    // LCD / Ekran (Çıtalı / Çıtasız WF Ayrımı)
    if (
        combined.includes("lcd") || combined.includes("ekran") ||
        combined.includes("oled") || combined.includes("amoled") ||
        combined.includes("incell") || combined.includes("servis ekran") ||
        combined.includes("dokunmatik") || combined.includes("hk servis")
    ) {
        if (isFrameScreen(productName, rawCat)) {
            return "LCD / Ekran (Çıtalı)";
        }
        return "LCD / Ekran";
    }

    // Batarya / Pil
    if (combined.includes("batarya") || combined.includes("pil") || combined.includes("battery")) {
        return "Batarya";
    }

    // Şarj Soketi / Alt Bord
    if (
        combined.includes("soket") || combined.includes("şarj bord") ||
        combined.includes("şarj board") || combined.includes("sub board") ||
        combined.includes("alt bord") || (combined.includes("şarj") && combined.includes("flex"))
    ) {
        return "Şarj Soketi";
    }

    // Kamera / Lens
    if (combined.includes("kamera") || combined.includes("lens")) {
        return "Kamera";
    }

    // Kasa / Orta Kasa
    if (combined.includes("kasa") || combined.includes("housing") || combined.includes("frame")) {
        return "Kasa";
    }

    // Flex / Entegre
    if (combined.includes("flex") || combined.includes("entegre") || combined.includes("bga")) {
        return "Flex / Entegre";
    }

    // Hoparlör / Buzzer / Ahize
    if (combined.includes("buzzer") || combined.includes("hoparlör") || combined.includes("ahize")) {
        return "Hoparlör / Ahize";
    }

    // Son çare rawCat'i kontrol et
    if (c.includes("kapak")) return "Kapak";
    if (c.includes("lcd") || c.includes("ekran")) return "LCD / Ekran";
    if (c.includes("aksesuar")) return "Aksesuar";

    return rawCat ? rawCat.trim() : "Yedek Parça";
}

/**
 * Ham metin veya CSV satırlarını ayrıştırır.
 * @param rawText Çok satırlı CSV veya metin girdisi
 * @param defaultMarkupUsd Ürün başına varsayılan satış fiyatı kârı ($) (Varsayılan: +$5.00)
 */
export function parseWholesalerRawText(
    rawText: string,
    defaultMarkupUsd: number = 5
): ParseWholesalerResult {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items: ParsedWholesalerItem[] = [];
    let currentCategoryContext = "Yedek Parça";
    let skippedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (isIgnoredRow(line)) {
            // Başlık satırı bir kategori grubu olabilir: örn. "KAPAKLAR (ARKA KAPAKLAR)" veya "LCD VE EKRANLAR"
            const upper = line.toUpperCase();
            if (upper.includes("KAPAK")) currentCategoryContext = "Kapak";
            else if (upper.includes("LCD") || upper.includes("EKRAN")) currentCategoryContext = "LCD / Ekran";
            skippedCount++;
            continue;
        }

        // Ayırıcı karakteri belirle: noktalı virgül (;), virgül (,) veya sekme (\t)
        let parts: string[] = [];
        if (line.includes(";")) {
            parts = line.split(";").map(p => p.trim());
        } else if (line.includes("\t")) {
            parts = line.split("\t").map(p => p.trim());
        } else if (line.includes(",") && (line.match(/,/g) || []).length >= 3) {
            parts = line.split(",").map(p => p.trim());
        } else {
            // Boşlukla ayrılmış serbest metin denemesi
            skippedCount++;
            continue;
        }

        // Toptancı formatı sütunları:
        // [0]: Kategori (örn: Kapak, LCD / Ekran)
        // [1]: Marka (örn: Apple (iPhone), Samsung)
        // [2]: Model / Ürün Tanımı (örn: iPhone 11 Arka Kapak)
        // [3]: Adet (örn: 2)
        // [4]: Birim Fiyat ($) (örn: $2,00)
        // [5]: Toplam Tutar ($) (örn: $4,00)

        let category = "";
        let brand = "";
        let productName = "";
        let quantity = 1;
        let buyPriceUsd = 0;

        if (parts.length >= 5) {
            category = parts[0] || currentCategoryContext;
            brand = parts[1] || "";
            productName = parts[2] || "";
            quantity = parseInt(parts[3], 10) || 1;
            buyPriceUsd = cleanUsdPrice(parts[4]);
        } else if (parts.length >= 3) {
            // Daha kısa format: [Ürün Adı, Adet, Fiyat]
            productName = parts[0];
            quantity = parseInt(parts[1], 10) || 1;
            buyPriceUsd = cleanUsdPrice(parts[2]);
            category = currentCategoryContext;
        } else {
            skippedCount++;
            continue;
        }

        // Ürün adı veya fiyat geçersizse atla
        if (!productName || productName.startsWith("---") || buyPriceUsd <= 0) {
            skippedCount++;
            continue;
        }

        // Ürün adını temizle (marka tekrarı veya gereksiz karakterler)
        let cleanName = productName
            .replace(/\(\+.*?eklendi\)/gi, "") // örn: (+1 adet eklendi) notlarını temizle
            .trim();

        // Kategori akıllı tespiti (Ürün adı ve toptancı kategorisini birlikte analiz eder)
        const cleanCat = smartDetectCategory(cleanName, category || currentCategoryContext);
        if (cleanCat !== "Yedek Parça" && cleanCat !== "Aksesuar") {
            currentCategoryContext = cleanCat;
        }

        // Rengi algıla
        const detectedColor = detectColorInName(cleanName);

        // Ekran ve Çıtalı kontrolü
        const isScreen = cleanCat.includes("Ekran") || cleanCat.includes("LCD");
        const hasFrame = isScreen ? (cleanCat === "LCD / Ekran (Çıtalı)" || isFrameScreen(cleanName, category || currentCategoryContext)) : undefined;

        const sellPriceUsd = Number((buyPriceUsd + defaultMarkupUsd).toFixed(2));
        const sku = generateProductSku(cleanName, cleanCat, brand);

        items.push({
            id: `item-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            sku,
            name: cleanName,
            category: cleanCat,
            brand: brand || undefined,
            quantity: Math.max(1, quantity),
            buyPriceUsd,
            sellPriceUsd,
            color: detectedColor,
            hasFrame,
            isColorSplit: false,
            selected: true,
        });
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalBuyUsd = Number(items.reduce((sum, item) => sum + (item.buyPriceUsd * item.quantity), 0).toFixed(2));

    return {
        items,
        totalQuantity,
        totalBuyUsd,
        skippedCount,
    };
}
