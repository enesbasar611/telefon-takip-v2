/**
 * Loyalty Engine
 * Logic for calculating and managing customer loyalty points
 */
import { getSettings } from "./actions/setting-actions";
import prisma from "./prisma";

interface LoyaltyCalculationResult {
    earnedPoints: number;
    eligibleRevenue: number;
}

/**
 * Calculates how many loyalty points should be earned for a specific transaction
 * 
 * @param partsList Items or parts sold/used
 * @param laborCost Cost of labor (if any)
 * @param discountAmount Any discounts applied
 * @param shopId Shop ID to check categories
 * @returns Earned points and the revenue that was eligible
 */
export async function calculateLoyaltyPoints(
    partsList: { productId: string; quantity: number; unitPrice: number | string }[],
    laborCost: number,
    discountAmount: number,
    shopId: string
): Promise<LoyaltyCalculationResult> {
    try {
        const settings = await getSettings();
        const config = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));
        const loyaltyEnabled = config.loyalty_enabled !== "false";

        if (!loyaltyEnabled) {
            return { earnedPoints: 0, eligibleRevenue: 0 };
        }

        // Exclude specific categories (e.g. Device Sales) from accumulating loyalty points
        // Assuming "Telefonlar" (Phones) is an excluded category
        const allCategories = await prisma.category.findMany({ where: { shopId } });
        const telefonlarCat = allCategories.find(c => c.name.toLowerCase() === "telefonlar");

        const excludedCategoryIds = new Set<string>();
        if (telefonlarCat) {
            excludedCategoryIds.add(telefonlarCat.id);
            const findChildren = (parentId: string) => {
                allCategories.filter(c => c.parentId === parentId).forEach(child => {
                    excludedCategoryIds.add(child.id);
                    findChildren(child.id);
                });
            };
            findChildren(telefonlarCat.id);
        }

        // Calculate eligible revenue (filter out parts in excluded categories)
        // Fetch product category IDs
        const productIds = partsList.map(p => p.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, shopId },
            select: { id: true, categoryId: true }
        });

        const productCategoryMap = new Map<string, string | null>();
        products.forEach(p => productCategoryMap.set(p.id, p.categoryId));

        const eligiblePartsTotal = partsList.reduce((acc, part) => {
            const catId = productCategoryMap.get(part.productId);
            const isExcluded = catId && excludedCategoryIds.has(catId);
            return isExcluded ? acc : acc + (Number(part.unitPrice) * part.quantity);
        }, 0);

        const eligibleRevenue = Math.max(0, (eligiblePartsTotal + Number(laborCost)) - discountAmount);
        let earnedPoints = 0;

        if (eligibleRevenue > 0) {
            const spendThreshold = Number(config.loyalty_service_spend_threshold) || 10000;
            const pointsRate = Number(config.loyalty_service_points_earned) || 1000;

            // Formula: For every X spent, earn Y points.
            earnedPoints = Math.floor((eligibleRevenue / spendThreshold) * pointsRate);
        }

        return { earnedPoints, eligibleRevenue };
    } catch (err) {
        console.error("Loyalty point calculation error:", err);
        return { earnedPoints: 0, eligibleRevenue: 0 };
    }
}
