import { readFileSync } from "fs";
import { join } from "path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(
  join(process.cwd(), "src/app/api/test/edm-view/[uuid]/route.ts"),
  "utf8"
);

assert(source.includes("GIB_LOGO_URL"), "Invoice template should use the official GIB logo asset.");
assert(source.includes("e-FATURA"), "Invoice template should render the official e-FATURA heading.");
assert(source.includes("e-Belge"), "Invoice template should include the e-Belge hierarchy.");
assert(source.includes("QRCode.toDataURL"), "Invoice template should generate a dynamic QR code.");
assert(source.includes("qrPayload"), "Invoice QR code should be built from invoice metadata.");
assert(source.includes("htmlEscape"), "Invoice template should HTML-escape dynamic values.");
assert(source.includes("invoice.lines"), "Invoice template should render dynamic service lines.");
assert(source.includes("invoice.buyer.name"), "Invoice template should render dynamic customer details.");
assert(source.includes("invoice.total"), "Invoice template should render dynamic totals.");

console.log("edm-invoice-template tests passed");
