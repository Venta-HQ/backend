/*
  Warnings:

  - Added the required column `ownerId` to the `vendor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."vendor" DROP CONSTRAINT "vendor_id_fkey";

-- AlterTable
ALTER TABLE "public"."vendor" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."vendor" ADD CONSTRAINT "vendor_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
