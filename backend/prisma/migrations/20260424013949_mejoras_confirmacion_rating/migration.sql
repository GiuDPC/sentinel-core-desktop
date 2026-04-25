-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'AWAITING_CONFIRMATION';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "rating_comment" TEXT,
ADD COLUMN     "resolution_note" TEXT,
ADD COLUMN     "resolved_at" TIMESTAMP(3);
