import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const shopId = "cmo2vevln0000n64h6x8b4zha";
    const shop = await prisma.shop.findUnique({
        where: { id: shopId }
    });
    console.log(JSON.stringify(shop, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
