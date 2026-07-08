import assert from "node:assert/strict";
import {
  buildBarcodePrintQueue,
  defaultBarcodeLabelSettings,
  generateProductBarcode,
  normalizeBarcodeSettings,
} from "../src/lib/barcode-utils";

const generated = generateProductBarcode({
  shopId: "shop_abc123",
  productId: "prod_xyz789",
  productName: "iPhone 14 Pro Ekran",
  randomPart: "ABC123",
});
const secondGenerated = generateProductBarcode({
  shopId: "shop_abc123",
  productId: "prod_xyz789",
  productName: "iPhone 14 Pro Ekran",
});

assert.equal(generated, "BST-I1P-Z789");
assert.ok(generated.length < 25);
assert.equal(generated, secondGenerated);

const turkishGenerated = generateProductBarcode({
  shopId: "shop_abc123",
  productId: "urun_123",
  productName: "Şarj Kılıfı 20W",
  randomPart: "ZZ9999",
});

assert.equal(turkishGenerated, "BST-SK2-N123");

const normalized = normalizeBarcodeSettings({
  labelSize: "invalid",
  showPrice: false,
  showBarcodeText: false,
  copiesMode: "stock",
  customWidthMm: "bad",
});

assert.equal(normalized.labelSize, defaultBarcodeLabelSettings.labelSize);
assert.equal(normalized.showPrice, false);
assert.equal(normalized.showBarcodeText, false);
assert.equal(normalized.copiesMode, "stock");
assert.equal(normalized.customWidthMm, defaultBarcodeLabelSettings.customWidthMm);

const queue = buildBarcodePrintQueue([
  { id: "p1", name: "Ekran", barcode: "ABC", stock: 10, selected: true, copies: 0 },
  { id: "p2", name: "Batarya", barcode: "DEF", stock: 3, selected: false, copies: 5 },
], { ...defaultBarcodeLabelSettings, copiesMode: "stock" });

assert.equal(queue.length, 10);
assert.equal(queue.every((item) => item.barcode === "ABC"), true);

console.log("barcode-utils tests passed");
