import prisma from "@/lib/prisma";

async function main() {
    const categories = await prisma.category.findMany();
    console.log("Categoriler:", JSON.stringify(categories, null, 2));
}

main().catch(console.error);
