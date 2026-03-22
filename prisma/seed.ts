import { PrismaClient, Role, ServiceStatus, TransactionType, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create a Default Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@takipv2.com" },
    update: {},
    create: {
      email: "admin@takipv2.com",
      name: "Admin Kullanıcı",
      password: "secure_password_hash", // In a real app, this would be hashed
      role: Role.ADMIN,
    },
  });

  const technician = await prisma.user.upsert({
    where: { email: "teknik@takipv2.com" },
    update: {},
    create: {
      email: "teknik@takipv2.com",
      name: "Tekniker Ahmet",
      password: "secure_password_hash",
      role: Role.TECHNICIAN,
    },
  });

  // 2. Create Customers
  const customers = [
    { name: "Ali Yılmaz", phone: "5551112233", email: "ali@example.com" },
    { name: "Ayşe Demir", phone: "5554445566", email: "ayse@example.com" },
    { name: "Mehmet Kaya", phone: "5557778899", email: "mehmet@example.com" },
    { name: "Fatma Şahin", phone: "5550001122", email: "fatma@example.com" },
    { name: "Can Özkan", phone: "5553334455", email: "can@example.com" },
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: c,
    });
    createdCustomers.push(customer);
  }

  // 3. Create Categories
  const categories = [
    { name: "Telefonlar" },
    { name: "Yedek Parçalar" },
    { name: "Aksesuarlar" },
    { name: "Kılıflar" },
    { name: "Bataryalar" },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }

  // 4. Create Products
  const products = [
    { name: "iPhone 15 Pro", category: "Telefonlar", buy: 60000, sell: 75000, stock: 5 },
    { name: "Samsung S24 Ultra", category: "Telefonlar", buy: 55000, sell: 68000, stock: 3 },
    { name: "iPhone 13 Ekran", category: "Yedek Parçalar", buy: 2500, sell: 4500, stock: 10 },
    { name: "iPhone 11 Batarya", category: "Bataryalar", buy: 800, sell: 1800, stock: 20 },
    { name: "Type-C Şarj Kablosu", category: "Aksesuarlar", buy: 200, sell: 550, stock: 50 },
    { name: "Silikon Kılıf (Çeşitli)", category: "Kılıflar", buy: 50, sell: 250, stock: 100 },
    { name: "Xiaomi Redmi Note 12", category: "Telefonlar", buy: 8000, sell: 11000, stock: 7 },
    { name: "Huawei Matepad 11", category: "Telefonlar", buy: 12000, sell: 15500, stock: 2 },
    { name: "AirPods Pro 2", category: "Aksesuarlar", buy: 6500, sell: 8200, stock: 8 },
    { name: "Samsung Watch 6", category: "Aksesuarlar", buy: 4500, sell: 6000, stock: 4 },
    { name: "Orijinal 20W Adaptör", category: "Aksesuarlar", buy: 600, sell: 950, stock: 15 },
    { name: "Kırılmaz Cam (Gizli)", category: "Aksesuarlar", buy: 30, sell: 150, stock: 200 },
    { name: "iPhone 14 Pro Max Kasa", category: "Yedek Parçalar", buy: 5000, sell: 8500, stock: 3 },
    { name: "Anker Soundcore Q30", category: "Aksesuarlar", buy: 2500, sell: 3800, stock: 6 },
    { name: "Logitech MX Master 3S", category: "Aksesuarlar", buy: 3000, sell: 4200, stock: 10 },
  ];

  const createdProducts = [];
  for (const p of products) {
    const cat = createdCategories.find((c) => c.name === p.category);
    const product = await prisma.product.create({
      data: {
        name: p.name,
        categoryId: cat!.id,
        buyPrice: p.buy,
        sellPrice: p.sell,
        stock: p.stock,
      },
    });
    createdProducts.push(product);
  }

  // 5. Create Service Tickets
  const serviceTickets = [
    {
      customer: createdCustomers[0],
      brand: "Apple",
      model: "iPhone 13",
      problem: "Ekran kırık, görüntü yok.",
      status: ServiceStatus.PENDING,
      cost: 4500,
    },
    {
      customer: createdCustomers[1],
      brand: "Samsung",
      model: "S21 FE",
      problem: "Şarj soketi değişimi.",
      status: ServiceStatus.REPAIRING,
      cost: 1200,
    },
    {
      customer: createdCustomers[2],
      brand: "Xiaomi",
      model: "Redmi Note 10",
      problem: "Sıvı teması, açılmıyor.",
      status: ServiceStatus.APPROVED,
      cost: 3500,
    },
    {
      customer: createdCustomers[3],
      brand: "Apple",
      model: "iPhone 11",
      problem: "Batarya sağlığı %75, değişim isteniyor.",
      status: ServiceStatus.READY,
      cost: 1800,
    },
    {
      customer: createdCustomers[4],
      brand: "Apple",
      model: "iPad Air 4",
      problem: "Dokunmatik basmıyor.",
      status: ServiceStatus.DELIVERED,
      cost: 3000,
    },
    {
      customer: createdCustomers[0],
      brand: "Huawei",
      model: "P40 Lite",
      problem: "Arka cam çatlak.",
      status: ServiceStatus.WAITING_PART,
      cost: 850,
    },
    {
      customer: createdCustomers[1],
      brand: "Apple",
      model: "Watch Series 7",
      problem: "Cam değişimi.",
      status: ServiceStatus.PENDING,
      cost: 2500,
    },
    {
      customer: createdCustomers[2],
      brand: "Oppo",
      model: "Reno 4",
      problem: "Hoparlörden ses gelmiyor.",
      status: ServiceStatus.REPAIRING,
      cost: 650,
    },
    {
      customer: createdCustomers[3],
      brand: "Apple",
      model: "iPhone XR",
      problem: "Yüz tanıma çalışmıyor.",
      status: ServiceStatus.READY,
      cost: 1500,
    },
    {
      customer: createdCustomers[4],
      brand: "Samsung",
      model: "A52",
      problem: "Kamera bulanık çekiyor.",
      status: ServiceStatus.CANCELLED,
      cost: 0,
    },
  ];

  for (let i = 0; i < serviceTickets.length; i++) {
    const s = serviceTickets[i];
    await prisma.serviceTicket.create({
      data: {
        ticketNumber: `SRV-${1000 + i + 1}`,
        customerId: s.customer.id,
        deviceBrand: s.brand,
        deviceModel: s.model,
        problemDesc: s.problem,
        status: s.status,
        estimatedCost: s.cost,
        createdById: admin.id,
        technicianId: s.status === ServiceStatus.REPAIRING ? technician.id : null,
        logs: {
          create: {
            message: "Sistem tarafından oluşturuldu.",
            status: s.status,
          },
        },
      },
    });
  }

  // 6. Create Transactions
  const transactions = [
    { desc: "Dükkan Kirası", amount: 15000, type: TransactionType.EXPENSE, method: PaymentMethod.TRANSFER },
    { desc: "Elektrik Faturası", amount: 1200, type: TransactionType.EXPENSE, method: PaymentMethod.CASH },
    { desc: "İnternet Faturası", amount: 450, type: TransactionType.EXPENSE, method: PaymentMethod.CARD },
    { desc: "Yemek Masrafı", amount: 3500, type: TransactionType.EXPENSE, method: PaymentMethod.CASH },
    { desc: "Aksesuar Satışı (Genel)", amount: 2500, type: TransactionType.INCOME, method: PaymentMethod.CASH },
    { desc: "Hızlı Tamir Geliri", amount: 1800, type: TransactionType.INCOME, method: PaymentMethod.CARD },
  ];

  for (const t of transactions) {
    await prisma.transaction.create({
      data: {
        description: t.desc,
        amount: t.amount,
        type: t.type,
        paymentMethod: t.method,
        userId: admin.id,
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
