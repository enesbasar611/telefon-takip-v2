export interface Announcement {
    id: string;
    version: string;
    date: string;
    title: string;
    description: string;
    features: {
        title: string;
        description: string;
        icon: string;
    }[];
    image?: string;
    type: "FEATURE" | "UPDATE" | "MAINTENANCE";
}

/**
 * HOW TO ADD NEW ANNOUNCEMENTS:
 * 1. Add your new announcement object to the TOP of the ANNOUNCEMENTS array.
 * 2. Give it a unique ID (e.g., 'v2.2.0-new-feature').
 * 3. The system will automatically show the modal to all users who haven't seen this specific ID yet.
 */

export const ANNOUNCEMENTS: Announcement[] = [
    {
        id: "v2.2.0-panel-raporlama-iyilestirmeleri",
        version: "2.2.0",
        date: "2026-05-18",
        type: "UPDATE",
        title: "Panel, Raporlama ve Dışa Aktarma İyileştirildi",
        description: "Dashboard daha stabil açılıyor, raporlar daha okunabilir hale geldi ve veresiye çıktıları artık müşteri bazlı hazırlanıyor.",
        features: [
            {
                title: "Dashboard Düzeni Sabitlendi",
                description: "İlk açılışta kartların sıkışması ve üst üste binmesi engellendi. Kullanıcının son kaydettiği panel düzeni artık korunuyor.",
                icon: "LayoutDashboard"
            },
            {
                title: "Daha Hızlı ve Sakin Geçişler",
                description: "Dashboard, kurye ve stok gibi yoğun ekranlarda gereksiz yeniden yüklemeler azaltıldı; eski veri korunarak titreşim ve bekleme hissi düşürüldü.",
                icon: "Zap"
            },
            {
                title: "Veresiye Excel/CSV Çıktıları",
                description: "Müşteri seçiliyken sadece seçili müşteriler, seçim yokken tüm müşteriler aktarılır. Excel'de her müşteri ayrı sayfada; CSV'de ayrı bölümler halinde görünür.",
                icon: "FileSpreadsheet"
            },
            {
                title: "Başar AI Servis Raporu",
                description: "Teknik servis AI analiz penceresi dark/light moda uyumlu, daha kısa ve daha anlaşılır bir rapor görünümüne kavuştu.",
                icon: "Sparkles"
            },
            {
                title: "Ayarlar Formları Düzeltildi",
                description: "Dinamik formlar sekmesinde dükkan bilgisi yüklenirken oluşan hata giderildi; formlar artık daha güvenli açılıyor.",
                icon: "Settings"
            }
        ]
    },
    {
        id: "v2.1.0-kurye-takip",
        version: "2.1.0",
        date: "2024-05-08",
        type: "FEATURE",
        title: "Kurye Durum Takibi Yayında!",
        description: "Operasyonel süreçlerinizi kolaylaştıracak yeni Kurye Takip widget'ı ve marka kimliğinize özel dinamik logo sistemimiz dashboard'a eklendi.",
        features: [
            {
                title: "Anlık Kurye Durumu",
                description: "Dashboard üzerinden kurye siparişlerinizin durumunu (bekliyor/alındı) anlık olarak takip edin.",
                icon: "Bike"
            },
            {
                title: "Dinamik Marka Logoları",
                description: "Dükkan ve müşteri isimlerine göre otomatik oluşturulan, renkli ve şık logo sistemi.",
                icon: "Palette"
            },
            {
                title: "Optimize Dashboard",
                description: "Kart boyutları dengelendi, 'Daha Fazla' göstergesi ile daha temiz bir arayüz sağlandı.",
                icon: "Layout"
            }
        ]
    }
];
