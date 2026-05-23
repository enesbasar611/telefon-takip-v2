-- CreateTable
CREATE TABLE "EDMSettings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'TEST',
    "senderVkn" TEXT,
    "senderName" TEXT,
    "username" TEXT,
    "passwordEncrypted" TEXT,
    "apiUrl" TEXT,
    "registrationUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EDMSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EDMSettings_shopId_key" ON "EDMSettings"("shopId");

-- AddForeignKey
ALTER TABLE "EDMSettings" ADD CONSTRAINT "EDMSettings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
