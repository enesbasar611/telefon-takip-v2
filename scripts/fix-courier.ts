import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "osmanhizli@basarteknik.com";
    const plainPassword = "123456";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            isApproved: true,
            role: "COURIER"
        }
    });

    console.log("User updated successfully:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
