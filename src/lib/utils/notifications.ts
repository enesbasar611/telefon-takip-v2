export function formatWhatsAppLink(phone: string, message: string) {
  // Clear any non-numeric characters from the phone number
  const cleanPhone = phone.replace(/\D/g, "");

  // If phone starts with 0, replace with 90 (Turkey country code)
  const formattedPhone = cleanPhone.startsWith("0")
    ? "90" + cleanPhone.substring(1)
    : cleanPhone.startsWith("90") ? cleanPhone : "90" + cleanPhone;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

export const WHATSAPP_TEMPLATES = {
  NEW_SERVICE: "Sayın {customer}, {device} cihazınız {ticket} numarası ile servisimize kabul edilmiştir.",
  READY: "Sayın {customer}, {device} cihazınızın tamiri tamamlanmıştır. Teslim alabilirsiniz.",
};

export function replacePlaceholders(template: string, data: Record<string, string>) {
  return template.replace(/{(\w+)}/g, (_, key) => data[key] || "");
}
