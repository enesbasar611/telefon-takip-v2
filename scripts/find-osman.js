const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'Osman', mode: 'insensitive' } },
                    { email: { contains: 'osman', mode: 'insensitive' } }
                ]
            }
        });
        console.log('Found Users:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
