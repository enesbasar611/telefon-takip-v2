import prisma from "@/lib/prisma";

/**
 * Checks if the user's shop has e-Invoice module enabled and a valid tax number.
 */
export async function checkUserEInvoiceStatus(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                shopId: true,
                role: true,
                email: true
            }
        });

        if (!user || (!user.shopId && user.role !== "SUPER_ADMIN")) {
            return false;
        }

        // Super Admin bypass or specific shop check
        const shop = await prisma.shop.findUnique({
            where: { id: user.shopId || undefined },
            select: {
                isEInvoiceEnabled: true,
                taxNumber: true
            }
        });

        if (!shop) return false;

        return !!(shop.isEInvoiceEnabled && shop.taxNumber);
    } catch (error) {
        console.error("checkUserEInvoiceStatus error:", error);
        return false;
    }
}
