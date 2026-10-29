-- The news hook of each brief, and per direction what the image must show, why it fits, and the reader test.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- AlterTable
ALTER TABLE "Brief" ADD COLUMN     "hook" JSONB;

-- AlterTable
ALTER TABLE "Direction" ADD COLUMN     "mustShow" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "readerReason" TEXT,
ADD COLUMN     "readerScore" INTEGER,
ADD COLUMN     "whyItFits" TEXT NOT NULL DEFAULT '';
