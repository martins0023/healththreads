-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('THREAD', 'DEEP');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'THREAD';
