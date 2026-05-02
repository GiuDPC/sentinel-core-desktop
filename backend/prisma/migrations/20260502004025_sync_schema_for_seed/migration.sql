/*
  Warnings:

  - You are about to drop the column `rating` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the column `rating_comment` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "rating",
DROP COLUMN "rating_comment";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "store_name" TEXT,
ADD COLUMN     "store_number" TEXT;
