-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."CafeSource" AS ENUM ('ADMIN', 'SUGGESTION');

-- CreateEnum
CREATE TYPE "public"."OwnerType" AS ENUM ('PLATFORM', 'VENDOR');

-- CreateEnum
CREATE TYPE "public"."CafeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."XpAction" AS ENUM ('NEW_CAFE_VISIT', 'REVISIT', 'CAFE_SUGGESTION');

-- CreateEnum
CREATE TYPE "public"."PriceRange" AS ENUM ('BUDGET', 'MODERATE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('SINGLE', 'MULTI', 'NUMBER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cafe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "status" "public"."CafeStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."CafeSource" NOT NULL DEFAULT 'ADMIN',
    "ownerType" "public"."OwnerType" NOT NULL DEFAULT 'PLATFORM',
    "priceRange" "public"."PriceRange" NOT NULL DEFAULT 'MODERATE',
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cafe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CafeCategory" (
    "cafeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CafeCategory_pkey" PRIMARY KEY ("cafeId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."CafeMedia" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "mediaType" "public"."MediaType" NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CafeMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingQuestion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" "public"."QuestionType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OnboardingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreference" (
    "userId" TEXT NOT NULL,
    "categorySlugs" TEXT[],
    "features" TEXT[],
    "priceRange" "public"."PriceRange",
    "maxDistanceKm" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."CafeSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "status" "public"."SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CafeSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Visit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "gpsAccuracy" DOUBLE PRECISION,
    "distanceFromCafe" DOUBLE PRECISION NOT NULL,
    "verificationStatus" "public"."VerificationStatus" NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "visitDay" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VisitMedia" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "mediaType" "public"."MediaType" NOT NULL DEFAULT 'IMAGE',
    "cloudinaryUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."XpRule" (
    "id" TEXT NOT NULL,
    "action" "public"."XpAction" NOT NULL,
    "xp" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XpRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "public"."XpAction" NOT NULL,
    "xp" INTEGER NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "visitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "public"."RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Cafe_deletedAt_isActive_status_idx" ON "public"."Cafe"("deletedAt", "isActive", "status");

-- CreateIndex
CREATE INDEX "Cafe_place_idx" ON "public"."Cafe"("place");

-- CreateIndex
CREATE INDEX "CafeCategory_categoryId_idx" ON "public"."CafeCategory"("categoryId");

-- CreateIndex
CREATE INDEX "CafeMedia_cafeId_idx" ON "public"."CafeMedia"("cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingQuestion_key_key" ON "public"."OnboardingQuestion"("key");

-- CreateIndex
CREATE INDEX "OnboardingOption_questionId_idx" ON "public"."OnboardingOption"("questionId");

-- CreateIndex
CREATE INDEX "UserAnswer_userId_idx" ON "public"."UserAnswer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CafeSuggestion_cafeId_key" ON "public"."CafeSuggestion"("cafeId");

-- CreateIndex
CREATE INDEX "CafeSuggestion_userId_idx" ON "public"."CafeSuggestion"("userId");

-- CreateIndex
CREATE INDEX "CafeSuggestion_status_idx" ON "public"."CafeSuggestion"("status");

-- CreateIndex
CREATE INDEX "Review_cafeId_idx" ON "public"."Review"("cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_cafeId_key" ON "public"."Review"("userId", "cafeId");

-- CreateIndex
CREATE INDEX "Visit_userId_createdAt_idx" ON "public"."Visit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_cafeId_idx" ON "public"."Visit"("cafeId");

-- CreateIndex
CREATE INDEX "Visit_userId_cafeId_visitDay_idx" ON "public"."Visit"("userId", "cafeId", "visitDay");

-- CreateIndex
CREATE INDEX "VisitMedia_visitId_idx" ON "public"."VisitMedia"("visitId");

-- CreateIndex
CREATE INDEX "VisitMedia_cafeId_idx" ON "public"."VisitMedia"("cafeId");

-- CreateIndex
CREATE UNIQUE INDEX "XpRule_action_key" ON "public"."XpRule"("action");

-- CreateIndex
CREATE INDEX "XpTransaction_userId_createdAt_idx" ON "public"."XpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XpTransaction_createdAt_idx" ON "public"."XpTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "XpTransaction_userId_action_referenceType_referenceId_key" ON "public"."XpTransaction"("userId", "action", "referenceType", "referenceId");

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CafeCategory" ADD CONSTRAINT "CafeCategory_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "public"."Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CafeCategory" ADD CONSTRAINT "CafeCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CafeMedia" ADD CONSTRAINT "CafeMedia_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "public"."Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CafeMedia" ADD CONSTRAINT "CafeMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingOption" ADD CONSTRAINT "OnboardingOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."OnboardingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAnswer" ADD CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."OnboardingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAnswer" ADD CONSTRAINT "UserAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."OnboardingOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CafeSuggestion" ADD CONSTRAINT "CafeSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CafeSuggestion" ADD CONSTRAINT "CafeSuggestion_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "public"."Cafe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "public"."Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "public"."Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VisitMedia" ADD CONSTRAINT "VisitMedia_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VisitMedia" ADD CONSTRAINT "VisitMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XpTransaction" ADD CONSTRAINT "XpTransaction_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

