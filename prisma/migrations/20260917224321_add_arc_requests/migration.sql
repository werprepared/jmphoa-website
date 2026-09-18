-- CreateEnum
CREATE TYPE "ArcRequestType" AS ENUM ('ADDITION', 'PORCH', 'SHED', 'DECK_PATIO', 'ROOFING', 'GAZEBO_PLAYHOUSE', 'EXTERIOR_PAINT', 'FENCE', 'WALL_LANDSCAPING', 'MAILBOX', 'OTHER');

-- CreateEnum
CREATE TYPE "ArcStatus" AS ENUM ('PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ArcDecision" AS ENUM ('APPROVED', 'CONDITIONAL_APPROVAL', 'DENIED');

-- CreateEnum
CREATE TYPE "ArcAttachmentLabel" AS ENUM ('SURVEY', 'PHOTOS', 'PLANS', 'LANDSCAPING', 'COMMITTEE_RESPONSE', 'OTHER');

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "linkUrl" TEXT;

-- CreateTable
CREATE TABLE "ArcRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL DEFAULT 1,
    "requesterName" TEXT NOT NULL,
    "requesterAddress" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "requesterEmail" TEXT NOT NULL,
    "requestType" "ArcRequestType" NOT NULL,
    "requestTypeOther" TEXT,
    "locationOnProperty" TEXT,
    "sizeDimensions" TEXT,
    "color" TEXT,
    "materials" TEXT,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "contractorName" TEXT,
    "contractorAddress" TEXT,
    "contractorPhone" TEXT,
    "status" "ArcStatus" NOT NULL DEFAULT 'PROCESSING',
    "decision" "ArcDecision",
    "decisionReason" TEXT,
    "dateReviewed" TIMESTAMP(3),
    "dateHomeownerNotified" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArcRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArcAttachment" (
    "id" TEXT NOT NULL,
    "arcRequestId" TEXT NOT NULL,
    "label" "ArcAttachmentLabel" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArcAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArcRequest_requesterId_sequenceNumber_key" ON "ArcRequest"("requesterId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "ArcRequest" ADD CONSTRAINT "ArcRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcRequest" ADD CONSTRAINT "ArcRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcAttachment" ADD CONSTRAINT "ArcAttachment_arcRequestId_fkey" FOREIGN KEY ("arcRequestId") REFERENCES "ArcRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArcAttachment" ADD CONSTRAINT "ArcAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

