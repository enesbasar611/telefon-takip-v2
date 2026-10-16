export function sanitizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (!clean) return "";

  // Strip all leading zeros
  clean = clean.replace(/^0+/, "");

  if (clean.startsWith("90")) {
    // Strip any extra zeros after country code 90 (e.g. 900532... -> 90532...)
    const after90 = clean.slice(2).replace(/^0+/, "");
    clean = "90" + after90;
  } else if (clean.length === 10 && clean.startsWith("5")) {
    clean = "90" + clean;
  } else if (clean.length === 11 && clean.startsWith("05")) {
    clean = "90" + clean.slice(1);
  }

  return clean;
}

export function formatWhatsAppLink(phone: string, message: string, type: 'web' | 'desktop' = 'web') {
  const formattedPhone = sanitizeWhatsAppPhone(phone);
  const encodedMessage = encodeURIComponent(message);

  if (type === 'desktop') {
    return `whatsapp://send/?phone=${formattedPhone}&text=${encodedMessage}`;
  }

  // Web version - using web.whatsapp.com directly to reuse tabs more effectively
  return `https://web.whatsapp.com/send/?phone=${formattedPhone}&text=${encodedMessage}`;
}

export function sendWhatsAppClientSide(phone: string, message: string) {
  // Default to 'web' if not set in localStorage
  const savedType = typeof window !== 'undefined' ? localStorage.getItem('whatsapp_send_type') : 'web';
  const type = (savedType === 'desktop' ? 'desktop' : 'web') as 'web' | 'desktop';

  const link = formatWhatsAppLink(phone, message, type);

  if (type === 'desktop') {
    // For desktop app, we want to trigger the protocol without opening a new window if possible
    window.location.assign(link);
  } else {
    // For web, use a named window to target and reuse the same tab
    window.open(link, 'whatsapp_window');
  }
}

export const WHATSAPP_TEMPLATES = {
  NEW_SERVICE: "🟢 Sayın {customer},\n\n{device} cihazınız {ticket} numarası ile servisimize kabul edilmiştir. İşlemler başladığında size bilgi verilecektir.\n\nBizi tercih ettiğiniz için teşekkür ederiz. ✨",

  APPROVED: "⚒️ Sayın {customer},\n\n{device} cihazınız için tamir onayı alınmıştır. Teknisyenlerimiz işlemlere başlamıştır. En kısa sürede tamamlanması için çalışıyoruz. 🔧",

  REPAIRING: "🧑‍🔧 Sayın {customer},\n\n{device} cihazınızın teknik servis işlemleri devam etmektedir. Gerekli testler ve onarımlar titizlikle sürdürülüyor. 📲",

  WAITING_PART: "📦 Sayın {customer},\n\n{device} cihazınız için gerekli olan yedek parça sipariş edilmiştir. Parça elimize ulaştığında montajı yapılıp size bilgi verilecektir. ⏳",

  READY: "🎊 Sayın {customer},\n\n{device} cihazınızın tamiri başarıyla tamamlanmıştır! Testleri yapılmış ve teslime hazır durumdadır. \n\nMesai saatlerimiz içerisinde gelip cihazınızı teslim alabilirsiniz. 🏪",

  DELIVERED: "🤝 Sayın {customer},\n\n{device} cihazınız bugün teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz. Cihazınızı iyi günlerde kullanmanızı dileriz!\n\nBir sorununuz olursa bize her zaman ulaşabilirsiniz. 😊",

  SERVICE_RECEIPT: "📋 *SERVİS FİŞİ* 📋\n\n*Müşteri:* {customer}\n*Cihaz:* {device}\n*Kayıt No:* #{ticket}\n*Arıza:* {problem}\n*Tahmini Ücret:* ₺{price}\n\nCihazınız servisimize kabul edilmiştir. İşlemlerinizle ilgili detaylara yukarıdaki bilgilerden ulaşabilirsiniz. ✨",

  DEBT_REMINDER: "🔔 Sayın {customer},\n\nİşletmemizdeki {amount} TL tutarındaki veresiye borcunuz için nezaketen hatırlatma mesajıdır. En kısa sürede ödemenizi bekler, iyi günler dileriz. ⭐",
};

export function replacePlaceholders(template: string, data: Record<string, string>) {
  return template.replace(/{(\w+)}/g, (_, key) => data[key] || "");
}
