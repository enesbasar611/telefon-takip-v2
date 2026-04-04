/**
 * Data Standardization Helper Functions (The Constitution)
 * Ensures consistent formatting across the application using Turkish locale support.
 */

const TR_LOCALE = 'tr-TR';

/**
 * BRAND_EXCEPTIONS: Keeps specific product branding intact.
 */
const BRAND_EXCEPTIONS: Record<string, string> = {
    iphone: "iPhone",
    ipad: "iPad",
    ios: "iOS",
    macos: "macOS",
    imac: "iMac",
    ipod: "iPod",
};

/**
 * Title Case (Product/Device Names)
 * First letter of each word uppercase, rest lowercase.
 * Special branding like "iPhone" is preserved.
 * @example "iphone 15 pro max" -> "iPhone 15 Pro Max"
 */
export const formatTitleCase = (text: string): string => {
    if (!text) return "";
    return text
        .split(/\s+/)
        .map((word) => {
            const lower = word.toLocaleLowerCase(TR_LOCALE);
            if (BRAND_EXCEPTIONS[lower]) return BRAND_EXCEPTIONS[lower];
            return word.charAt(0).toLocaleUpperCase(TR_LOCALE) + word.slice(1).toLocaleLowerCase(TR_LOCALE);
        })
        .join(" ");
};

/**
 * Proper Case (Customer Names)
 * Capitalizes the first letter of each word.
 * @example "enes başar" -> "Enes Başar"
 */
export const formatProperCase = (text: string): string => {
    if (!text) return "";
    return text
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toLocaleUpperCase(TR_LOCALE) + word.slice(1).toLocaleLowerCase(TR_LOCALE))
        .join(" ");
};

/**
 * Sentence Case (Descriptions & Notes)
 * Capitalizes only the first letter of the first word in each sentence.
 * @example "EKRAN DEĞİŞTİ. KASA TEMİZ." -> "Ekran değişti. Kasa temiz."
 */
export const formatSentenceCase = (text: string): string => {
    if (!text) return "";
    const cleaned = text.toLocaleLowerCase(TR_LOCALE).trim();
    // Split by sentence terminators (. ! ?)
    return cleaned.replace(/(^\w|\.\s+\w|!\s+\w|\?\s+\w)/g, (match) =>
        match.toLocaleUpperCase(TR_LOCALE)
    );
};

/**
 * Uppercase (Technical Codes & IMEI)
 * Converts everything to uppercase.
 * @example "tr" -> "TR", "imei123" -> "IMEI123"
 */
export const formatUppercase = (text: string): string => {
    if (!text) return "";
    return text.trim().toLocaleUpperCase(TR_LOCALE);
};

/**
 * Global Form Data Cleaner
 * A utility to clean a whole object based on field rules.
 */
export const cleanFormData = <T extends Record<string, any>>(
    data: T,
    rules: Partial<Record<keyof T, "title" | "proper" | "sentence" | "upper">>
): T => {
    const cleaned = { ...data };
    for (const [key, rule] of Object.entries(rules)) {
        if (cleaned[key] && typeof cleaned[key] === "string") {
            switch (rule) {
                case "title":
                    cleaned[key as keyof T] = formatTitleCase(cleaned[key]) as any;
                    break;
                case "proper":
                    cleaned[key as keyof T] = formatProperCase(cleaned[key]) as any;
                    break;
                case "sentence":
                    cleaned[key as keyof T] = formatSentenceCase(cleaned[key]) as any;
                    break;
                case "upper":
                    cleaned[key as keyof T] = formatUppercase(cleaned[key]) as any;
                    break;
            }
        }
    }
    return cleaned;
};
