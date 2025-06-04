// pages/api/posts/[id]/comments.js

import prisma from "../../../../lib/prisma";
import { getUserFromToken } from "../../../../lib/auth";

export default async function handler(req, res) {
  const postId = req.query.id;

  // 1. Verify the post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return res.status(404).json({ error: "Post not found." });
  }

  if (req.method === "GET") {
    // 2a. Fetch only top-level comments (parentId == null)
    //     Include up to 2 levels of nested replies. We also need to know
    //     per comment if the current user has already liked it.
    const user = await getUserFromToken(req);

    // Fetch all top-level comments with nested replies (2 levels)
    const topComments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
        replies: {
          where: { postId },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
              where: { postId },
              include: {
                author: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. If user is signed in, gather all comment IDs to annotate "likedByCurrentUser"
    let likedSet = new Set();
    if (user) {
      // Collect every comment ID in the two-level structure
      const collectIds = (arr) => {
        let ids = [];
        for (const c of arr) {
          ids.push(c.id);
          if (c.replies) {
            for (const r1 of c.replies) {
              ids.push(r1.id);
              if (r1.replies) {
                for (const r2 of r1.replies) {
                  ids.push(r2.id);
                }
              }
            }
          }
        }
        return ids;
      };
      const allIds = collectIds(topComments);
      const likedRows = await prisma.commentLike.findMany({
        where: { userId: user.id, commentId: { in: allIds } },
        select: { commentId: true },
      });
      likedSet = new Set(likedRows.map((r) => r.commentId));
    }

    // 4. Annotate each comment and nested reply with likedByCurrentUser
    function annotate(array) {
      return array.map((c) => ({
        ...c,
        likedByCurrentUser: likedSet.has(c.id),
        replies: annotate(c.replies || []),
      }));
    }
    const annotated = annotate(topComments);

    return res.status(200).json({ comments: annotated });
  }

  if (req.method === "POST") {
    // 2b. Create a new comment (top-level or reply)
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { text, parentId } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required." });
    }

    // If this is a reply, verify the parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId) {
        return res.status(400).json({ error: "Invalid parent comment." });
      }
    }

    try {
      const newComment = await prisma.comment.create({
        data: {
          text,
          author: { connect: { id: user.id } },
          post: { connect: { id: postId } },
          parent: parentId ? { connect: { id: parentId } } : undefined,
        },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
      // Increment the post’s commentCount
      await prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return res.status(201).json({ comment: newComment });
    } catch (err) {
      console.error("Error creating comment:", err);
      return res.status(500).json({ error: "Failed to create comment." });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
