import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database (SaaS Migration Initial)...");

  // 1. Create a Default Shop
  let shop = await prisma.shop.findFirst({
    where: { phone: "5551234567" }
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: "Merkez Şube",
        phone: "5551234567",
        address: "Merkez Mh. Başar Sk. No: 1",
      }
    });
  }

  // 2. Create a Default Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@takipv2.com" },
    update: {
      shopId: shop.id,
    },
    create: {
      email: "admin@takipv2.com",
      name: "Admin Kullanıcı",
      password: "$2a$10$7vjT.FjP4S2I2F6Zq6rS6.fXg8vGj9r6r6r6r6r6r6r6r6r6r6r6", // BCrypt for "123456"
      role: Role.ADMIN,
      shopId: shop.id,
    },
  });

  console.log("Seeding completed successfully! Default shop ID:", shop.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
