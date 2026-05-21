const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'osmanhizli@basarteknik.com' }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User ID:', user.id);
        console.log('User ShopID:', user.shopId);

        const items = await prisma.shortageItem.findMany({
            where: { assignedToId: user.id },
            include: {
                shop: { select: { name: true } },
                product: { select: { name: true } }
            }
        });

        console.log('Items Count:', items.length);
        console.log('Items:', JSON.stringify(items, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
