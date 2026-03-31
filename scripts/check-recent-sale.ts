import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRecentSale() {
    const latestSale = await prisma.sale.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { items: true, customer: true }
    });

    console.log("Latest Sale:", JSON.stringify(latestSale, null, 2));
}

checkRecentSale()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
