-- AlterEnum
ALTER TYPE "Committee" ADD VALUE 'LANDSCAPE';

-- AlterEnum
ALTER TYPE "ContactRecipient" ADD VALUE 'LANDSCAPE';

-- AlterEnum
ALTER TYPE "DocCategory" ADD VALUE 'COMMITTEE_LANDSCAPE';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COMMITTEE_LANDSCAPE';

-- AlterTable
ALTER TABLE "ArcRequest" ADD COLUMN     "decidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CommunityComment" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "CommunityCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CommunityCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

