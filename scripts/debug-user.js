const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'osmanhizli@basarteknik.com' },
        include: { shop: true }
    });
    console.log('User:', JSON.stringify(user, null, 2));

    if (user && user.shopId) {
        const staff = await prisma.user.findMany({
            where: { shopId: user.shopId }
        });
        console.log('Staff in same shop:', JSON.stringify(staff, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
