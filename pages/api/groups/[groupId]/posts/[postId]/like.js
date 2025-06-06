// pages/api/groups/[groupId]/posts/[postId]/like.js

import prisma from "../../../../../../lib/prisma";
import { getUserFromToken } from "../../../../../../lib/auth";

export default async function handler(req, res) {
  const { groupId, postId } = req.query;

  // Only POST for toggling
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Authenticate
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2) Check membership of this group
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId: groupId,
      },
    },
  });
  if (!membership) {
    return res.status(403).json({ error: "Not a group member" });
  }

  // 3) Check that post belongs to this group
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { groupId: true, likeCount: true },
  });
  if (!post || post.groupId !== groupId) {
    return res.status(404).json({ error: "Post not found in this group" });
  }

  try {
    // 4) Toggle like
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId: postId } },
    });

    let newLikeCount;
    let liked;

    if (existingLike) {
      // Remove like
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      newLikeCount = post.likeCount - 1;
      liked = false;
    } else {
      // Create like
      await prisma.like.create({
        data: { user: { connect: { id: user.id } }, post: { connect: { id: postId } } },
      });
      newLikeCount = post.likeCount + 1;
      liked = true;
    }

    // 5) Update post’s likeCount
    await prisma.post.update({
      where: { id: postId },
      data: { likeCount: newLikeCount },
    });

    return res.status(200).json({ liked, likeCount: newLikeCount });
  } catch (err) {
    console.error("Error toggling group post like:", err);
    return res.status(500).json({ error: "Failed to toggle like" });
  }
}
