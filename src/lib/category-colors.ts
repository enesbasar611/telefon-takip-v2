// Unified Category Border & Color Palette
// Subtle, non-neon, elegant category colors matching standard 1px border lines

export interface CategoryTheme {
    key: string;
    // Card border classes for standard Bento & Compact List mode
    cardBorder: string;
    // Badge border & text inside the card
    badge: string;
    // Horizontal category rail pill (Inactive state)
    pillInactive: string;
    // Horizontal category rail pill (Active selected state)
    pillActive: string;
    // Icon badge background inside compact list
    iconWrapper: string;
    // Micro add button (+ Ekle)
    addButton: string;
    // Text accent
    accentText: string;
}

export const CATEGORY_PALETTES: CategoryTheme[] = [
    // 0. Blue (Cihaz, Telefon, etc.)
    {
        key: "blue",
        cardBorder: "border-blue-500/25 dark:border-blue-400/25 hover:border-blue-500/55 dark:hover:border-blue-400/50",
        badge: "border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10",
        pillInactive: "border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10",
        pillActive: "bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/20",
        iconWrapper: "border-blue-500/25 bg-blue-500/5 text-blue-600 dark:text-blue-400 group-hover:border-blue-500/40 group-hover:bg-blue-500/10",
        addButton: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600",
        accentText: "text-blue-600 dark:text-blue-400"
    },
    // 1. Violet / Purple (Aksesuar, Kılıf, etc.)
    {
        key: "violet",
        cardBorder: "border-violet-500/25 dark:border-violet-400/25 hover:border-violet-500/55 dark:hover:border-violet-400/50",
        badge: "border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-500/10",
        pillInactive: "border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-500/5 hover:border-violet-500/50 hover:bg-violet-500/10",
        pillActive: "bg-violet-600 text-white border-violet-600 shadow-xs shadow-violet-500/20",
        iconWrapper: "border-violet-500/25 bg-violet-500/5 text-violet-600 dark:text-violet-400 group-hover:border-violet-500/40 group-hover:bg-violet-500/10",
        addButton: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600",
        accentText: "text-violet-600 dark:text-violet-400"
    },
    // 2. Emerald / Green (Ekran, Panel, etc.)
    {
        key: "emerald",
        cardBorder: "border-emerald-500/25 dark:border-emerald-400/25 hover:border-emerald-500/55 dark:hover:border-emerald-400/50",
        badge: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
        pillInactive: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10",
        pillActive: "bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-500/20",
        iconWrapper: "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10",
        addButton: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600",
        accentText: "text-emerald-600 dark:text-emerald-400"
    },
    // 3. Amber / Gold (Şarj, Kablo, Adaptör, etc.)
    {
        key: "amber",
        cardBorder: "border-amber-500/25 dark:border-amber-400/25 hover:border-amber-500/55 dark:hover:border-amber-400/50",
        badge: "border-amber-500/30 text-amber-800 dark:text-amber-300 bg-amber-500/10",
        pillInactive: "border-amber-500/30 text-amber-800 dark:text-amber-300 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10",
        pillActive: "bg-amber-600 text-white border-amber-600 shadow-xs shadow-amber-500/20",
        iconWrapper: "border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400 group-hover:border-amber-500/40 group-hover:bg-amber-500/10",
        addButton: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600",
        accentText: "text-amber-600 dark:text-amber-400"
    },
    // 4. Sky / Cyan (Bilgisayar, Tablet, etc.)
    {
        key: "sky",
        cardBorder: "border-sky-500/25 dark:border-sky-400/25 hover:border-sky-500/55 dark:hover:border-sky-400/50",
        badge: "border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/10",
        pillInactive: "border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/5 hover:border-sky-500/50 hover:bg-sky-500/10",
        pillActive: "bg-sky-600 text-white border-sky-600 shadow-xs shadow-sky-500/20",
        iconWrapper: "border-sky-500/25 bg-sky-500/5 text-sky-600 dark:text-sky-400 group-hover:border-sky-500/40 group-hover:bg-sky-500/10",
        addButton: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600",
        accentText: "text-sky-600 dark:text-sky-400"
    },
    // 5. Rose / Coral (Kulaklık, Ses, Hoparlör, etc.)
    {
        key: "rose",
        cardBorder: "border-rose-500/25 dark:border-rose-400/25 hover:border-rose-500/55 dark:hover:border-rose-400/50",
        badge: "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10",
        pillInactive: "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/5 hover:border-rose-500/50 hover:bg-rose-500/10",
        pillActive: "bg-rose-600 text-white border-rose-600 shadow-xs shadow-rose-500/20",
        iconWrapper: "border-rose-500/25 bg-rose-500/5 text-rose-600 dark:text-rose-400 group-hover:border-rose-500/40 group-hover:bg-rose-500/10",
        addButton: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600",
        accentText: "text-rose-600 dark:text-rose-400"
    },
    // 6. Indigo (Elektronik, Akıllı Cihazlar, etc.)
    {
        key: "indigo",
        cardBorder: "border-indigo-500/25 dark:border-indigo-400/25 hover:border-indigo-500/55 dark:hover:border-indigo-400/50",
        badge: "border-indigo-500/30 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10",
        pillInactive: "border-indigo-500/30 text-indigo-700 dark:text-indigo-300 bg-indigo-500/5 hover:border-indigo-500/50 hover:bg-indigo-500/10",
        pillActive: "bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-500/20",
        iconWrapper: "border-indigo-500/25 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10",
        addButton: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600",
        accentText: "text-indigo-600 dark:text-indigo-400"
    },
    // 7. Teal / Mint (Batarya, Güç, etc.)
    {
        key: "teal",
        cardBorder: "border-teal-500/25 dark:border-teal-400/25 hover:border-teal-500/55 dark:hover:border-teal-400/50",
        badge: "border-teal-500/30 text-teal-700 dark:text-teal-300 bg-teal-500/10",
        pillInactive: "border-teal-500/30 text-teal-700 dark:text-teal-300 bg-teal-500/5 hover:border-teal-500/50 hover:bg-teal-500/10",
        pillActive: "bg-teal-600 text-white border-teal-600 shadow-xs shadow-teal-500/20",
        iconWrapper: "border-teal-500/25 bg-teal-500/5 text-teal-600 dark:text-teal-400 group-hover:border-teal-500/40 group-hover:bg-teal-500/10",
        addButton: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600",
        accentText: "text-teal-600 dark:text-teal-400"
    },
    // 8. Orange (Yedek Parça, Teknik Part, etc.)
    {
        key: "orange",
        cardBorder: "border-orange-500/25 dark:border-orange-400/25 hover:border-orange-500/55 dark:hover:border-orange-400/50",
        badge: "border-orange-500/30 text-orange-800 dark:text-orange-300 bg-orange-500/10",
        pillInactive: "border-orange-500/30 text-orange-800 dark:text-orange-300 bg-orange-500/5 hover:border-orange-500/50 hover:bg-orange-500/10",
        pillActive: "bg-orange-600 text-white border-orange-600 shadow-xs shadow-orange-500/20",
        iconWrapper: "border-orange-500/25 bg-orange-500/5 text-orange-600 dark:text-orange-400 group-hover:border-orange-500/40 group-hover:bg-orange-500/10",
        addButton: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600",
        accentText: "text-orange-600 dark:text-orange-400"
    },
    // 9. Fuchsia (Kasa, Cam, Ekran Koruyucu, etc.)
    {
        key: "fuchsia",
        cardBorder: "border-fuchsia-500/25 dark:border-fuchsia-400/25 hover:border-fuchsia-500/55 dark:hover:border-fuchsia-400/50",
        badge: "border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/10",
        pillInactive: "border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/5 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10",
        pillActive: "bg-fuchsia-600 text-white border-fuchsia-600 shadow-xs shadow-fuchsia-500/20",
        iconWrapper: "border-fuchsia-500/25 bg-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-400 group-hover:border-fuchsia-500/40 group-hover:bg-fuchsia-500/10",
        addButton: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20 group-hover:bg-fuchsia-600 group-hover:text-white group-hover:border-fuchsia-600",
        accentText: "text-fuchsia-600 dark:text-fuchsia-400"
    },
    // 10. Cyan (Hizmet, Yazılım, Teknik, etc.)
    {
        key: "cyan",
        cardBorder: "border-cyan-500/25 dark:border-cyan-400/25 hover:border-cyan-500/55 dark:hover:border-cyan-400/50",
        badge: "border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10",
        pillInactive: "border-cyan-500/30 text-cyan-700 dark:text-cyan-300 bg-cyan-500/5 hover:border-cyan-500/50 hover:bg-cyan-500/10",
        pillActive: "bg-cyan-600 text-white border-cyan-600 shadow-xs shadow-cyan-500/20",
        iconWrapper: "border-cyan-500/25 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10",
        addButton: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600",
        accentText: "text-cyan-600 dark:text-cyan-400"
    },
    // 11. Slate (Genel, Diğer, etc.)
    {
        key: "slate",
        cardBorder: "border-slate-500/25 dark:border-slate-400/25 hover:border-slate-500/55 dark:hover:border-slate-400/50",
        badge: "border-slate-500/30 text-slate-700 dark:text-slate-300 bg-slate-500/10",
        pillInactive: "border-slate-500/30 text-slate-700 dark:text-slate-300 bg-slate-500/5 hover:border-slate-500/50 hover:bg-slate-500/10",
        pillActive: "bg-slate-700 text-white border-slate-700 shadow-xs shadow-slate-500/20",
        iconWrapper: "border-slate-500/25 bg-slate-500/5 text-slate-600 dark:text-slate-400 group-hover:border-slate-500/40 group-hover:bg-slate-500/10",
        addButton: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 group-hover:bg-slate-700 group-hover:text-white group-hover:border-slate-700",
        accentText: "text-slate-600 dark:text-slate-400"
    }
];

// Keyword-based association map for intuitive default colors
const KEYWORD_MAP: Array<{ keywords: string[]; paletteIndex: number }> = [
    { keywords: ["telefon", "iphone", "samsung", "redmi", "xiaomi", "cihaz", "huawei", "poco"], paletteIndex: 0 }, // Blue
    { keywords: ["aksesuar", "kılıf", "kapak", "glass", "cam", "kırılmaz"], paletteIndex: 1 }, // Violet
    { keywords: ["ekran", "lcd", "panel", "fhd", "hd", "oled"], paletteIndex: 2 }, // Emerald
    { keywords: ["şarj", "kablo", "adaptör", "type-c", "lightning", "usb", "powerbank", "başlık"], paletteIndex: 3 }, // Amber
    { keywords: ["bilgisayar", "laptop", "tablet", "ipad", "mouse", "klavye", "pad"], paletteIndex: 4 }, // Sky
    { keywords: ["kulaklık", "speaker", "ses", "hoparlör", "bluetooth", "airpods", "müzik"], paletteIndex: 5 }, // Rose
    { keywords: ["elektronik", "akıllı", "smart", "saat", "watch"], paletteIndex: 6 }, // Indigo
    { keywords: ["batarya", "pil", "akü"], paletteIndex: 7 }, // Teal
    { keywords: ["yedek parça", "parça", "part", "kasa", "bord", "entegre", "tamir", "sarf"], paletteIndex: 8 }, // Orange
    { keywords: ["koruyucu", "lens", "film", "kamera"], paletteIndex: 9 }, // Fuchsia
    { keywords: ["hizmet", "servis", "işçilik", "yazılım", "onarım"], paletteIndex: 10 }, // Cyan
    { keywords: ["genel", "diğer", "çeşitli"], paletteIndex: 11 }, // Slate
];

/**
 * Returns a stable, elegant, non-neon CategoryTheme for a given category name or ID.
 */
export function getCategoryTheme(categoryNameOrId?: string | null): CategoryTheme {
    if (!categoryNameOrId || categoryNameOrId.trim() === "" || categoryNameOrId.toUpperCase() === "ALL") {
        return CATEGORY_PALETTES[11]; // Slate neutral
    }

    const normalized = categoryNameOrId.toLowerCase().trim();

    // 1. Check keyword match first
    for (const mapping of KEYWORD_MAP) {
        if (mapping.keywords.some(k => normalized.includes(k))) {
            return CATEGORY_PALETTES[mapping.paletteIndex];
        }
    }

    // 2. Deterministic string hash for consistent colors across custom categories
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = (hash << 5) - hash + normalized.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % CATEGORY_PALETTES.length;
    return CATEGORY_PALETTES[index];
}

