/*
  Warnings:

  - Added the required column `updatedAt` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('Clerk', 'RevenueCat');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('Active', 'Cancelled', 'Inactive', 'Pending');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "integration" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "data" JSONB,
    "providerId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'Inactive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "long" DOUBLE PRECISION,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "open" BOOLEAN NOT NULL DEFAULT false,
    "primaryImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_userId_key" ON "user_subscription"("userId");

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
