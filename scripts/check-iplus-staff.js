const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const shopId = 'cmoiqmzj2000rj5uxt0u2syrb'; // iPlus store
    const staff = await prisma.user.findMany({
        where: { shopId: shopId },
        select: { id: true, name: true, role: true, email: true }
    });
    console.log('Staff for iPlus store:', JSON.stringify(staff, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
