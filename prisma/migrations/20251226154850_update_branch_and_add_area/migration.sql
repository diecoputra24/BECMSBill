/*
  Warnings:

  - You are about to drop the column `address` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Branch` table. All the data in the column will be lost.
  - Added the required column `alamatBranch` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `namaBranch` to the `Branch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Branch" DROP COLUMN "address",
DROP COLUMN "name",
ADD COLUMN     "alamatBranch" TEXT NOT NULL,
ADD COLUMN     "namaBranch" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "namaArea" TEXT NOT NULL,
    "kodeArea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
