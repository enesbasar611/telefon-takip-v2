import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const invoice = await prisma.eDMInvoice.findFirst({
        where: { invoiceId: 'INV-1781526983537' }
    });
    console.log("Invoice Data:");
    console.log(JSON.stringify(invoice, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
