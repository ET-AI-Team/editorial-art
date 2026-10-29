-- The story check of each preview (1 to 10 with a reason) and how many story redraws the option has had.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "storyReason" TEXT,
ADD COLUMN     "storyRedraws" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storyScore" INTEGER;
