-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('RECEIVED', 'READING', 'DIRECTIONS_READY', 'ACTIVE', 'HAS_FINAL', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Sensitivity" AS ENUM ('NONE', 'ELEVATED', 'HIGH', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BatchKind" AS ENUM ('INITIAL', 'MORE', 'ANOTHER_STYLE', 'SERIES_MATCH');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('QUEUED', 'RUNNING', 'READY', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OptionState" AS ENUM ('PENDING', 'GENERATING', 'PREVIEW_READY', 'PREVIEW_FAILED', 'BLOCKED', 'FINALIZING', 'FINAL_READY', 'FINAL_FAILED', 'PACKING', 'PACK_READY', 'PACK_FAILED');

-- CreateEnum
CREATE TYPE "PackStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "StyleStatus" AS ENUM ('DRAFT', 'CURATING', 'LIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "RefSource" AS ENUM ('GENERATED', 'ET_ARCHIVE', 'LICENSED');

-- CreateEnum
CREATE TYPE "RefStatus" AS ENUM ('CANDIDATE', 'APPROVED', 'REJECTED', 'RETIRED');

-- CreateEnum
CREATE TYPE "LikenessStatus" AS ENUM ('ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "AttemptResult" AS ENUM ('OK', 'REFUSED', 'ERROR', 'TIMEOUT');

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "callerKeyId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorWorkspaceId" TEXT NOT NULL,
    "clientRef" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "failureCode" TEXT,
    "failureReason" TEXT,
    "articleTitle" TEXT,
    "articleText" TEXT,
    "articleHash" TEXT NOT NULL,
    "articleChars" INTEGER NOT NULL,
    "articleLang" TEXT NOT NULL DEFAULT 'en',
    "articleExcerpt" TEXT NOT NULL,
    "prompt" TEXT,
    "styleId" TEXT,
    "seriesOfRequestId" TEXT,
    "sensitivity" "Sensitivity",
    "costInr" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "spendCapInr" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "headline" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "entities" JSONB NOT NULL,
    "tone" TEXT NOT NULL,
    "desk" TEXT NOT NULL,
    "sensitivity" "Sensitivity" NOT NULL,
    "sensitivityReasons" TEXT[],
    "altTextSeed" TEXT NOT NULL,
    "truncatedForRead" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Direction" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "suggestedStyleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "peopleDepicted" JSONB NOT NULL,
    "avoid" TEXT[],

    CONSTRAINT "Direction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "kind" "BatchKind" NOT NULL,
    "styleId" TEXT,
    "directionPlan" JSONB NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "directionId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "referenceIds" TEXT[],
    "likenessIds" TEXT[],
    "state" "OptionState" NOT NULL DEFAULT 'PENDING',
    "previewAttempts" INTEGER NOT NULL DEFAULT 0,
    "previewUrl" TEXT,
    "previewPublicId" TEXT,
    "previewModel" TEXT,
    "finalAttempts" INTEGER NOT NULL DEFAULT 0,
    "finalUrl" TEXT,
    "finalPublicId" TEXT,
    "finalModel" TEXT,
    "judge" JSONB,
    "subjectBoxes" JSONB,
    "blockedReason" TEXT,
    "failureReason" TEXT,
    "picked" BOOLEAN NOT NULL DEFAULT false,
    "pickedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishPack" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "assets" JSONB NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "credit" TEXT NOT NULL,
    "status" "PackStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PublishPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StyleFamily" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "StyleFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ruleSheet" JSONB NOT NULL,
    "goodFor" TEXT[],
    "safety" JSONB NOT NULL,
    "status" "StyleStatus" NOT NULL DEFAULT 'DRAFT',
    "minApprovedRefs" INTEGER NOT NULL DEFAULT 15,
    "sortOrder" INTEGER NOT NULL,
    "coverReferenceIds" TEXT[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "retiredAt" TIMESTAMPTZ(3),

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StyleReference" (
    "id" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "source" "RefSource" NOT NULL,
    "sourceNote" TEXT NOT NULL,
    "subjectHint" TEXT,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "subjects" TEXT[],
    "mood" TEXT NOT NULL,
    "embedding" vector(1536),
    "embeddingModel" TEXT,
    "screen" JSONB,
    "status" "RefStatus" NOT NULL DEFAULT 'CANDIDATE',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "pickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StyleReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Likeness" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "photos" JSONB NOT NULL,
    "consentNote" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "status" "LikenessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Likeness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "optionId" TEXT,
    "stage" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "result" "AttemptResult" NOT NULL,
    "errorCode" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "imageTokens" INTEGER NOT NULL DEFAULT 0,
    "costInr" DECIMAL(12,4) NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "completedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendLedger" (
    "day" DATE NOT NULL,
    "costInr" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SpendLedger_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "callerKeyId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_publicId_key" ON "Request"("publicId");

-- CreateIndex
CREATE INDEX "Request_actorWorkspaceId_createdAt_idx" ON "Request"("actorWorkspaceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Request_actorUserId_status_idx" ON "Request"("actorUserId", "status");

-- CreateIndex
CREATE INDEX "Request_status_updatedAt_idx" ON "Request"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Request_articleHash_idx" ON "Request"("articleHash");

-- CreateIndex
CREATE UNIQUE INDEX "Request_callerKeyId_clientRef_key" ON "Request"("callerKeyId", "clientRef");

-- CreateIndex
CREATE UNIQUE INDEX "Brief_requestId_version_key" ON "Brief"("requestId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Direction_briefId_rank_key" ON "Direction"("briefId", "rank");

-- CreateIndex
CREATE INDEX "Batch_status_createdAt_idx" ON "Batch"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_requestId_seq_key" ON "Batch"("requestId", "seq");

-- CreateIndex
CREATE INDEX "Option_requestId_state_idx" ON "Option"("requestId", "state");

-- CreateIndex
CREATE INDEX "Option_state_updatedAt_idx" ON "Option"("state", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Option_batchId_index_key" ON "Option"("batchId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "PublishPack_optionId_key" ON "PublishPack"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "StyleFamily_slug_key" ON "StyleFamily"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Style_slug_key" ON "Style"("slug");

-- CreateIndex
CREATE INDEX "Style_status_sortOrder_idx" ON "Style"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "StyleReference_styleId_status_idx" ON "StyleReference"("styleId", "status");

-- CreateIndex
CREATE INDEX "Attempt_startedAt_idx" ON "Attempt"("startedAt");

-- CreateIndex
CREATE INDEX "Attempt_requestId_idx" ON "Attempt"("requestId");

-- CreateIndex
CREATE INDEX "Attempt_stage_result_idx" ON "Attempt"("stage", "result");

-- CreateIndex
CREATE INDEX "AuditEvent_at_idx" ON "AuditEvent"("at");

-- CreateIndex
CREATE INDEX "AuditEvent_targetType_targetId_idx" ON "AuditEvent"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Direction" ADD CONSTRAINT "Direction_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishPack" ADD CONSTRAINT "PublishPack_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "StyleFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StyleReference" ADD CONSTRAINT "StyleReference_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "Style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

