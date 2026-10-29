-- Real people in ET Articles: public figures found on Wikidata, confirmed by an editor before the
-- first previews. Likenesses gain a source and the Commons credit; a request records who made it
-- (for the EA_REAL_PEOPLE gate) and pauses in NEEDS_PEOPLE_CONFIRM while the editor decides.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- CreateEnum
CREATE TYPE "LikenessSource" AS ENUM ('ADMIN', 'WIKIMEDIA', 'UPLOAD');

-- CreateEnum
CREATE TYPE "PersonDecision" AS ENUM ('PENDING', 'USE', 'UPLOAD', 'SYMBOLIC');

-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'NEEDS_PEOPLE_CONFIRM' AFTER 'READING';

-- AlterEnum
ALTER TYPE "LikenessStatus" ADD VALUE 'CANDIDATE' BEFORE 'ACTIVE';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "actorRole" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "likenessWeak" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Likeness" ADD COLUMN     "commonsPage" TEXT,
ADD COLUMN     "credit" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "licence" TEXT,
ADD COLUMN     "licenceUrl" TEXT,
ADD COLUMN     "source" "LikenessSource" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "wikidataId" TEXT;

-- CreateTable
CREATE TABLE "RequestPerson" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "otherNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "role" TEXT NOT NULL DEFAULT '',
    "likenessId" TEXT,
    "candidates" JSONB NOT NULL DEFAULT '[]',
    "tried" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "decision" "PersonDecision" NOT NULL DEFAULT 'PENDING',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestPerson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestPerson_likenessId_idx" ON "RequestPerson"("likenessId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestPerson_requestId_name_key" ON "RequestPerson"("requestId", "name");

-- CreateIndex
CREATE INDEX "Likeness_wikidataId_idx" ON "Likeness"("wikidataId");

-- CreateIndex
CREATE INDEX "Likeness_status_idx" ON "Likeness"("status");

-- AddForeignKey
ALTER TABLE "RequestPerson" ADD CONSTRAINT "RequestPerson_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPerson" ADD CONSTRAINT "RequestPerson_likenessId_fkey" FOREIGN KEY ("likenessId") REFERENCES "Likeness"("id") ON DELETE SET NULL ON UPDATE CASCADE;
