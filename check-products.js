
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.product.findMany({
        where: { buyPrice: { gt: 100000 } },
        select: { id: true, name: true, buyPrice: true, buyPriceUsd: true, sellPrice: true, sellPriceUsd: true, shopId: true },
        take: 10
    });
    console.log("Inflated Products:", JSON.stringify(products, null, 2));
}
check();
