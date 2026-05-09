import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        const templates = await (prisma as any).industryTemplate.findMany();
        console.log("SUCCESS:", templates.length);
    } catch (e: any) {
        console.error("ERROR:", e.message);
    }
}
main().catch(console.error);
