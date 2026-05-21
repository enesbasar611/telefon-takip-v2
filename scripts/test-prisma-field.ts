import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const criticalProducts = await prisma.product.findMany({
        where: {
            stock: {
                lte: (prisma.product as any).fields?.criticalStock ?? 1
            }
        },
        select: { id: true, name: true, stock: true, criticalStock: true }
    });
    console.log("Critical Products:", criticalProducts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
