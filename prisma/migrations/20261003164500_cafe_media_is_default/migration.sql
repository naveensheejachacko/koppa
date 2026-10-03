-- AlterTable
ALTER TABLE "public"."CafeMedia" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: oldest image per cafe becomes the catalog cover
UPDATE "public"."CafeMedia" AS m
SET "isDefault" = true
WHERE m.id IN (
  SELECT DISTINCT ON ("cafeId") id
  FROM "public"."CafeMedia"
  ORDER BY "cafeId", "createdAt" ASC
);

-- One default media row per cafe
CREATE UNIQUE INDEX "CafeMedia_cafeId_default_unique" ON "public"."CafeMedia"("cafeId") WHERE "isDefault" = true;
