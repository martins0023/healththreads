/*
  Warnings:

  - You are about to drop the `_GroupToPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_GroupToPost" DROP CONSTRAINT "_GroupToPost_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupToPost" DROP CONSTRAINT "_GroupToPost_B_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "groupId" TEXT;

-- DropTable
DROP TABLE "_GroupToPost";

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
