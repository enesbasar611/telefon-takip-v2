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
      password: "secure_password_hash", // In a real app, this would be hashed
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
