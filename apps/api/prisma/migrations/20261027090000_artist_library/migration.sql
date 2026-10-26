-- The artist library: real artists' published images as style references.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- AlterEnum
ALTER TYPE "RefSource" ADD VALUE 'ARTIST';

-- AlterTable: a reference the editor pinned when creating the request, so a re-read reproduces it.
ALTER TABLE "Request" ADD COLUMN     "pinnedReferenceId" TEXT;

-- AlterTable
ALTER TABLE "StyleReference" ADD COLUMN     "artistId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "portfolioUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "StyleReference_styleId_artistId_status_idx" ON "StyleReference"("styleId", "artistId", "status");

-- AddForeignKey
ALTER TABLE "StyleReference" ADD CONSTRAINT "StyleReference_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
