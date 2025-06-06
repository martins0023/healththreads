-- CreateTable
CREATE TABLE "_GroupMemberToPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupMemberToPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GroupMemberToPost_B_index" ON "_GroupMemberToPost"("B");

-- AddForeignKey
ALTER TABLE "_GroupMemberToPost" ADD CONSTRAINT "_GroupMemberToPost_A_fkey" FOREIGN KEY ("A") REFERENCES "GroupMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMemberToPost" ADD CONSTRAINT "_GroupMemberToPost_B_fkey" FOREIGN KEY ("B") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
