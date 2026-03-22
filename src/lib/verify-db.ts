import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const tableNames = [
      "User",
      "Customer",
      "ServiceTicket",
      "ServiceLog",
      "ServiceUsedPart",
      "Category",
      "Product",
      "SecondHandDevice",
      "InventoryMovement",
      "Sale",
      "SaleItem",
      "Transaction",
      "Debt",
      "Supplier",
      "PurchaseOrder",
      "Setting"
    ];

    console.log("Checking tables...");
    for (const name of tableNames) {
      // @ts-ignore
      await prisma[name.charAt(0).toLowerCase() + name.slice(1)].count();
      console.log(`- ${name} table exists.`);
    }
    console.log("\nAll tables verified successfully.");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
