-- Admin-chosen image models (the "image-models" setting) and, per option, exactly what each image call sent.
-- Hand-written; checked with `prisma migrate diff --from-schema-datamodel` against the previous schema.

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "finalInput" JSONB,
ADD COLUMN     "previewInput" JSONB;

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
