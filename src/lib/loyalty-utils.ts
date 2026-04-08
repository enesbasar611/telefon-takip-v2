export type LoyaltyTier = "STANDART" | "GÜMÜŞ" | "ALTIN" | "PLATİN";

export interface LoyaltyTierInfo {
    name: LoyaltyTier;
    minPoints: number;
    maxPoints: number;
    color: string;
    benefits: string[];
    discountWorkmanship?: number;
    discountAccessories?: number;
    discountGeneral?: number;
}

export const LOYALTY_TIERS: LoyaltyTierInfo[] = [
    {
        name: "STANDART",
        minPoints: 0,
        maxPoints: 50,
        color: "slate",
        benefits: ["Standart Müşteri"],
    },
    {
        name: "GÜMÜŞ",
        minPoints: 51,
        maxPoints: 100,
        color: "zinc",
        benefits: ["Aksesuarlarda %10 indirim", "Öncelikli servis sırası"],
        discountAccessories: 0.1,
    },
    {
        name: "ALTIN",
        minPoints: 101,
        maxPoints: 150,
        color: "amber",
        benefits: ["İşçilik ücretinde %15 indirim", "Kılıf & Ekran Koruyucu hediyesi"],
        discountWorkmanship: 0.15,
    },
    {
        name: "PLATİN",
        minPoints: 151,
        maxPoints: 200,
        color: "purple",
        benefits: ["Tüm işlemlerde %20 indirim", "Ücretsiz cam filmi", "Parça maliyetine tamir"],
        discountGeneral: 0.2,
    },
];

export function getLoyaltyTier(points: number): LoyaltyTierInfo {
    return (
        LOYALTY_TIERS.find((t) => points >= t.minPoints && points <= t.maxPoints) ||
        LOYALTY_TIERS[LOYALTY_TIERS.length - 1]
    );
}

export function getPointsToNextTier(points: number): { nextLevel: string; pointsNeeded: number } | null {
    const currentLevelIndex = LOYALTY_TIERS.findIndex((t) => points >= t.minPoints && points <= t.maxPoints);
    if (currentLevelIndex === -1 || currentLevelIndex === LOYALTY_TIERS.length - 1) return null;

    const nextTier = LOYALTY_TIERS[currentLevelIndex + 1];
    return {
        nextLevel: nextTier.name,
        pointsNeeded: nextTier.minPoints - points,
    };
}

export function generateLoyaltyWhatsAppMessage(customerName: string, earned: number, total: number) {
    const nextInfo = getPointsToNextTier(total);
    const remainingText = nextInfo
        ? `\n\n${nextInfo.nextLevel} olmanıza sadece ${nextInfo.pointsNeeded} puan kaldı! 🚀`
        : "\n\nŞu an en üst seviye olan PLATİN seviyesindesiniz! Teşekkür ederiz. 🌟";

    return `*${customerName}*, servis işleminiz tamamlandı!\nBu işlemden ${earned} puan kazandınız.\nToplam puanınız: *${total}/200*.${remainingText}`;
}
