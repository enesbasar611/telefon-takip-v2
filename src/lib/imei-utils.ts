export type BtkClassification = "KAYITLI" | "KAYITSIZ" | "KLONLU" | "BELIRSIZ";

export interface AppleExtendedSpecs {
  isApple: boolean;
  modelName: string;
  modelCode: string;
  releaseYear: number;
  chipset?: string;
  storageOptions: string[];
  colorOptions: string[];
  hardwareRegionNote: string;
  warrantyCheckUrl: string;
  fmiReminder: string;
}

export interface TacDeviceMatch {
  tac: string;
  brand: string;
  model: string;
  modelCode?: string;
  releaseYear?: number;
  category?: "Smartphone" | "Tablet" | "Feature Phone";
  appleSpecs?: AppleExtendedSpecs;
}

export interface BtkOfficialDetails {
  imei: string;
  durum: string;
  kaynak: string;
  sorguTarihi: string;
  markaModel: string;
  classification: BtkClassification;
}

export interface ImeiLookupResult {
  imei: string;
  luhnValid: boolean;
  autoCompleted15thDigit: boolean;
  tac: string;
  brand: string | null;
  model: string | null;
  tacMatch: TacDeviceMatch | null;
  appleSpecs: AppleExtendedSpecs | null;
  btk: BtkOfficialDetails | null;
  btkPendingCaptcha?: boolean;
  captchaImageDataUrl?: string;
  challengeId?: string;
  btkError?: string | null;
  cached?: boolean;
  checkedAt: string;
}

/**
 * Strips all non-digit characters and limits length to 15 digits.
 */
export function normalizeImeiDigits(raw?: string | null): string {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "").slice(0, 15);
}

/**
 * Computes the 15th GSMA Luhn check digit from the first 14 IMEI digits.
 */
export function calculateLuhnCheckDigit(imei14: string): string {
  const digits = normalizeImeiDigits(imei14).slice(0, 14);
  if (digits.length !== 14) return "";

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = Number(digits[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return String((10 - (sum % 10)) % 10);
}

/**
 * Validates a 15-digit IMEI against the GSMA Luhn checksum formula.
 */
export function isValidImeiLuhn(imei: string): boolean {
  const digits = normalizeImeiDigits(imei);
  if (digits.length !== 15) return false;
  return digits[14] === calculateLuhnCheckDigit(digits.slice(0, 14));
}

/**
 * Handles controlled typing/pasting for 14->15 Luhn auto-completion while allowing
 * seamless backspace deletion from 15 down to 14 digits without trapping the cursor.
 */
export function applyImeiAutoComplete(
  prevRaw: string,
  nextRaw: string
): { value: string; autoCompleted: boolean } {
  const prevDigits = normalizeImeiDigits(prevRaw);
  const nextDigits = normalizeImeiDigits(nextRaw);

  if (nextDigits.length === 14 && prevDigits.length < 14) {
    const checkDigit = calculateLuhnCheckDigit(nextDigits);
    return {
      value: `${nextDigits}${checkDigit}`,
      autoCompleted: true,
    };
  }

  return {
    value: nextDigits,
    autoCompleted: false,
  };
}

interface AppleModelSpecSeed {
  modelName: string;
  modelCode: string;
  releaseYear: number;
  chipset: string;
  storageOptions: string[];
  colorOptions: string[];
  hardwareRegionNote: string;
}

const APPLE_SPECS_CATALOG: Record<string, AppleModelSpecSeed> = {
  "iPhone 16 Pro Max": {
    modelName: "iPhone 16 Pro Max",
    modelCode: "A3296",
    releaseYear: 2024,
    chipset: "Apple A18 Pro",
    storageOptions: ["256 GB", "512 GB", "1 TB"],
    colorOptions: ["Çöl Titanyum", "Natürel Titanyum", "Beyaz Titanyum", "Siyah Titanyum"],
    hardwareRegionNote: "Global / Avrupa (TR uyumlu eSIM + Fiziksel nano-SIM)",
  },
  "iPhone 16 Pro": {
    modelName: "iPhone 16 Pro",
    modelCode: "A3293",
    releaseYear: 2024,
    chipset: "Apple A18 Pro",
    storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"],
    colorOptions: ["Çöl Titanyum", "Natürel Titanyum", "Beyaz Titanyum", "Siyah Titanyum"],
    hardwareRegionNote: "Global / Avrupa (TR uyumlu eSIM + Fiziksel nano-SIM)",
  },
  "iPhone 16 Plus": {
    modelName: "iPhone 16 Plus",
    modelCode: "A3290",
    releaseYear: 2024,
    chipset: "Apple A18",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Siyah", "Beyaz", "Pembe", "Deniz Mavisi", "Laciverttaş"],
    hardwareRegionNote: "Global / Avrupa (TR uyumlu eSIM + Fiziksel nano-SIM)",
  },
  "iPhone 16": {
    modelName: "iPhone 16",
    modelCode: "A3287",
    releaseYear: 2024,
    chipset: "Apple A18",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Siyah", "Beyaz", "Pembe", "Deniz Mavisi", "Laciverttaş"],
    hardwareRegionNote: "Global / Avrupa (TR uyumlu eSIM + Fiziksel nano-SIM)",
  },
  "iPhone 15 Pro Max": {
    modelName: "iPhone 15 Pro Max",
    modelCode: "A3106",
    releaseYear: 2023,
    chipset: "Apple A17 Pro",
    storageOptions: ["256 GB", "512 GB", "1 TB"],
    colorOptions: ["Natürel Titanyum", "Mavi Titanyum", "Beyaz Titanyum", "Siyah Titanyum"],
    hardwareRegionNote: "Global / Avrupa (A3106 - Fiziksel nano-SIM + eSIM)",
  },
  "iPhone 15 Pro": {
    modelName: "iPhone 15 Pro",
    modelCode: "A3102",
    releaseYear: 2023,
    chipset: "Apple A17 Pro",
    storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"],
    colorOptions: ["Natürel Titanyum", "Mavi Titanyum", "Beyaz Titanyum", "Siyah Titanyum"],
    hardwareRegionNote: "Global / Avrupa (A3102 - Fiziksel nano-SIM + eSIM)",
  },
  "iPhone 15 Plus": {
    modelName: "iPhone 15 Plus",
    modelCode: "A3094",
    releaseYear: 2023,
    chipset: "Apple A16 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Siyah", "Mavi", "Yeşil", "Sarı", "Pembe"],
    hardwareRegionNote: "Global / Avrupa (A3094 - Fiziksel nano-SIM + eSIM)",
  },
  "iPhone 15": {
    modelName: "iPhone 15",
    modelCode: "A3090",
    releaseYear: 2023,
    chipset: "Apple A16 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Siyah", "Mavi", "Yeşil", "Sarı", "Pembe"],
    hardwareRegionNote: "Global / Avrupa (A3090 - Fiziksel nano-SIM + eSIM)",
  },
  "iPhone 14 Pro Max": {
    modelName: "iPhone 14 Pro Max",
    modelCode: "A2894",
    releaseYear: 2022,
    chipset: "Apple A16 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"],
    colorOptions: ["Derin Mor", "Altın", "Gümüş", "Uzay Siyahı"],
    hardwareRegionNote: "Global / Avrupa (A2894 - Fiziksel nano-SIM + eSIM)",
  },
  "iPhone 14 Pro": {
    modelName: "iPhone 14 Pro",
    modelCode: "A2890",
    releaseYear: 2022,
    chipset: "Apple A16 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"],
    colorOptions: ["Derin Mor", "Altın", "Gümüş", "Uzay Siyahı"],
    hardwareRegionNote: "Global / Avrupa (A2890 - Fiziksel nano-SIM + eSIM)",
  },
  "iPhone 14": {
    modelName: "iPhone 14",
    modelCode: "A2882",
    releaseYear: 2022,
    chipset: "Apple A15 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Gece Yarısı", "Yıldız Işığı", "Mavi", "Mor", "Sarı", "(PRODUCT)RED"],
    hardwareRegionNote: "Global / Avrupa (A2882)",
  },
  "iPhone 13 Pro Max": {
    modelName: "iPhone 13 Pro Max",
    modelCode: "A2643",
    releaseYear: 2021,
    chipset: "Apple A15 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"],
    colorOptions: ["Grafit", "Altın", "Gümüş", "Sierra Mavisi", "Köknar Yeşili"],
    hardwareRegionNote: "Global / Avrupa (A2643)",
  },
  "iPhone 13 Pro": {
    modelName: "iPhone 13 Pro",
    modelCode: "A2638",
    releaseYear: 2021,
    chipset: "Apple A15 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"],
    colorOptions: ["Grafit", "Altın", "Gümüş", "Sierra Mavisi", "Köknar Yeşili"],
    hardwareRegionNote: "Global / Avrupa (A2638)",
  },
  "iPhone 13": {
    modelName: "iPhone 13",
    modelCode: "A2633",
    releaseYear: 2021,
    chipset: "Apple A15 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Gece Yarısı", "Yıldız Işığı", "Mavi", "Pembe", "Yeşil", "(PRODUCT)RED"],
    hardwareRegionNote: "Global / Avrupa (A2633)",
  },
  "iPhone 12 Pro Max": {
    modelName: "iPhone 12 Pro Max",
    modelCode: "A2411",
    releaseYear: 2020,
    chipset: "Apple A14 Bionic",
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Grafit", "Gümüş", "Altın", "Pasifik Mavisi"],
    hardwareRegionNote: "Global / Avrupa (A2411)",
  },
  "iPhone 12": {
    modelName: "iPhone 12",
    modelCode: "A2403",
    releaseYear: 2020,
    chipset: "Apple A14 Bionic",
    storageOptions: ["64 GB", "128 GB", "256 GB"],
    colorOptions: ["Siyah", "Beyaz", "Mavi", "Yeşil", "Mor", "(PRODUCT)RED"],
    hardwareRegionNote: "Global / Avrupa (A2403)",
  },
  "iPhone 11": {
    modelName: "iPhone 11",
    modelCode: "A2221",
    releaseYear: 2019,
    chipset: "Apple A13 Bionic",
    storageOptions: ["64 GB", "128 GB", "256 GB"],
    colorOptions: ["Siyah", "Beyaz", "Yeşil", "Sarı", "Mor", "(PRODUCT)RED"],
    hardwareRegionNote: "Global / Avrupa (A2221)",
  },
};

const FMI_DEFAULT_REMINDER =
  "Cihaz alımı veya servis öncesinde Ayarlar > [Adınız] > Bul > iPhone'umu Bul (FMI) özelliğinin KAPALI olduğundan ve iCloud hesabından çıkış yapıldığından emin olun.";

export function buildAppleExtendedSpecs(
  modelName?: string | null,
  explicitCode?: string | null
): AppleExtendedSpecs {
  const normalized = (modelName || "").trim();
  const matchedKey = Object.keys(APPLE_SPECS_CATALOG)
    .sort((a, b) => b.length - a.length)
    .find((key) => normalized.toLowerCase().includes(key.toLowerCase()));

  if (matchedKey) {
    const seed = APPLE_SPECS_CATALOG[matchedKey];
    return {
      isApple: true,
      modelName: normalized || seed.modelName,
      modelCode: explicitCode || seed.modelCode,
      releaseYear: seed.releaseYear,
      chipset: seed.chipset,
      storageOptions: seed.storageOptions,
      colorOptions: seed.colorOptions,
      hardwareRegionNote: seed.hardwareRegionNote,
      warrantyCheckUrl: "https://checkcoverage.apple.com/?locale=tr_TR",
      fmiReminder: FMI_DEFAULT_REMINDER,
    };
  }

  return {
    isApple: true,
    modelName: normalized || "Apple iPhone",
    modelCode: explicitCode || "Belirtilmedi",
    releaseYear: 2023,
    storageOptions: ["128 GB", "256 GB", "512 GB"],
    colorOptions: ["Siyah", "Beyaz", "Natürel", "Mavi"],
    hardwareRegionNote: "Apple GSM / LTE / 5G (Bölge kodu için Ayarlar > Genel > Hakkında > Model Numarası kontrol edin)",
    warrantyCheckUrl: "https://checkcoverage.apple.com/?locale=tr_TR",
    fmiReminder: FMI_DEFAULT_REMINDER,
  };
}

/**
 * Rich TAC (first 8 digits) dictionary covering major TR market brands:
 * Apple, Samsung, Xiaomi/Redmi/POCO, Huawei, Honor, General Mobile, Reeder, Tecno, Infinix.
 */
export const TAC_DATABASE: Record<string, Omit<TacDeviceMatch, "tac" | "appleSpecs">> = {
  // Apple iPhone
  "35902460": { brand: "Apple", model: "iPhone 16 Pro Max", modelCode: "A3296", releaseYear: 2024, category: "Smartphone" },
  "35661468": { brand: "Apple", model: "iPhone 16 Pro", modelCode: "A3293", releaseYear: 2024, category: "Smartphone" },
  "35488935": { brand: "Apple", model: "iPhone 16", modelCode: "A3287", releaseYear: 2024, category: "Smartphone" },
  "35542173": { brand: "Apple", model: "iPhone 15 Pro Max", modelCode: "A3106", releaseYear: 2023, category: "Smartphone" },
  "35998534": { brand: "Apple", model: "iPhone 15 Pro Max", modelCode: "A3106", releaseYear: 2023, category: "Smartphone" },
  "35729855": { brand: "Apple", model: "iPhone 15 Pro", modelCode: "A3102", releaseYear: 2023, category: "Smartphone" },
  "35147862": { brand: "Apple", model: "iPhone 15 Plus", modelCode: "A3094", releaseYear: 2023, category: "Smartphone" },
  "35496581": { brand: "Apple", model: "iPhone 15", modelCode: "A3090", releaseYear: 2023, category: "Smartphone" },
  "35754822": { brand: "Apple", model: "iPhone 14 Pro Max", modelCode: "A2894", releaseYear: 2022, category: "Smartphone" },
  "35394265": { brand: "Apple", model: "iPhone 14 Pro", modelCode: "A2890", releaseYear: 2022, category: "Smartphone" },
  "35284915": { brand: "Apple", model: "iPhone 14", modelCode: "A2882", releaseYear: 2022, category: "Smartphone" },
  "35897236": { brand: "Apple", model: "iPhone 13 Pro Max", modelCode: "A2643", releaseYear: 2021, category: "Smartphone" },
  "35610429": { brand: "Apple", model: "iPhone 13 Pro", modelCode: "A2638", releaseYear: 2021, category: "Smartphone" },
  "35189347": { brand: "Apple", model: "iPhone 13", modelCode: "A2633", releaseYear: 2021, category: "Smartphone" },
  "35301711": { brand: "Apple", model: "iPhone 12 Pro Max", modelCode: "A2411", releaseYear: 2020, category: "Smartphone" },
  "35304211": { brand: "Apple", model: "iPhone 12", modelCode: "A2403", releaseYear: 2020, category: "Smartphone" },
  "35656210": { brand: "Apple", model: "iPhone 11", modelCode: "A2221", releaseYear: 2019, category: "Smartphone" },

  // Samsung
  "35089265": { brand: "Samsung", model: "Galaxy S24 Ultra", modelCode: "SM-S928B", releaseYear: 2024, category: "Smartphone" },
  "35267819": { brand: "Samsung", model: "Galaxy S24", modelCode: "SM-S921B", releaseYear: 2024, category: "Smartphone" },
  "35022382": { brand: "Samsung", model: "Galaxy S23 Ultra", modelCode: "SM-S918B", releaseYear: 2023, category: "Smartphone" },
  "35512980": { brand: "Samsung", model: "Galaxy A55 5G", modelCode: "SM-A556E", releaseYear: 2024, category: "Smartphone" },
  "35349811": { brand: "Samsung", model: "Galaxy A54 5G", modelCode: "SM-A546E", releaseYear: 2023, category: "Smartphone" },
  "35841290": { brand: "Samsung", model: "Galaxy A35 5G", modelCode: "SM-A356E", releaseYear: 2024, category: "Smartphone" },
  "35762144": { brand: "Samsung", model: "Galaxy A25 5G", modelCode: "SM-A256E", releaseYear: 2024, category: "Smartphone" },
  "35641209": { brand: "Samsung", model: "Galaxy A16", modelCode: "SM-A165F", releaseYear: 2024, category: "Smartphone" },
  "35482910": { brand: "Samsung", model: "Galaxy A15", modelCode: "SM-A155F", releaseYear: 2023, category: "Smartphone" },

  // Xiaomi / Redmi / POCO
  "86248906": { brand: "Xiaomi", model: "Xiaomi 14", modelCode: "23127PN0CG", releaseYear: 2024, category: "Smartphone" },
  "86781206": { brand: "Xiaomi", model: "Xiaomi 13T", modelCode: "2306EPN60G", releaseYear: 2023, category: "Smartphone" },
  "86431906": { brand: "Xiaomi", model: "Redmi Note 13 Pro+", modelCode: "23090RA98G", releaseYear: 2024, category: "Smartphone" },
  "86592406": { brand: "Xiaomi", model: "Redmi Note 13 Pro", modelCode: "2312DRA50G", releaseYear: 2024, category: "Smartphone" },
  "86145606": { brand: "Xiaomi", model: "Redmi Note 13", modelCode: "23129RAA4G", releaseYear: 2024, category: "Smartphone" },
  "86904306": { brand: "Xiaomi", model: "Redmi 13C", modelCode: "23100RN82L", releaseYear: 2023, category: "Smartphone" },
  "86734206": { brand: "POCO", model: "POCO X6 Pro", modelCode: "2311DRK48G", releaseYear: 2024, category: "Smartphone" },
  "86382906": { brand: "POCO", model: "POCO F6", modelCode: "24069PC21G", releaseYear: 2024, category: "Smartphone" },

  // Huawei & Honor
  "86942105": { brand: "Huawei", model: "Pura 70 Pro", modelCode: "HBN-LX9", releaseYear: 2024, category: "Smartphone" },
  "86321805": { brand: "Huawei", model: "Nova 12s", modelCode: "FOA-LX9", releaseYear: 2024, category: "Smartphone" },
  "86541207": { brand: "Honor", model: "Honor 90", modelCode: "REA-NX9", releaseYear: 2023, category: "Smartphone" },
  "86812907": { brand: "Honor", model: "Honor Magic6 Pro", modelCode: "BVL-N49", releaseYear: 2024, category: "Smartphone" },

  // General Mobile & Reeder
  "86492004": { brand: "General Mobile", model: "GM 24 Pro", modelCode: "G701", releaseYear: 2023, category: "Smartphone" },
  "86214004": { brand: "General Mobile", model: "GM Phoenix 5G", modelCode: "G801", releaseYear: 2023, category: "Smartphone" },
  "86712004": { brand: "Reeder", model: "S19 Max Pro S", modelCode: "S19MPS", releaseYear: 2023, category: "Smartphone" },
  "86913504": { brand: "Reeder", model: "S23 Pro Max", modelCode: "S23PM", releaseYear: 2024, category: "Smartphone" },

  // Tecno & Infinix
  "35792140": { brand: "Tecno", model: "Spark 20 Pro", modelCode: "KJ6", releaseYear: 2024, category: "Smartphone" },
  "35982410": { brand: "Tecno", model: "Camon 30", modelCode: "CL6", releaseYear: 2024, category: "Smartphone" },
  "35618492": { brand: "Infinix", model: "Hot 50i", modelCode: "X6531", releaseYear: 2024, category: "Smartphone" },
  "35472819": { brand: "Infinix", model: "Hot 40 Pro", modelCode: "X6837", releaseYear: 2023, category: "Smartphone" },
  "35821470": { brand: "Infinix", model: "Note 40 Pro", modelCode: "X6850", releaseYear: 2024, category: "Smartphone" },
};

/**
 * Resolves device metadata using an 8-digit TAC lookup with brand-prefix hints.
 */
export function lookupTacDevice(imei: string): TacDeviceMatch | null {
  const digits = normalizeImeiDigits(imei);
  if (digits.length < 8) return null;

  const tac = digits.slice(0, 8);
  const direct = TAC_DATABASE[tac];
  if (direct) {
    return {
      tac,
      ...direct,
      appleSpecs:
        direct.brand === "Apple"
          ? buildAppleExtendedSpecs(direct.model, direct.modelCode)
          : undefined,
    };
  }

  return null;
}

/**
 * Classifies official BTK registration status text into standardized UI statuses.
 */
export function classifyBtkStatus(durum?: string | null): BtkClassification {
  const text = (durum || "").toLocaleLowerCase("tr-TR");
  if (!text) return "BELIRSIZ";

  if (
    text.includes("klon") ||
    text.includes("çalıntı") ||
    text.includes("calinti") ||
    text.includes("kayıp") ||
    text.includes("kayip") ||
    text.includes("kesilen") ||
    text.includes("haberleşme") ||
    text.includes("kara liste")
  ) {
    return "KLONLU";
  }

  if (
    text.includes("kayıtdışı") ||
    text.includes("kayitdisi") ||
    text.includes("kayıt dışı") ||
    text.includes("kayit disi") ||
    text.includes("kayıtsız") ||
    text.includes("kayitsiz") ||
    text.includes("bulunamadı") ||
    text.includes("bulunamadi") ||
    text.includes("geçersiz")
  ) {
    return "KAYITSIZ";
  }

  if (
    text.includes("ithalat") ||
    text.includes("imalat") ||
    text.includes("yolcu") ||
    text.includes("kayıtlı") ||
    text.includes("kayitli")
  ) {
    return "KAYITLI";
  }

  return "BELIRSIZ";
}

/**
 * Parses a combined BTK "Marka / Model" string into structured { brand, model }.
 */
export function parseBrandAndModel(
  rawBrandModel?: string | null,
  fallbackBrand?: string | null,
  fallbackModel?: string | null
): { brand: string | null; model: string | null } {
  const cleaned = (rawBrandModel || "").trim();
  if (!cleaned) {
    return {
      brand: fallbackBrand || null,
      model: fallbackModel || null,
    };
  }

  const knownBrands = [
    "Apple",
    "Samsung",
    "Xiaomi",
    "Redmi",
    "POCO",
    "Huawei",
    "Honor",
    "General Mobile",
    "Reeder",
    "Tecno",
    "Infinix",
    "Oppo",
    "Vivo",
    "Realme",
    "OnePlus",
    "Google",
    "Nokia",
    "Motorola",
    "Sony",
    "Asus",
    "Lenovo",
    "Casper",
    "Vestel",
    "ZTE",
    "OMIX",
  ];

  const isPlaceholder = (val?: string | null) => {
    if (!val) return true;
    const v = val.trim().toLowerCase();
    return (
      !v ||
      v === "not known" ||
      v === "unknown" ||
      v === "bilinmiyor" ||
      v === "n/a" ||
      v === "--" ||
      v === "-"
    );
  };

  // Structured e-Devlet format:
  // "Üretici: ..., Pazar Adı: ..., Marka: ..., Model Bilgileri: ..."
  if (/Üretici:|Pazar Adı:|Model Bilgileri:|Marka:/i.test(cleaned)) {
    const manufacturer = cleaned.match(/Üretici\s*:\s*([^,]+)/i)?.[1]?.trim();
    const marketingName = cleaned.match(/Pazar Adı\s*:\s*([^,]+)/i)?.[1]?.trim();
    const brandField = cleaned.match(/Marka\s*:\s*([^,]+)/i)?.[1]?.trim();
    const modelInfo = cleaned.match(/Model Bilgileri\s*:\s*(.+)$/i)?.[1]?.trim();

    const searchPool = [brandField, marketingName, modelInfo, manufacturer]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    const matchedKnownBrand = knownBrands.find((b) =>
      searchPool.includes(b.toLocaleLowerCase("tr-TR"))
    );

    const resolvedBrand =
      matchedKnownBrand ||
      (!isPlaceholder(brandField) ? brandField! : null) ||
      fallbackBrand ||
      (!isPlaceholder(manufacturer)
        ? manufacturer!.split(/\s+/)[0].replace(/,$/, "")
        : null);

    let resolvedModel: string | null = null;
    if (!isPlaceholder(marketingName)) {
      resolvedModel = marketingName!;
    } else if (!isPlaceholder(modelInfo)) {
      resolvedModel = modelInfo!;
    } else if (fallbackModel) {
      resolvedModel = fallbackModel;
    }

    if (resolvedModel && resolvedBrand) {
      const stripRe = new RegExp(`^${resolvedBrand}\\s+`, "i");
      const withoutDupBrand = resolvedModel.replace(stripRe, "").trim();
      if (withoutDupBrand && resolvedBrand.toLowerCase() !== "nokia") {
        resolvedModel = withoutDupBrand;
      }
    }

    if (
      resolvedModel &&
      !isPlaceholder(modelInfo) &&
      !resolvedModel.toLowerCase().includes(modelInfo!.toLowerCase()) &&
      /^A\d{4}$/i.test(modelInfo!)
    ) {
      resolvedModel = `${resolvedModel} (${modelInfo})`;
    }

    return {
      brand: resolvedBrand || null,
      model: resolvedModel || fallbackModel || null,
    };
  }

  const lower = cleaned.toLocaleLowerCase("tr-TR");
  const matchedBrand = knownBrands.find((b) =>
    lower.includes(b.toLocaleLowerCase("tr-TR"))
  );

  if (matchedBrand) {
    let modelPart = cleaned
      .replace(new RegExp(matchedBrand, "i"), "")
      .replace(/^[\s\-:/]+/, "")
      .trim();
    if (!modelPart) modelPart = fallbackModel || cleaned;
    return { brand: matchedBrand, model: modelPart };
  }

  const tokens = cleaned.split(/\s+/);
  if (tokens.length >= 2) {
    return {
      brand: tokens[0],
      model: tokens.slice(1).join(" "),
    };
  }

  return {
    brand: fallbackBrand || cleaned,
    model: fallbackModel || cleaned,
  };
}

/**
 * Matches a resolved brand string case-insensitively against a form's dropdown options.
 */
export function resolveCanonicalBrandOption(
  brand: string | null | undefined,
  options?: string[]
): string {
  const clean = (brand || "").trim();
  if (!clean) return "";
  if (!options || options.length === 0) return clean;
  const matched = options.find(
    (opt) => opt.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR")
  );
  return matched || clean;
}

/**
 * Formats a concise BTK status tag and merges it into notes without duplicating old tags.
 */
export function mergeBtkNoteTag(
  existingNotes: string | undefined | null,
  classification: BtkClassification | undefined | null
): string {
  const base = (existingNotes || "")
    .replace(/\s*\[BTK:\s*(?:Kayıtlı|Kayıtsız|Klonlu|Belirsiz)\]/gi, "")
    .trim();

  if (!classification || classification === "BELIRSIZ") return base;
  const tagMap: Record<Exclude<BtkClassification, "BELIRSIZ">, string> = {
    KAYITLI: "[BTK: Kayıtlı]",
    KAYITSIZ: "[BTK: Kayıtsız]",
    KLONLU: "[BTK: Klonlu]",
  };
  const tag = tagMap[classification];
  return base ? `${base} ${tag}` : tag;
}
