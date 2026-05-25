-- CreateEnum
CREATE TYPE "EDMInvoiceType" AS ENUM ('EINVOICE', 'EARCHIVE');

-- CreateEnum
CREATE TYPE "EDMInvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'ERROR', 'CANCELLED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "taxOffice" TEXT;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "companyCity" TEXT DEFAULT 'İSTANBUL',
ADD COLUMN     "companyDistrict" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "taxOffice" TEXT,
ALTER COLUMN "enabledModules" SET DEFAULT ARRAY['SERVICE', 'STOCK', 'SALE', 'FINANCE', 'EFATURA']::TEXT[];

-- CreateTable
CREATE TABLE "EDMInvoice" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" "EDMInvoiceType" NOT NULL DEFAULT 'EARCHIVE',
    "status" "EDMInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT,
    "saleId" TEXT,
    "serviceTicketId" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxTotal" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "rawXml" TEXT,
    "rawResponse" TEXT,
    "edmError" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EDMInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EDMInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "vatRate" INTEGER NOT NULL DEFAULT 18,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "unitCode" TEXT NOT NULL DEFAULT 'C62',

    CONSTRAINT "EDMInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EDMIncomingInvoice" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "senderVkn" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "receiverVkn" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "envelopeId" TEXT,
    "htmlContent" TEXT,
    "pdfBlob" BYTEA,
    "rawXml" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EDMIncomingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EDMSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "senderVkn" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "companyAddress" TEXT,
    "companyCity" TEXT DEFAULT 'İSTANBUL',
    "companyDistrict" TEXT,
    "taxOffice" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EDMSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EDMInvoice_saleId_key" ON "EDMInvoice"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "EDMInvoice_serviceTicketId_key" ON "EDMInvoice"("serviceTicketId");

-- CreateIndex
CREATE INDEX "EDMInvoice_shopId_status_idx" ON "EDMInvoice"("shopId", "status");

-- CreateIndex
CREATE INDEX "EDMInvoice_shopId_issueDate_idx" ON "EDMInvoice"("shopId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "EDMInvoice_shopId_uuid_key" ON "EDMInvoice"("shopId", "uuid");

-- CreateIndex
CREATE INDEX "EDMIncomingInvoice_shopId_issueDate_idx" ON "EDMIncomingInvoice"("shopId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "EDMIncomingInvoice_shopId_uuid_key" ON "EDMIncomingInvoice"("shopId", "uuid");

-- CreateIndex
CREATE UNIQUE INDEX "EDMSettings_shopId_key" ON "EDMSettings"("shopId");

-- AddForeignKey
ALTER TABLE "EDMInvoice" ADD CONSTRAINT "EDMInvoice_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMInvoice" ADD CONSTRAINT "EDMInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMInvoice" ADD CONSTRAINT "EDMInvoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMInvoice" ADD CONSTRAINT "EDMInvoice_serviceTicketId_fkey" FOREIGN KEY ("serviceTicketId") REFERENCES "ServiceTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMInvoiceLine" ADD CONSTRAINT "EDMInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "EDMInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMInvoiceLine" ADD CONSTRAINT "EDMInvoiceLine_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMIncomingInvoice" ADD CONSTRAINT "EDMIncomingInvoice_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EDMSettings" ADD CONSTRAINT "EDMSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
