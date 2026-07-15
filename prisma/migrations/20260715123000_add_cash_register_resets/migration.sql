ALTER TABLE "FinanceAccount" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TRY';

CREATE TABLE "CashRegisterReset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "periodType" TEXT NOT NULL DEFAULT 'MANUAL',
    "totalBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalBalanceUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "CashRegisterReset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashRegisterResetAccount" (
    "id" TEXT NOT NULL,
    "resetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "accountCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "closingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closingBalanceUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopId" TEXT NOT NULL,

    CONSTRAINT "CashRegisterResetAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CashRegisterReset_shopId_createdAt_idx" ON "CashRegisterReset"("shopId", "createdAt");
CREATE INDEX "CashRegisterResetAccount_shopId_accountId_createdAt_idx" ON "CashRegisterResetAccount"("shopId", "accountId", "createdAt");
CREATE INDEX "CashRegisterResetAccount_resetId_idx" ON "CashRegisterResetAccount"("resetId");

ALTER TABLE "CashRegisterReset" ADD CONSTRAINT "CashRegisterReset_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashRegisterReset" ADD CONSTRAINT "CashRegisterReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashRegisterResetAccount" ADD CONSTRAINT "CashRegisterResetAccount_resetId_fkey" FOREIGN KEY ("resetId") REFERENCES "CashRegisterReset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashRegisterResetAccount" ADD CONSTRAINT "CashRegisterResetAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinanceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashRegisterResetAccount" ADD CONSTRAINT "CashRegisterResetAccount_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
