const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUPER_ADMIN_EMAILS = [
    "qwerty61.enes@gmail.com",
];

async function main() {
    const result = await prisma.user.updateMany({
        where: {
            email: { notIn: SUPER_ADMIN_EMAILS },
            role: { not: "SUPER_ADMIN" }
        },
        data: {
            isApproved: false,
            verificationCode: null // Forces them to request a new one
        }
    });
    console.log(`Updated ${result.count} users to unapproved state.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
