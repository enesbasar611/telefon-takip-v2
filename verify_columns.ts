import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Checking Product table...")
    const product = await prisma.product.findFirst({
      select: { isChronic: true }
    })
    console.log("Product.isChronic exists.")
  } catch (e) {
    console.error("Product.isChronic MISSING:", e)
  }

  try {
    console.log("Checking ServiceTicket table...")
    const ticket = await prisma.serviceTicket.findFirst({
      select: { overhead: true }
    })
    console.log("ServiceTicket.overhead exists.")
  } catch (e) {
    console.error("ServiceTicket.overhead MISSING:", e)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
