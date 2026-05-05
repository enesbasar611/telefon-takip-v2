
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                email: true,
                dashboardLayout: true
            }
        });
        console.log("USERS IN DB:", JSON.stringify(users, null, 2));
    } catch (e: any) {
        console.error("DB ERROR:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
