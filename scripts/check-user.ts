import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "osmanhizli@basarteknik.com";
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true, role: true, isApproved: true, shopId: true }
    });
    console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
