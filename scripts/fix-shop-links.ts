
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const osmanId = 'cmoxn05fp000ho5aby745agfh';
    const basarTeknikId = 'cmo2vevln0000n64h6x8b4zha';
    const enesId = 'cmo2v9oi2001toqh6cco9qxs7'; // qwerty61.enes@gmail.com

    // 1. Move Osman back to Başar Teknik
    await prisma.user.update({
        where: { id: osmanId },
        data: {
            shopId: basarTeknikId
        }
    });
    console.log('Osman Hızlı moved to Başar Teknik.');

    // 2. Link Enes (Super Admin) to Başar Teknik
    await prisma.user.update({
        where: { id: enesId },
        data: {
            shopId: basarTeknikId
        }
    });
    console.log('Enes (Super Admin) linked to Başar Teknik.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
