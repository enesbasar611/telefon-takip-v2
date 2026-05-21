const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const shopId = 'cmpevhbu8000hmer8aqoq47ml'; // Enes Dükkanı
    const unassigned = await prisma.shortageItem.findMany({
        where: { shopId: shopId, assignedToId: null, isResolved: false },
        select: { id: true, name: true, quantity: true, createdAt: true }
    });
    console.log('Unassigned Shortages for Enes Dükkanı:', JSON.stringify(unassigned, null, 2));

    const allTasks = await prisma.shortageItem.findMany({
        where: { shopId: shopId }
    });
    console.log('All Shortage Items for Enes Dükkanı:', JSON.stringify(allTasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
