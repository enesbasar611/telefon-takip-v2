import { buildReturnWhatsAppMessage } from "../src/lib/returns/return-whatsapp-message";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const message = buildReturnWhatsAppMessage({
  customerName: "Ayse Yilmaz",
  ticketNumber: "RET-20260001",
  productName: "iPhone 13 Ekran",
  quantity: 2,
  refundAmount: 1250,
  refundCurrency: "TRY",
  returnReason: "DAMAGED",
});

assert(message.includes("Sayin Ayse Yilmaz"), "Message should address the customer.");
assert(message.includes("iPhone 13 Ekran"), "Message should include the returned product.");
assert(message.includes("2 adet"), "Message should include quantity.");
assert(message.includes("1.250 TRY"), "Message should include formatted refund amount.");
assert(message.includes("RET-20260001"), "Message should include ticket number.");
assert(message.includes("Hasarli urun"), "Message should include readable reason.");

const summaryMessage = buildReturnWhatsAppMessage({
  customerName: "Mehmet Kaya",
  productName: "Veresiye manuel kalem",
});

assert(summaryMessage.includes("Veresiye manuel kalem"), "Message should use product names even for manually linked debt items.");
assert(!summaryMessage.includes("urun urununuz"), "Message should not fall back to the generic product wording when a name exists.");

const fallbackMessage = buildReturnWhatsAppMessage({
  customerName: "Eski Kayit",
});

assert(fallbackMessage.includes("Iade isleminiz tamamlanmistir"), "Message without a product name should use a clean generic sentence.");
assert(!fallbackMessage.includes("urun urununuz"), "Message without a product name should not produce duplicated generic wording.");

console.log("return-whatsapp-message tests passed");
