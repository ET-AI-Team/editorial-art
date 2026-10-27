-- References the editor chose for a request: every option of the first batch is made from exactly these.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "referenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
