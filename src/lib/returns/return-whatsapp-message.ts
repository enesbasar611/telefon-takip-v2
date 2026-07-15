export interface ReturnWhatsAppTicket {
  customerName?: string | null;
  ticketNumber?: string | null;
  productName?: string | null;
  quantity?: number | null;
  refundAmount?: number | string | null;
  refundCurrency?: string | null;
  returnReason?: string | null;
}

const reasonLabels: Record<string, string> = {
  GENERAL_RETURN: "Genel iade",
  DAMAGED: "Hasarli urun",
  PART_FAILURE: "Parca arizasi",
  LABOR_ERROR: "Iscilik hatasi",
  CUSTOMER_CANCEL: "Vazgecme",
  CUSTOMER_MISUSE: "Kullanici hatasi",
};

function formatAmount(amount?: number | string | null, currency?: string | null) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value <= 0) return "";

  return `${value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  })} ${currency || "TRY"}`;
}

export function getReturnReasonLabel(reason?: string | null) {
  if (!reason) return "";
  return reasonLabels[reason] || reason;
}

export function buildReturnWhatsAppMessage(ticket: ReturnWhatsAppTicket) {
  const customerName = ticket.customerName || "Musterimiz";
  const productName = ticket.productName?.trim();
  const quantity = Number(ticket.quantity || 1);
  const formattedAmount = formatAmount(ticket.refundAmount, ticket.refundCurrency);
  const reasonLabel = getReturnReasonLabel(ticket.returnReason);

  const lines = [
    `Sayin ${customerName},`,
    "",
    productName
      ? `${productName} urununuzun iade islemi tamamlanmistir.`
      : "Iade isleminiz tamamlanmistir.",
  ];

  if (quantity > 1) lines.push(`Adet: ${quantity} adet`);
  if (formattedAmount) lines.push(`Iade tutari: ${formattedAmount}`);
  if (ticket.ticketNumber) lines.push(`Iade no: ${ticket.ticketNumber}`);
  if (reasonLabel) lines.push(`Iade sebebi: ${reasonLabel}`);

  lines.push("", "Iyi gunler dileriz.");
  return lines.join("\n");
}

export function buildReturnWhatsAppSummaryMessage(tickets: ReturnWhatsAppTicket[]) {
  if (tickets.length <= 1) return buildReturnWhatsAppMessage(tickets[0] || {});

  const customerName = tickets[0]?.customerName || "Musterimiz";
  const lines = [
    `Sayin ${customerName},`,
    "",
    "Asagidaki urunlerinizin iade islemi tamamlanmistir:",
    "",
  ];

  tickets.forEach((ticket, index) => {
    const formattedAmount = formatAmount(ticket.refundAmount, ticket.refundCurrency);
    const quantity = Number(ticket.quantity || 1);
    const details = [
      quantity > 1 ? `${quantity} adet` : "",
      formattedAmount ? `iade tutari ${formattedAmount}` : "",
      ticket.ticketNumber ? `iade no ${ticket.ticketNumber}` : "",
    ].filter(Boolean);

    lines.push(`${index + 1}. ${ticket.productName || "Urun"}${details.length ? ` (${details.join(", ")})` : ""}`);
  });

  lines.push("", "Iyi gunler dileriz.");
  return lines.join("\n");
}
