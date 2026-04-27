export type BarcodeCopiesMode = "single" | "stock" | "custom";
export type BarcodeLabelSize = "40x30" | "50x30" | "58x40" | "70x40" | "custom";

export interface BarcodeLabelSettings {
  labelSize: BarcodeLabelSize;
  copiesMode: BarcodeCopiesMode;
  customCopies: number;
  customWidthMm: number;
  customHeightMm: number;
  showPrice: boolean;
  showSku: boolean;
  showBarcodeText: boolean;
}

export interface BarcodeProductInput {
  id: string;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  stock: number;
  sellPrice?: number | string | null;
  selected?: boolean;
  copies?: number;
}

export interface BarcodePrintItem {
  id: string;
  name: string;
  barcode: string;
  sku?: string | null;
  sellPrice?: number | string | null;
}

export const defaultBarcodeLabelSettings: BarcodeLabelSettings = {
  labelSize: "50x30",
  copiesMode: "stock",
  customCopies: 1,
  customWidthMm: 50,
  customHeightMm: 30,
  showPrice: true,
  showSku: false,
  showBarcodeText: true,
};

const labelSizes: Record<Exclude<BarcodeLabelSize, "custom">, { width: number; height: number }> = {
  "40x30": { width: 40, height: 30 },
  "50x30": { width: 50, height: 30 },
  "58x40": { width: 58, height: 40 },
  "70x40": { width: 70, height: 40 },
};

export function getBarcodeLabelDimensions(settings: BarcodeLabelSettings) {
  if (settings.labelSize !== "custom") {
    return labelSizes[settings.labelSize];
  }

  return {
    width: clampInteger(settings.customWidthMm, 25, 120, defaultBarcodeLabelSettings.customWidthMm),
    height: clampInteger(settings.customHeightMm, 15, 80, defaultBarcodeLabelSettings.customHeightMm),
  };
}

export function normalizeBarcodeSettings(input: Partial<Record<keyof BarcodeLabelSettings, unknown>>): BarcodeLabelSettings {
  const labelSize = isLabelSize(input.labelSize) ? input.labelSize : defaultBarcodeLabelSettings.labelSize;
  const copiesMode = isCopiesMode(input.copiesMode) ? input.copiesMode : defaultBarcodeLabelSettings.copiesMode;

  return {
    labelSize,
    copiesMode,
    customCopies: clampInteger(input.customCopies, 1, 500, defaultBarcodeLabelSettings.customCopies),
    customWidthMm: clampInteger(input.customWidthMm, 25, 120, defaultBarcodeLabelSettings.customWidthMm),
    customHeightMm: clampInteger(input.customHeightMm, 15, 80, defaultBarcodeLabelSettings.customHeightMm),
    showPrice: typeof input.showPrice === "boolean" ? input.showPrice : defaultBarcodeLabelSettings.showPrice,
    showSku: typeof input.showSku === "boolean" ? input.showSku : defaultBarcodeLabelSettings.showSku,
    showBarcodeText: typeof input.showBarcodeText === "boolean" ? input.showBarcodeText : defaultBarcodeLabelSettings.showBarcodeText,
  };
}

export function buildBarcodePrintQueue(
  products: BarcodeProductInput[],
  settings: BarcodeLabelSettings
): BarcodePrintItem[] {
  return products.flatMap((product) => {
    if (product.selected === false || !product.barcode) return [];

    const copies = getCopiesForProduct(product, settings);
    return Array.from({ length: copies }, () => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode as string,
      sku: product.sku,
      sellPrice: product.sellPrice,
    }));
  });
}

export function generateProductBarcode({
  shopId,
  productId,
  productName,
  randomPart = randomBarcodeSegment(),
}: {
  shopId: string;
  productId: string;
  productName?: string | null;
  createdAtMs?: number;
  randomPart?: string;
}) {
  const namePart = compactProductName(productName || productId).slice(0, 8);
  const productPart = compactId(productId).slice(-4).padStart(4, "0");
  const randomPartCompact = compactId(randomPart).slice(0, 4).padEnd(4, "0");
  const base = `TT2-${namePart}-${productPart}${randomPartCompact}`;
  return `${base}-${checksumDigit(base)}`;
}

function randomBarcodeSegment() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getCopiesForProduct(product: BarcodeProductInput, settings: BarcodeLabelSettings) {
  if (settings.copiesMode === "single") return 1;
  if (settings.copiesMode === "custom") {
    return clampInteger(product.copies ?? settings.customCopies, 1, 500, settings.customCopies);
  }

  return clampInteger(product.stock, 1, 500, 1);
}

function compactId(value: string) {
  const compacted = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return compacted || "GENERIC";
}

function compactProductName(value: string) {
  const normalized = value
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return compactId(normalized);
}

function checksumDigit(value: string) {
  const sum = Array.from(value).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  return sum % 10;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(numeric)));
}

function isLabelSize(value: unknown): value is BarcodeLabelSize {
  return value === "40x30" || value === "50x30" || value === "58x40" || value === "70x40" || value === "custom";
}

function isCopiesMode(value: unknown): value is BarcodeCopiesMode {
  return value === "single" || value === "stock" || value === "custom";
}
