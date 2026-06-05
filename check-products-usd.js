
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.product.findMany({
        where: { OR: [{ buyPriceUsd: { gt: 10000 } }, { sellPriceUsd: { gt: 10000 } }] },
        select: { id: true, name: true, buyPrice: true, buyPriceUsd: true, sellPrice: true, sellPriceUsd: true, shopId: true },
        take: 10
    });
    console.log("Inflated USD Products:", JSON.stringify(products, null, 2));
}
check();
