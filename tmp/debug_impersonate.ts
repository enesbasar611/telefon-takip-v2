import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "qwerty61.enes@gmail.com";
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, shopId: true }
    });

    console.log("Current User state:", user);

    if (!user) {
        console.log("User not found");
        return;
    }

    // List some other shops
    const shops = await prisma.shop.findMany({
        take: 3,
        select: { id: true, name: true }
    });
    console.log("Available shops:", shops);

    const targetShop = shops.find(s => s.id !== user.shopId);
    if (targetShop) {
        console.log(`Attempting to impersonate: ${targetShop.name} (${targetShop.id})`);
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { shopId: targetShop.id }
        });
        console.log("Updated User state:", { id: updated.id, shopId: updated.shopId });
    } else {
        console.log("No other shop found to impersonate.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
