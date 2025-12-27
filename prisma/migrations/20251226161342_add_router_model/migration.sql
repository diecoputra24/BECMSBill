-- CreateTable
CREATE TABLE "Router" (
    "id" SERIAL NOT NULL,
    "namaRouter" TEXT NOT NULL,
    "hostAddress" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "apiPort" INTEGER NOT NULL DEFAULT 8728,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Router_pkey" PRIMARY KEY ("id")
);
