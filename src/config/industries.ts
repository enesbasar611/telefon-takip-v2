import {
    Smartphone,
    Zap,
    Droplet,
    Monitor,
    Settings2,
    Package,
    ShoppingCart,
    Wrench,
    Shirt,
    Store,
    Battery,
    Cpu,
    Wifi,
    Plug,
    Lightbulb,
    CircuitBoard,
    Waves,
    HardDrive,
    Mouse,
    Keyboard,
    Carrot,
    ShoppingBasket,
    Scale,
    Tag,
    Scissors,
    Ruler,
    Hammer,
    Box,
    Car,
    Gauge,
    Fuel,
    Key,
    User,
    Wind,
    Sparkles as SparklesIcon,
} from "lucide-react";

export type IndustryType = 'PHONE_REPAIR' | 'ELECTRICIAN' | 'PLUMBING' | 'COMPUTER_REPAIR' | 'GROCERY' | 'CLOTHING' | 'AUTOMOTIVE' | 'BARBER' | 'GENERAL';

export type FieldType = 'text' | 'number' | 'select' | 'textarea';

export interface FieldDef {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: string[];
    validate?: 'imei' | 'phone' | 'pattern' | 'none';
    /** Maps to core ServiceTicket columns for backward compat */
    coreMapping?: 'deviceBrand' | 'deviceModel' | 'imei';
}

export interface IndustryConfig {
    name: string;
    icon: any;
    bgIcons: any[];
    labels: {
        serviceTicket: string;
        serviceIdentifier: string;
        modelLabel: string;
        brandLabel: string;
        customerAsset: string;
        problemDesc: string;
        inventory: string;
        productLabel: string;
    };
    themeColor: string;
    features: string[];
    suggestedCategories: string[];
    businessAdvice: string;
    /** Dynamic fields rendered in the service ticket form */
    serviceFormFields: FieldDef[];
    /** Dynamic fields rendered in the stock/product form */
    inventoryFormFields: FieldDef[];
    /** Common accessories received with the service item */
    accessories?: string[];
}

export const industries: Record<IndustryType, IndustryConfig> = {
    PHONE_REPAIR: {
        name: "Telefon Tamiri",
        icon: Smartphone,
        bgIcons: [Smartphone, Battery, Cpu, Wifi, Wrench],
        labels: {
            serviceTicket: "Teknik Servis",
            serviceIdentifier: "IMEI / Seri No",
            modelLabel: "Model",
            brandLabel: "Marka",
            customerAsset: "Cihaz",
            problemDesc: "Arıza Açıklaması",
            inventory: "Yedek Parça Stoğu",
            productLabel: "Parça / Aksesuar",
        },
        themeColor: "blue",
        features: ["SERVICE", "STOCK", "SALE", "FINANCE", "LOYALTY", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Ekranlar", "Bataryalar", "Kılıf & Koruyucular", "Şarj Aletleri", "Anakart Parçaları"],
        businessAdvice: "Hızlı servis ve orijinal parça kullanımı müşteri sadakatini artırır. Stoklarınızı her zaman güncel tutun.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Marka", type: "select", options: ["Apple", "Samsung", "Xiaomi", "Huawei", "Oppo", "Vivo", "Realme", "Infinix", "Techno", "Poco", "General Mobile", "Casper", "Reeder", "Asus", "Sony", "Nokia", "Motorola", "Pixel", "Meizu", "OnePlus", "Honor", "TCL", "ZTE", "Lenovo", "LG", "Diğer"], required: true, placeholder: "Marka seçin...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Model", type: "text", required: true, placeholder: "iPhone 14 Pro, Galaxy S23...", coreMapping: "deviceModel" },
            { key: "imei", label: "IMEI Numarası", type: "text", placeholder: "15 haneli IMEI numarası", validate: "imei", coreMapping: "imei" },
            { key: "batteryHealth", label: "Pil Sağlığı (%)", type: "number", placeholder: "85" },
            { key: "cosmeticCondition", label: "Kozmetik Durum", type: "select", options: ["Çok İyi", "İyi", "Orta", "Kötü"] },
            { key: "devicePassword", label: "Cihaz Şifresi", type: "text", placeholder: "Şifre veya Desen", validate: "pattern" },
        ],
        inventoryFormFields: [
            { key: "compatibility", label: "Uyumlu Modeller", type: "text", placeholder: "iPhone 13/14 serisi" },
            { key: "color", label: "Renk", type: "text", placeholder: "Siyah, Beyaz..." },
            { key: "quality", label: "Kalite", type: "select", options: ["Orjinal", "A+ Kalite", "A Kalite", "Muadil"] },
        ],
        accessories: ["Şarj Aleti", "Kutu", "Kılıf", "SIM Kart", "Hafıza Kartı"],
    },

    ELECTRICIAN: {
        name: "Elektrik Servis",
        icon: Zap,
        bgIcons: [Zap, Plug, Lightbulb, CircuitBoard, Battery],
        labels: {
            serviceTicket: "Arıza Kaydı",
            serviceIdentifier: "Sayaç No",
            modelLabel: "Sistem / Ünite",
            brandLabel: "Bölge / Kat",
            customerAsset: "Elektrik Tesisatı",
            problemDesc: "Şikayet / Arıza Notu",
            inventory: "Malzeme Deposu",
            productLabel: "Malzeme",
        },
        themeColor: "amber",
        features: ["SERVICE", "STOCK", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Kablolar", "Sigortalar", "Anahtar & Priz", "Aydınlatma", "El Aletleri"],
        businessAdvice: "İleri tarihli arıza kayıtları için ajanda modülünü kullanın. Malzeme eksiklerini stok asistanı ile takip edin.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Bölge / Kat", type: "text", required: true, placeholder: "3. Kat, Daire 5...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Sistem / Ünite", type: "text", required: true, placeholder: "Sigorta Paneli, Priz...", coreMapping: "deviceModel" },
            { key: "imei", label: "Sayaç No", type: "text", placeholder: "Sayaç numarası", coreMapping: "imei" },
            { key: "voltageLevel", label: "Voltaj Seviyesi", type: "text", placeholder: "220V, 380V..." },
            { key: "emergency", label: "Acil Durum?", type: "select", options: ["Evet", "Hayır"] },
        ],
        inventoryFormFields: [
            { key: "voltage", label: "Voltaj", type: "text", placeholder: "220V" },
            { key: "amperage", label: "Amper", type: "text", placeholder: "16A" },
            { key: "brand", label: "Marka", type: "text", placeholder: "Schneider, ABB..." },
        ],
        accessories: ["Sigorta", "Kablo", "Priz", "Anahtar / Buton"],
    },

    PLUMBING: {
        name: "Su & Tesisat",
        icon: Droplet,
        bgIcons: [Droplet, Waves, Wrench, Box, Settings2],
        labels: {
            serviceTicket: "Servis Formu",
            serviceIdentifier: "Abone No",
            modelLabel: "Tesisat Türü",
            brandLabel: "Malzeme Markası",
            customerAsset: "Tesisat Sistemi",
            problemDesc: "Sızıntı / Arıza Detayı",
            inventory: "Ekipman & Parça",
            productLabel: "Malzeme",
        },
        themeColor: "cyan",
        features: ["SERVICE", "STOCK", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Musluk & Batarya", "Boru & Ek Parçalar", "Vana & Fitting", "Gider Malzemeleri", "Sızdırmazlık"],
        businessAdvice: "Yapılan her müdahaleyi servis formuna kaydedin, parça değişimlerini stoktan otomatik düşürün.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Malzeme Markası", type: "text", required: true, placeholder: "Viega, Bosch...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Tesisat Türü", type: "text", required: true, placeholder: "Sıhhi Tesisat, Doğalgaz...", coreMapping: "deviceModel" },
            { key: "imei", label: "Abone No", type: "text", placeholder: "Abone numarası", coreMapping: "imei" },
            { key: "leakArea", label: "Sızıntı Bölgesi", type: "text", placeholder: "Mutfak, Banyo, Teras..." },
            { key: "buildingFloor", label: "Kat", type: "text", placeholder: "2. Kat" },
        ],
        inventoryFormFields: [
            { key: "diameter", label: "Çap (mm)", type: "text", placeholder: "1/2\", 3/4\"" },
            { key: "material", label: "Malzeme Türü", type: "select", options: ["PVC", "Galvaniz", "Bakır", "PPR", "PEX"] },
            { key: "brand", label: "Marka", type: "text", placeholder: "Güven, Wavin..." },
        ],
        accessories: ["Vana", "Boru", "Uzatma", "Batarya / Musluk"],
    },

    COMPUTER_REPAIR: {
        name: "Bilgisayar & Bilişim",
        icon: Monitor,
        bgIcons: [Monitor, HardDrive, Mouse, Keyboard, Cpu],
        labels: {
            serviceTicket: "Teknik Destek",
            serviceIdentifier: "Seri No / Lisans No",
            modelLabel: "Donanım Özellikleri",
            brandLabel: "Marka / Model",
            customerAsset: "Bilgisayar / Sunucu",
            problemDesc: "Sorun Özeti",
            inventory: "Hardware & Yazılım",
            productLabel: "Bileşen",
        },
        themeColor: "indigo",
        features: ["SERVICE", "STOCK", "SALE", "FINANCE", "LOYALTY", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["SSD / HDD", "RAM Bellek", "Ekran Kartları", "Yazılım / Lisans", "Aksesuar"],
        businessAdvice: "Müşterilere periyodik bakım (termal macun, donanım temizliği) hatırlatmaları göndererek gelirinizi artırın.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Marka / Model", type: "text", required: true, placeholder: "Asus ROG G15, HP EliteBook...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Donanım Özellikleri", type: "text", required: true, placeholder: "i5 8GB RAM 256GB SSD...", coreMapping: "deviceModel" },
            { key: "imei", label: "Seri No / Lisans No", type: "text", placeholder: "Seri numarası", coreMapping: "imei" },
            { key: "os", label: "İşletim Sistemi", type: "select", options: ["Windows 11", "Windows 10", "macOS", "Linux", "ChromeOS"] },
            { key: "hasPower", label: "Cihaz Açılıyor mu?", type: "select", options: ["Evet", "Hayır", "Kısmen"] },
            { key: "devicePassword", label: "Giriş Şifresi", type: "text", placeholder: "Oturum açma şifresi", validate: "pattern" },
        ],
        inventoryFormFields: [
            { key: "compatibility", label: "Uyumluluk", type: "text", placeholder: "Intel LGA1700, DDR5..." },
            { key: "capacity", label: "Kapasite", type: "text", placeholder: "1TB, 32GB..." },
            { key: "generation", label: "Nesil / Versiyon", type: "text", placeholder: "Gen 13, PCIe 4.0..." },
        ],
        accessories: ["Adaptör", "Çanta", "Fare", "Klavye", "USB Bellek"],
    },

    GROCERY: {
        name: "Market & Bakkal",
        icon: ShoppingCart,
        bgIcons: [ShoppingCart, ShoppingBasket, Scale, Tag, Carrot],
        labels: {
            serviceTicket: "Sipariş Kaydı",
            serviceIdentifier: "Barkod No",
            modelLabel: "Birim / Paket",
            brandLabel: "Marka / Üretici",
            customerAsset: "Ürün Portföyü",
            problemDesc: "Not / Açıklama",
            inventory: "Market Rafı",
            productLabel: "Ürün",
        },
        themeColor: "emerald",
        features: ["STOCK", "SALE", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Temel Gıda", "Atıştırmalık", "İçecek & Meşrubat", "Temizlik Ürünleri", "Kişisel Bakım"],
        businessAdvice: "Cari hesap takibi ile veresiye müşterilerinizi yönetin. En çok satan ürünleri stok analizinden takip edin.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Marka / Üretici", type: "text", required: true, placeholder: "Ülker, Migros...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Birim / Paket", type: "text", required: true, placeholder: "1 kg, 500 ml, 6'lı paket...", coreMapping: "deviceModel" },
            { key: "imei", label: "Barkod No", type: "text", placeholder: "Barkod numarası", coreMapping: "imei" },
        ],
        inventoryFormFields: [
            { key: "unit", label: "Birim", type: "select", options: ["Adet", "Kg", "Litre", "Gram", "Paket", "Koli"] },
            { key: "expiryMonths", label: "Raf Ömrü (Ay)", type: "number", placeholder: "12" },
            { key: "category", label: "Ürün Grubu", type: "text", placeholder: "Süt Ürünleri, Gıda..." },
        ],
        accessories: ["Poşet", "Paketleme", "Fatura / Fiş"],
    },

    CLOTHING: {
        name: "Giyim & Tekstil",
        icon: Shirt,
        bgIcons: [Shirt, Scissors, Ruler, Tag, Package],
        labels: {
            serviceTicket: "Özel Dikim / Tadilat",
            serviceIdentifier: "Ürün Kodu",
            modelLabel: "Beden / Kalıp",
            brandLabel: "Marka / Koleksiyon",
            customerAsset: "Kıyafet",
            problemDesc: "Tadilat Notu",
            inventory: "Askıdaki Ürünler",
            productLabel: "Ürün",
        },
        themeColor: "rose",
        features: ["SERVICE", "STOCK", "SALE", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Pantolon Tadilat", "Ceket / Mont", "Gömlek / Bluz", "Özel Dikim", "Kumaş Satış"],
        businessAdvice: "Tadilat işlerinde teslimat tarihini SMS/WhatsApp ile hatırlatarak dükkan trafiğinizi yönetin.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Marka / Koleksiyon", type: "text", required: true, placeholder: "Zara, H&M, Yerel Atölye...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Beden / Kalıp", type: "text", required: true, placeholder: "M, L, XL, 42...", coreMapping: "deviceModel" },
            { key: "imei", label: "Ürün Kodu", type: "text", placeholder: "SKU / Ürün kodu", coreMapping: "imei" },
            { key: "color", label: "Renk", type: "text", placeholder: "Lacivert, Kırmızı..." },
            { key: "fabric", label: "Kumaş", type: "select", options: ["Pamuk", "Polyester", "Yün", "İpek", "Denim", "Karışık"] },
        ],
        inventoryFormFields: [
            { key: "size", label: "Beden", type: "text", placeholder: "S, M, L, XL" },
            { key: "color", label: "Renk", type: "text", placeholder: "Siyah, Beyaz..." },
            { key: "season", label: "Sezon", type: "select", options: ["İlkbahar/Yaz", "Sonbahar/Kış", "Her Sezon"] },
        ],
        accessories: ["Askı", "Kılıf (Koruyucu)", "Hediye Paketi", "Ekstra Düğme"],
    },

    GENERAL: {
        name: "Genel Teknik Servis",
        icon: Settings2,
        bgIcons: [Settings2, Wrench, Hammer, Box, Package],
        labels: {
            serviceTicket: "İş Emri",
            serviceIdentifier: "Takip Numarası",
            modelLabel: "Ürün / Model",
            brandLabel: "Üretici",
            customerAsset: "Ürün",
            problemDesc: "İş Detayı",
            inventory: "Stok Listesi",
            productLabel: "Ürün",
        },
        themeColor: "slate",
        features: ["SERVICE", "STOCK", "SALE", "FINANCE", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Ek Hizmetler", "Malzeme Satışı", "Bakım / Onarım", "Yedek Parça", "Diğer"],
        businessAdvice: "Sistemin esnek yapısını dükkanınıza göre özelleştirin, tüm giderlerinizi finans bölümünden kaydedin.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Üretici / Marka", type: "text", required: true, placeholder: "Marka adı...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Model / Tip", type: "text", required: true, placeholder: "Model adı...", coreMapping: "deviceModel" },
            { key: "imei", label: "Seri / Takip No", type: "text", placeholder: "Seri numarası", coreMapping: "imei" },
        ],
        inventoryFormFields: [
            { key: "unit", label: "Birim", type: "select", options: ["Adet", "Kg", "Litre", "Metre", "Paket"] },
            { key: "brand", label: "Marka", type: "text", placeholder: "Marka adı" },
        ],
        accessories: ["Kutu / Paket", "Fatura", "Kullanım Kılavuzu"],
    },

    AUTOMOTIVE: {
        name: "Oto Servis & Parça",
        icon: Car,
        bgIcons: [Car, Gauge, Fuel, Key, Wrench],
        labels: {
            serviceTicket: "Servis Kaydı",
            serviceIdentifier: "Plaka / Şase",
            modelLabel: "Model / Yıl",
            brandLabel: "Marka",
            customerAsset: "Araç",
            problemDesc: "Arıza Şikayeti",
            inventory: "Yedek Parça",
            productLabel: "Parça",
        },
        themeColor: "orange",
        features: ["SERVICE", "STOCK", "SALE", "FINANCE", "APPOINTMENT", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Motor Yağları", "Fren Sistemleri", "Aydınlatma", "Filtre Grupları", "Debriyaj & Şanzıman"],
        businessAdvice: "Araç plakası üzerinden geçmiş işlemleri takip ederek müşterilerinize güven verin.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Marka", type: "text", required: true, placeholder: "BMW, Audi, Fiat...", coreMapping: "deviceBrand" },
            { key: "deviceModel", label: "Model / Yıl", type: "text", required: true, placeholder: "320i 2015, Egea 2020...", coreMapping: "deviceModel" },
            { key: "imei", label: "Plaka / Şase", type: "text", placeholder: "34 ABC 123", coreMapping: "imei" },
            { key: "fuelLevel", label: "Yakıt Seviyesi", type: "select", options: ["1/4", "1/2", "3/4", "Full"] },
            { key: "millage", label: "Kilometre", type: "number", placeholder: "120000" },
        ],
        inventoryFormFields: [
            { key: "oemNo", label: "OEM Kod", type: "text", placeholder: "Parça kodu..." },
            { key: "compatibility", label: "Uyumlu Araçlar", type: "text", placeholder: "VAG Grubu, Ford..." },
        ],
        accessories: ["Stepne", "Kriko", "Ruhsat", "Anahtar"],
    },

    BARBER: {
        name: "Berber & Kuaför",
        icon: Scissors,
        bgIcons: [Scissors, User, Wind, SparklesIcon, Settings2],
        labels: {
            serviceTicket: "Hizmet Kaydı",
            serviceIdentifier: "Koltuk No",
            modelLabel: "Hizmet Türü",
            brandLabel: "Personel",
            customerAsset: "Müşteri Profili",
            problemDesc: "Özel İstek / Notlar",
            inventory: "Kozmetik Stok",
            productLabel: "Ürün",
        },
        themeColor: "purple",
        features: ["SALE", "FINANCE", "LOYALTY", "APPOINTMENT", "CRM", "DEBT", "SUPPLIER", "STAFF", "NOTIFICATION"],
        suggestedCategories: ["Saç Kesim", "Sakal Traşı", "Cilt Bakımı", "Kozmetik Ürünler", "Paket Hizmetler"],
        businessAdvice: "Randevu sistemi ile müşteri bekleme süresini azaltın, sadakat puanları ile geri dönüşleri artırın.",
        serviceFormFields: [
            { key: "deviceBrand", label: "Personel", type: "text", required: true, placeholder: "Usta adı..." },
            { key: "deviceModel", label: "Hizmet Türü", type: "text", required: true, placeholder: "Kesim, Boya, Bakım..." },
            { key: "imei", label: "Koltuk / Sıra", type: "text", placeholder: "Vip Koltuk, 1 Nolu..." },
        ],
        inventoryFormFields: [
            { key: "volume", label: "Hacim (ml)", type: "text", placeholder: "500ml" },
            { key: "brand", label: "Marka", type: "text", placeholder: "Loreal, Fonex..." },
        ],
        accessories: ["Önlük", "Havlu", "Set"],
    },
};
