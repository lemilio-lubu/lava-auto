/*
  Warnings:

  - You are about to drop the column `userId` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `ownerName` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_userId_fkey";

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "userId",
ADD COLUMN     "ownerName" TEXT NOT NULL,
ADD COLUMN     "ownerPhone" TEXT;
