const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const shops = await prisma.shop.findMany({
        select: { id: true, name: true, createdAt: true }
    });
    console.log('All Shops:', JSON.stringify(shops, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
