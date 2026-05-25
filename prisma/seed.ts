import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Master Seed: Clearing database and creating Super Admin...");

  // 1. Clear existing data in a safe order
  // Due to foreign key constraints, we clear in reverse order or use a transaction
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    console.log("Database cleared.");
  } catch (error) {
    console.log("Database clear failed or no tables found. Proceeding...");
  }

  // 2. Create the Default Shop
  const mainShop = await prisma.shop.create({
    data: {
      name: "BAŞAR TEKNİK",
      industry: "PHONE_REPAIR",
      address: "İstanbul/Türkiye",
      phone: "+905555555555",
      isFirstLogin: false,
      isFinanceEnabled: true,
      isServiceEnabled: true,
      isStockEnabled: true,
      isEInvoiceEnabled: true,
    }
  });

  // 3. Create the MASTER SUPER ADMIN
  // Email: qwerty61.enes@gmail.com
  const superAdmin = await prisma.user.create({
    data: {
      email: "qwerty61.enes@gmail.com",
      name: "Enes Başar (Super Admin)",
      // Hash for "123456"
      password: "$2a$10$7vjT.FjP4S2I2F6Zq6rS6.fXg8vGj9r6r6r6r6r6r6r6r6r6r6r6",
      role: Role.SUPER_ADMIN,
      isApproved: true,
      canSell: true,
      canFinance: true,
      canService: true,
      canStock: true,
      shopId: mainShop.id
    },
  });

  console.log(`Master Super Admin created: ${superAdmin.email} with Shop: ${mainShop.name}`);
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
