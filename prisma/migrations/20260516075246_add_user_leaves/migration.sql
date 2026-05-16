-- CreateTable
CREATE TABLE "UserLeave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLeave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLeave_userId_idx" ON "UserLeave"("userId");

-- CreateIndex
CREATE INDEX "UserLeave_shopId_idx" ON "UserLeave"("shopId");

-- AddForeignKey
ALTER TABLE "UserLeave" ADD CONSTRAINT "UserLeave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLeave" ADD CONSTRAINT "UserLeave_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
