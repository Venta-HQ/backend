-- CreateEnum
CREATE TYPE "public"."IntegrationType" AS ENUM ('Clerk', 'RevenueCat');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('Active', 'Cancelled', 'Inactive', 'Pending');

-- CreateTable
CREATE TABLE "public"."integration" (
    "id" TEXT NOT NULL,
    "type" "public"."IntegrationType" NOT NULL,
    "data" JSONB,
    "providerId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "long" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'Inactive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vendor" (
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
CREATE UNIQUE INDEX "user_clerkId_key" ON "public"."user"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_userId_key" ON "public"."user_subscription"("userId");

-- AddForeignKey
ALTER TABLE "public"."integration" ADD CONSTRAINT "integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscription" ADD CONSTRAINT "user_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vendor" ADD CONSTRAINT "vendor_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
