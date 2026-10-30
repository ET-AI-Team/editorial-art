-- Official brand logos: the BrandLogo store (found on Wikidata P154 and Wikimedia Commons, freely
-- licensed only), the logo a brief found for its main subject, whether each direction asked for it,
-- and the logo each option was given with whether it came out faithful.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- CreateEnum
CREATE TYPE "BrandLogoSource" AS ENUM ('WIKIMEDIA', 'UPLOAD');

-- CreateEnum
CREATE TYPE "BrandLogoStatus" AS ENUM ('ACTIVE', 'RETIRED');

-- AlterTable
ALTER TABLE "Brief" ADD COLUMN     "brandLogoId" TEXT;

-- AlterTable
ALTER TABLE "Direction" ADD COLUMN     "useLogo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "brandLogoId" TEXT,
ADD COLUMN     "logoOk" BOOLEAN;

-- CreateTable
CREATE TABLE "BrandLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wikidataId" TEXT,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "licence" TEXT,
    "licenceUrl" TEXT,
    "credit" TEXT,
    "commonsPage" TEXT,
    "source" "BrandLogoSource" NOT NULL,
    "status" "BrandLogoStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BrandLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandLogo_wikidataId_idx" ON "BrandLogo"("wikidataId");

-- CreateIndex
CREATE INDEX "BrandLogo_status_idx" ON "BrandLogo"("status");
