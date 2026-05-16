
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const basarTeknikId = 'cmo2vevln0000n64h6x8b4zha';
    const users = await prisma.user.findMany({
        where: { shopId: basarTeknikId }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
