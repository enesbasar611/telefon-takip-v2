const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const osmanId = 'cmoxn05fp000ho5aby745agfh';
    const tasks = await prisma.shortageItem.findMany({
        where: { assignedToId: osmanId },
        select: { id: true, name: true, quantity: true, isResolved: true, createdAt: true }
    });
    console.log('Tasks for Osman:', JSON.stringify(tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
