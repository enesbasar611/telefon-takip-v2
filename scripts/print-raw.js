const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inv = await prisma.eDMInvoice.findFirst({
        where: { invoiceId: 'INV-1781526983537' }
    });
    if (inv) {
        console.log("RAW_RESPONSE_OUTPUT:");
        console.log(inv.rawResponse);
    } else {
        console.log("Invoice not found in DB");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
