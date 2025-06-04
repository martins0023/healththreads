// pages/api/comments/[id]/like.js

import prisma from "../../../../lib/prisma";
import { getUserFromToken } from "../../../../lib/auth";

export default async function handler(req, res) {
  const commentId = req.query.id;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Authenticate user
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2. Verify the comment exists
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, likeCount: true },
  });
  if (!existingComment) {
    return res.status(404).json({ error: "Comment not found." });
  }

  try {
    // 3. Check if this user already liked this comment
    const prev = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: user.id, commentId } },
    });

    let liked, newCount;

    if (prev) {
      // a) Already liked → remove the join + decrement count
      await prisma.commentLike.delete({
        where: { id: prev.id },
      });
      const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
      newCount = updated.likeCount;
      liked = false;
    } else {
      // b) Not yet liked → create join + increment count
      await prisma.commentLike.create({
        data: {
          user: { connect: { id: user.id } },
          comment: { connect: { id: commentId } },
        },
      });
      const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      });
      newCount = updated.likeCount;
      liked = true;
    }

    return res.status(200).json({ liked, likeCount: newCount });
  } catch (err) {
    console.error("Error toggling comment like:", err);
    return res.status(500).json({ error: "Failed to toggle comment like." });
  }
}
