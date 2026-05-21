const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const items = await prisma.shortageItem.findMany({
            include: { assignedTo: { select: { email: true, name: true } } }
        });
        console.log('Total Count:', items.length);
        const stats = items.reduce((acc, item) => {
            const key = item.assignedTo?.email || 'unassigned';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.log('Stats:', JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
