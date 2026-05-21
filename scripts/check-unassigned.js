const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const shopId = 'cmo2vevln0000n64h6x8b4zha'; // Başar Teknik
    const unassigned = await prisma.shortageItem.findMany({
        where: { shopId: shopId, assignedToId: null, isResolved: false },
        select: { id: true, name: true, quantity: true, createdAt: true }
    });
    console.log('Unassigned Shortages for Başar Teknik:', JSON.stringify(unassigned, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
