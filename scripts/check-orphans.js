const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orphans = await prisma.user.findMany({
        where: { shopId: null },
        select: { id: true, name: true, surname: true, role: true, email: true, createdAt: true }
    });
    console.log('Orphaned Users (No ShopId):', JSON.stringify(orphans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
