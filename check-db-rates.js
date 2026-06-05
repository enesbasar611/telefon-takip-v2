
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
    const settings = await prisma.setting.findMany({
        where: { key: { in: ["exchange_rate_usd", "exchange_rate_eur", "exchange_rate_ga"] } }
    });
    console.log("Database Settings:", JSON.stringify(settings, null, 2));
}
check();
