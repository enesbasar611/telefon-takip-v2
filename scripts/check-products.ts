import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, stock: true, criticalStock: true, shopId: true },
        take: 50
    });
    console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
