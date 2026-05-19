import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting mass update of critical stock levels...');

    const result = await prisma.product.updateMany({
        data: {
            criticalStock: 1,
        },
    });

    process.stdout.write(`Updated ${result.count} products to criticalStock = 1.\n`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
