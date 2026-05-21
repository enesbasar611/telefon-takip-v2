const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const items = await prisma.shortageItem.findMany({
            where: { name: 'Note 8 Pro Şarj Bord' }
        });
        items.forEach(item => {
            console.log('---');
            console.log('Item ID:', item.id);
            console.log('AssignedToId:', JSON.stringify(item.assignedToId));
            console.log('AssignedToId Length:', item.assignedToId?.length);
        });

        const user = await prisma.user.findFirst({ where: { email: 'osmanhizli@basarteknik.com' } });
        console.log('---');
        console.log('User ID:', JSON.stringify(user.id));
        console.log('User ID Length:', user.id.length);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
