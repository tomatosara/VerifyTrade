-- CreateTable
CREATE TABLE "VerificationTx" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ref" TEXT,
    "status" TEXT NOT NULL,
    "resultJson" JSONB,
    "hash" TEXT,

    CONSTRAINT "VerificationTx_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationTx_transactionId_key" ON "VerificationTx"("transactionId");
