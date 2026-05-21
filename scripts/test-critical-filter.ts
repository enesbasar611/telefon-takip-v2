
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const p1 = await prisma.product.findMany({
        where: {
            stock: { lte: prisma.product.fields.criticalStock }
        },
        select: { name: true, stock: true, criticalStock: true }
    });
    console.log('LTE criticalStock count:', p1.length);

    const p0 = await prisma.product.findMany({
        where: {
            stock: 0
        },
        select: { name: true, stock: true, criticalStock: true }
    });
    console.log('Stock 0 count:', p0.length);

    const missing = p0.filter(p => !p1.some(cp => cp.name === p.name));
    console.log('Stock 0 but NOT in critical list:', missing.map(m => m.name));
}

main().catch(console.error);
