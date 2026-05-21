const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const shopId = 'cmpevhbu8000hmer8aqoq47ml';
    const staff = await prisma.user.findMany({
        where: { shopId: shopId },
        select: { id: true, name: true, surname: true, role: true, email: true, isApproved: true }
    });
    console.log('Staff for Enes Dükkanı:', JSON.stringify(staff, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
