const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const invs = await prisma.eDMInvoice.findMany({
        where: { status: 'SENT' },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log("SENT_INVOICES_DATA:");
    console.log(JSON.stringify(invs, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
