const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const shopId = 'cmo2vevln0000n64h6x8b4zha';
    const staff = await prisma.user.findMany({
        where: { shopId: shopId },
        select: { id: true, name: true, surname: true, role: true, email: true, isApproved: true }
    });
    console.log('All Staff for Shop:', JSON.stringify(staff, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
