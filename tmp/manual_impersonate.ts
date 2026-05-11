import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "qwerty61.enes@gmail.com";
    const shopName = "iPlus store";

    const shop = await prisma.shop.findFirst({ where: { name: shopName } });
    if (!shop) {
        console.log("Target shop not found");
        return;
    }

    const updated = await prisma.user.update({
        where: { email },
        data: { shopId: shop.id }
    });
    console.log(`Manually set shopId to ${shopName} (${shop.id}) for user ${email}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
