-- Subject identity: the brief's identity cues (who the story is about, as a reader would recognise it
-- without text or a logo), which cues each direction shows and the reader test's identity score, and
-- the story check's identity score on each preview.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- AlterTable
ALTER TABLE "Brief" ADD COLUMN     "identity" JSONB;

-- AlterTable
ALTER TABLE "Direction" ADD COLUMN     "identityCues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "readerIdentityScore" INTEGER;

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "identityReason" TEXT,
ADD COLUMN     "identityScore" INTEGER;
