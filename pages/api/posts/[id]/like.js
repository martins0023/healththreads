// pages/api/posts/[id]/like.js

import prisma from "../../../../lib/prisma";
import { getUserFromToken } from "../../../../lib/auth";

export default async function handler(req, res) {
  const postId = req.query.id;

  // 1. Only allow POST (toggle)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 2. Authenticate
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 3. Check if the post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  try {
    // 4. See if the user already liked this post
    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: { userId: user.id, postId },
      },
    });

    let liked;
    if (existing) {
      // a) If exists, remove the like
      await prisma.like.delete({
        where: { id: existing.id },
      });
      // decrement counter
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });
      liked = false;
    } else {
      // b) Else, create a new like
      await prisma.like.create({
        data: {
          user: { connect: { id: user.id } },
          post: { connect: { id: postId } },
        },
      });
      // increment counter
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
      liked = true;
    }

    return res.status(200).json({ liked, likeCount: liked ? post.likeCount + 1 : post.likeCount - 1 });
  } catch (err) {
    console.error("Like toggle error:", err);
    return res.status(500).json({ error: "Failed to toggle like." });
  }
}
