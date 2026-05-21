const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allShortages = await prisma.shortageItem.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, shopId: true, assignedToId: true, isResolved: true, createdAt: true }
    });
    console.log('Last 10 Shortage Items:', JSON.stringify(allShortages, null, 2));

    const count = await prisma.shortageItem.count();
    console.log('Total Shortage Count:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
