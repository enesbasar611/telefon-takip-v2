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
 * Satırın bir tablo başlığı (Açıklama, Miktar, Fiyat, İskonto vb.) olup olmadığını tespit eder.
 */
export function isHeaderRow(lineText: string): boolean {
    const l = lineText.toLowerCase();
    const keywords = [
        "açıklama", "aciklama", "ürün", "urun", "model", "miktar", "adet",
        "fiyat", "iskonto", "indirim", "kdv", "tutar", "kategori", "marka",
        "tanım", "tanim", "barkod", "stok", "b.fiyat", "t.tutar"
    ];
    let matchCount = 0;
    for (const kw of keywords) {
        if (l.includes(kw)) matchCount++;
    }
    return matchCount >= 2;
}

/**
 * Satırın başlık, ara toplam, dipnot veya ayraç satırı olup olmadığını kontrol eder.
 */
export function isIgnoredRow(rowText: string): boolean {
    const lower = rowText.toLowerCase().trim();
    if (!lower) return true;

    // Sadece sıra numarası olan satırlar (örn: "1", "2", "3")
    if (/^\d{1,4}$/.test(lower)) return true;

    // Sadece yüzde/iskonto olan satırlar (örn: "%0,00", "%0", "%18", "%20")
    if (/^%?\s*\d+([,\.]\d+)?\s*%?$/.test(lower)) return true;

    // Ayraçlar ve başlıklar
    if (lower.startsWith("---") || lower.includes("--- ")) return true;
    if (lower.includes("ara toplam") || lower.includes("genel toplam") || lower.includes("toplamı")) return true;
    if (lower.includes("birim fiyat") && lower.includes("toplam tutar")) return true;
    if (lower.includes("fiyat ve stok listesi") || lower.includes("f?yat ve stok l?stes?")) return true;
    if (lower.includes("model / ürün tanımı") || lower.includes("model / rn tan?m?")) return true;

    // Tablo başlık satırları
    if (isHeaderRow(lower)) return true;

    // Fatura / Satış fişi başlık ve dipnot satırları
    if (lower.includes("güncel bakiyeniz") || lower.includes("guncel bakiye")) return true;
    if (lower.startsWith("net $") || lower.startsWith("net ₺") || lower.startsWith("net ") || lower.startsWith("toplam $") || lower.startsWith("toplam ₺") || lower.startsWith("toplam ")) return true;
    if (lower.includes("fişinizi kontrol") || lower.includes("fisinizi kontrol") || lower.includes("iade kabul") || lower.includes("servise yönlendirilir") || lower.includes("hayrını görünüz") || lower.includes("hayrini gorunuz")) return true;
    if (lower.includes("satış özet fişi") || lower.includes("satis ozet fisi") || lower.includes("satış işlemine ait") || lower.includes("satis islemine ait")) return true;
    if (lower.includes("akıllı saat gruplarında") || lower.includes("uzamaktadır") || lower.includes("uzamaktadir")) return true;
    if (lower.includes("bayroxtoptan") || lower.includes("bayrak elektronik") || lower.includes("webfone yazılım") || lower.includes("depo:yenimahalle")) return true;
    if (lower.startsWith("tarih:") || lower.includes("vade:") || lower.includes("kdv hariç") || lower.includes("kdv dahil")) return true;

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
        combined.includes("bluetooth kulaklık") || combined.includes("headphone") ||
        combined.includes("earphone") || combined.includes("earbuds") || combined.includes("buds")
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
 * Satırın saf bir fatura detay satırı (Miktar, Birim Fiyat, İskonto, KDV, Tutar)
 * olup olmadığını kontrol eder.
 */
function isDetailsLine(line: string): boolean {
    const l = line.trim();
    if (!l) return false;
    const hasQty = /\b\d+\s*(ad|adet|pcs|x)\b/i.test(l);
    const hasCurrencyOrPrice = /[$€₺]/.test(l) || /\b\d+[,\.]\d{2}\b/.test(l);
    if (!hasCurrencyOrPrice && !hasQty) return false;

    // Metinden fiyat, adet, yüzde ve ayraçları temizle
    const textWithoutPricesAndNumbers = l
        .replace(/[$€₺]/g, "")
        .replace(/\b\d+\s*(ad|adet|pcs|x)\b/gi, "")
        .replace(/%?\s*\d+([,\.]\d+)?\s*%?/g, "")
        .replace(/\b\d+([,\.]\d+)?\b/g, "")
        .replace(/[;\t|\/,]/g, " ")
        .trim();

    // Eğer geriye kalan harfli metin 5 karakterden kısaysa (veya yoksa) bu saf bir detay satırıdır!
    return textWithoutPricesAndNumbers.length <= 5;
}

/**
 * Fatura detay satırından miktar, birim fiyat ve toplam tutarı kusursuz biçimde ayıklar.
 * Türk para formatındaki ondalık virgülleri (%0,00 ile $ 10,75 gibi) birbirine karıştırmaz.
 */
function extractDetailsFromLine(detailsLine: string): {
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
} {
    let quantity = 1;
    // 1. Miktar ifadesini yakala ve satırdan temizle
    const qtyMatch = detailsLine.match(/\b(\d+)\s*(ad|adet|pcs|x)\b/i);
    let lineWithoutQty = detailsLine;
    if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10) || 1;
        lineWithoutQty = detailsLine.replace(qtyMatch[0], " ");
    }

    // 2. Yüzdeleri (%0,00, %0, %18 vb.) ve para birimlerini token bazında tara
    const tokens = lineWithoutQty.split(/\s+/).filter(Boolean);
    const priceCandidates: number[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i].trim();
        if (!tok) continue;
        if (tok.startsWith("%") || tok.endsWith("%")) continue;

        // Para simgesi tek başına geldiyse (örn: "$" ardından "10,75")
        if (/^[$€₺]$/.test(tok) && i + 1 < tokens.length) {
            const nextTok = tokens[i + 1].trim();
            if (/^\d+([,\.]\d+)?$/.test(nextTok)) {
                const price = cleanUsdPrice(nextTok);
                if (price > 0) {
                    priceCandidates.push(price);
                    i++;
                    continue;
                }
            }
        }

        // Simgeyle bitişik veya tek başına sayı (örn: "$10,75", "10,75", "21.50$")
        const price = cleanUsdPrice(tok);
        if (price > 0 && (tok.includes("$") || tok.includes("€") || tok.includes("₺") || /[,\.]/.test(tok))) {
            priceCandidates.push(price);
        }
    }

    let unitPrice = 0;
    let totalPrice = 0;

    if (priceCandidates.length >= 2) {
        const p1 = priceCandidates[0];
        const p2 = priceCandidates[priceCandidates.length - 1];
        if (quantity > 1 && Math.abs(p1 * quantity - p2) < 0.25) {
            unitPrice = p1;
            totalPrice = p2;
        } else if (p1 <= p2) {
            unitPrice = p1;
            totalPrice = p2;
        } else {
            unitPrice = p2;
            totalPrice = p1;
        }
    } else if (priceCandidates.length === 1) {
        unitPrice = priceCandidates[0];
        totalPrice = Number((unitPrice * quantity).toFixed(2));
    }

    return { quantity, unitPrice, totalPrice };
}

/**
 * Sekme (\t), noktalı virgül (;) veya dikey çizgi (|) ile ayrılmış tek bir satırı akıllıca analiz eder.
 * Sütunların sırası standart olmasa bile (Sıra; Ürün; Adet; Fiyat; İskonto) her sütunun rolünü tespit eder.
 */
function parseDelimitedRow(parts: string[], defaultMarkupUsd: number = 5): {
    name: string;
    quantity: number;
    buyPriceUsd: number;
    sellPriceUsd: number;
    category?: string;
    brand?: string;
} | null {
    let qty = 1;
    const prices: number[] = [];
    const textParts: string[] = [];

    for (let i = 0; i < parts.length; i++) {
        const rawPart = parts[i].trim();
        if (!rawPart) continue;

        // Yüzde / iskonto sütunları
        if (rawPart.startsWith("%") || rawPart.endsWith("%")) {
            continue;
        }

        // İlk sütunda pure sıra numarası (örn: "1")
        if (i === 0 && /^\d{1,4}$/.test(rawPart)) {
            continue;
        }

        // Miktar sütunu (örn: "2 ad", "2 adet", "5x" veya adet sayısı)
        const qm = rawPart.match(/^(\d+)\s*(ad|adet|pcs|x)?$/i);
        if (qm && (qm[2] || (parseInt(qm[1], 10) > 0 && parseInt(qm[1], 10) <= 1000 && (prices.length > 0 || i >= 2)))) {
            qty = parseInt(qm[1], 10) || 1;
            continue;
        }

        // Fiyat sütunu (örn: "$ 10,75", "10.75", "$21,50")
        if (/[$€₺]/.test(rawPart) || /^\d+[,\.]\d{2}$/.test(rawPart)) {
            const cp = cleanUsdPrice(rawPart);
            if (cp > 0) {
                prices.push(cp);
                continue;
            }
        }

        textParts.push(rawPart);
    }

    if (textParts.length === 0 || prices.length === 0) {
        return null;
    }

    let unitPrice = prices[0];
    if (prices.length >= 2) {
        const p1 = prices[0];
        const p2 = prices[prices.length - 1];
        if (qty > 1 && Math.abs(p1 * qty - p2) < 0.25) {
            unitPrice = p1;
        } else if (p1 <= p2) {
            unitPrice = p1;
        } else {
            unitPrice = p2;
        }
    }

    // Metin parçalarından en uzunu ürün adıdır
    textParts.sort((a, b) => b.length - a.length);
    const productName = textParts[0];

    if (productName.length < 3 || productName.startsWith("%")) {
        return null;
    }

    return {
        name: productName,
        quantity: Math.max(1, qty),
        buyPriceUsd: unitPrice,
        sellPriceUsd: Number((unitPrice + defaultMarkupUsd).toFixed(2))
    };
}

/**
 * Tek satırlı serbest metin (örn: "2 adet Bayrox Air Pro 2 Kulaklık $11.25" veya "iPhone 11 Ekran 25$")
 */
function parseFreeTextLine(line: string, defaultMarkupUsd: number = 5): {
    name: string;
    quantity: number;
    buyPriceUsd: number;
    sellPriceUsd: number;
} | null {
    let clean = line.trim();
    if (clean.length < 3) return null;

    // 1. Miktar yakalama (örn: "2 adet", "5x", "10 ad")
    let qty = 1;
    const qtyMatch = clean.match(/\b(\d+)\s*(ad|adet|pcs|x)\b/i) || clean.match(/^(\d+)x\s+/i);
    if (qtyMatch) {
        qty = parseInt(qtyMatch[1], 10) || 1;
        clean = clean.replace(qtyMatch[0], " ").trim();
    }

    // 2. Fiyat yakalama (Öncelik: Para birimi simgesi içeren)
    let price = 0;
    const currMatch = clean.match(/[$€₺]\s*(\d+(?:[,\.]\d+)?)|(\d+(?:[,\.]\d+)?)\s*[$€₺]/);
    if (currMatch) {
        const pStr = currMatch[1] || currMatch[2];
        price = cleanUsdPrice(pStr);
        clean = clean.replace(currMatch[0], " ").trim();
    } else {
        // Para simgesi yoksa ondalıklı sayı ara (örn: "11.25" veya "10,50")
        const decMatch = clean.match(/\b(\d+[,\.]\d{2})\b/);
        if (decMatch) {
            price = cleanUsdPrice(decMatch[1]);
            clean = clean.replace(decMatch[0], " ").trim();
        }
    }

    if (price <= 0) return null;

    // Kalan metni temizle
    clean = clean
        .replace(/^(\d+[\.\-\)]\s*)+/, "") // Baştaki "1. "
        .replace(/[$€₺]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (clean.length < 3 || clean.startsWith("%")) return null;

    return {
        name: clean,
        quantity: Math.max(1, qty),
        buyPriceUsd: price,
        sellPriceUsd: Number((price + defaultMarkupUsd).toFixed(2))
    };
}

/**
 * Ham metin, CSV, Excel kopyası veya PDF fatura metinlerini ayrıştırır.
 * Çok satırlı PDF faturaları (satır 1: Ürün Adı, satır 2: Adet & Fiyat),
 * noktalı virgüllü CSV tabloları ve WhatsApp mesaj formatlarını tam uyumlulukla çözer.
 * 
 * @param rawText Çok satırlı CSV veya metin girdisi
 * @param defaultMarkupUsd Ürün başına varsayılan satış fiyatı kârı ($) (Varsayılan: +$5.00)
 */
export function parseWholesalerRawText(
    rawText: string,
    defaultMarkupUsd: number = 5
): ParseWholesalerResult {
    const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items: ParsedWholesalerItem[] = [];
    let currentCategoryContext = "Yedek Parça";
    let skippedCount = 0;
    const usedIndices = new Set<number>();

    // 1. Önce satır satır temizlik ve filtreleme
    const filteredLines: { text: string; originalIndex: number }[] = [];
    for (let i = 0; i < rawLines.length; i++) {
        const l = rawLines[i];
        if (isIgnoredRow(l)) {
            skippedCount++;
        } else {
            filteredLines.push({ text: l, originalIndex: i });
        }
    }

    // Helper: Bir ayrıştırılmış ürünü standardize edip listeye ekleme
    const addParsedItem = (
        name: string,
        quantity: number,
        buyPriceUsd: number,
        sellPriceUsd: number,
        rawCategory?: string,
        brand?: string
    ) => {
        let cleanName = name.replace(/\(\+.*?eklendi\)/gi, "").trim();
        // İsimdeki gereksiz baştaki sıra numaralarını ve yüzdeleri temizle
        cleanName = cleanName.replace(/^(\d+[\.\-\)]\s*)+/, "").trim();

        if (cleanName.length < 3 || cleanName.startsWith("%")) return;

        const cleanCat = smartDetectCategory(cleanName, rawCategory || currentCategoryContext);
        if (cleanCat !== "Yedek Parça" && cleanCat !== "Aksesuar") {
            currentCategoryContext = cleanCat;
        }
        const detectedColor = detectColorInName(cleanName);
        const isScreen = cleanCat.includes("Ekran") || cleanCat.includes("LCD");
        const hasFrame = isScreen ? (cleanCat === "LCD / Ekran (Çıtalı)" || isFrameScreen(cleanName, cleanCat)) : undefined;
        const sku = generateProductSku(cleanName, cleanCat, brand);

        items.push({
            id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substr(2, 5)}`,
            sku,
            name: cleanName,
            category: cleanCat,
            brand: brand || undefined,
            quantity: Math.max(1, quantity),
            buyPriceUsd: Number(buyPriceUsd.toFixed(2)),
            sellPriceUsd: Number(sellPriceUsd.toFixed(2)),
            color: detectedColor,
            hasFrame,
            isColorSplit: false,
            selected: true,
        });
    };

    // 2. Çok Satırlı Blok Taraması (Örn: Satır 1: "LUCATECH LT-601 ENC TWS AİRPODS KULAKLIK", Satır 2: "2 ad $ 10,75 %0,00 %0 $ 21,50")
    for (let i = 0; i < filteredLines.length; i++) {
        if (usedIndices.has(i)) continue;
        const current = filteredLines[i];

        if (isDetailsLine(current.text)) {
            let nameIdx = -1;
            let productName = "";

            for (let j = i - 1; j >= 0; j--) {
                if (usedIndices.has(j)) continue;
                const prev = filteredLines[j];
                if (!isDetailsLine(prev.text)) {
                    const cleanCandidate = prev.text
                        .replace(/^(\d+[\.\-\)]\s*)+/, "")
                        .trim();
                    if (cleanCandidate.length >= 3 && !cleanCandidate.startsWith("%")) {
                        productName = cleanCandidate;
                        nameIdx = j;
                        break;
                    }
                }
            }

            if (productName && nameIdx !== -1) {
                const details = extractDetailsFromLine(current.text);
                if (details.unitPrice > 0) {
                    usedIndices.add(i);
                    usedIndices.add(nameIdx);

                    addParsedItem(
                        productName,
                        details.quantity,
                        details.unitPrice,
                        Number((details.unitPrice + defaultMarkupUsd).toFixed(2))
                    );
                    continue;
                }
            }
        }
    }

    // 3. Kalan Satırlarda Delimiter'lı Satırlar (Tab \t, Semicolon ;, Dikey Çizgi |)
    for (let i = 0; i < filteredLines.length; i++) {
        if (usedIndices.has(i)) continue;
        const line = filteredLines[i].text;

        let parts: string[] = [];
        if (line.includes("\t")) {
            parts = line.split("\t");
        } else if (line.includes(";")) {
            parts = line.split(";");
        } else if (line.includes("|")) {
            parts = line.split("|");
        }

        if (parts.length >= 2) {
            const parsed = parseDelimitedRow(parts, defaultMarkupUsd);
            if (parsed && parsed.buyPriceUsd > 0) {
                usedIndices.add(i);
                addParsedItem(
                    parsed.name,
                    parsed.quantity,
                    parsed.buyPriceUsd,
                    parsed.sellPriceUsd,
                    parsed.category,
                    parsed.brand
                );
                continue;
            }
        }
    }

    // 4. Kalan Satırlarda Tek Satırlı Serbest Format (Örn: "2 adet Bayrox Air Pro 2 Kulaklık $11.25" veya "iPhone 11 Ekran 25$")
    for (let i = 0; i < filteredLines.length; i++) {
        if (usedIndices.has(i)) continue;
        const line = filteredLines[i].text;

        const parsed = parseFreeTextLine(line, defaultMarkupUsd);
        if (parsed && parsed.buyPriceUsd > 0) {
            usedIndices.add(i);
            addParsedItem(
                parsed.name,
                parsed.quantity,
                parsed.buyPriceUsd,
                parsed.sellPriceUsd
            );
        }
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
