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
