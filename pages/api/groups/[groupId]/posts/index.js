// pages/api/groups/[groupId]/posts/index.js

import prisma from "../../../../../lib/prisma";
import { getUserFromToken } from "../../../../../lib/auth";

export default async function handler(req, res) {
  const { groupId } = req.query;

  // Only allow GET or POST here
  if (req.method === "GET") {
    // 1) Authenticate
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 2) Check membership: user must be a member of this group
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

    // 3) Fetch all posts in that group
    try {
      let posts = await prisma.post.findMany({
        where: { groupId: groupId },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          mediaAssets: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // 4) Determine which posts the current user has liked
      const postIds = posts.map((p) => p.id);
      const likedMap = await prisma.like.findMany({
        where: {
          userId: user.id,
          postId: { in: postIds },
        },
        select: { postId: true },
      });
      const likedSet = new Set(likedMap.map((l) => l.postId));

      // 5) Attach `likedByCurrentUser: boolean` to each post
      posts = posts.map((p) => ({
        ...p,
        likedByCurrentUser: likedSet.has(p.id),
      }));

      return res.status(200).json({ posts });
    } catch (err) {
      console.error("Error fetching group posts:", err);
      return res.status(500).json({ error: "Failed to fetch group posts" });
    }
  }

  else if (req.method === "POST") {
    // Create a new post in this group
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Body expects: { text, imageUrl, videoUrl, audioUrl, type, title }
    const {
      text,
      imageUrl,
      videoUrl,
      audioUrl,
      type: postType = "THREAD",
      title: postTitle = null,
    } = req.body;

    // 1) Check membership
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

    // 2) Validate
    if (postType === "DEEP") {
      if (!postTitle || typeof postTitle !== "string" || !text) {
        return res
          .status(400)
          .json({ error: "Deep posts require a title and text." });
      }
    } else {
      if (!text && !imageUrl && !videoUrl && !audioUrl) {
        return res
          .status(400)
          .json({ error: "Thread posts require text or media" });
      }
    }

    try {
      // 3) Create the post record
      const newPost = await prisma.post.create({
        data: {
          authorId: user.id,
          textContent: text || "",
          type: postType,
          title: postType === "DEEP" ? postTitle : null,
          groupId: groupId, // <-- associate with this group
        },
      });

      // 4) Create any MediaAsset rows
      const mediaPromises = [];
      if (imageUrl) {
        mediaPromises.push(
          prisma.mediaAsset.create({
            data: { postId: newPost.id, type: "IMAGE", url: imageUrl },
          })
        );
      }
      if (videoUrl) {
        mediaPromises.push(
          prisma.mediaAsset.create({
            data: { postId: newPost.id, type: "VIDEO", url: videoUrl },
          })
        );
      }
      if (audioUrl) {
        mediaPromises.push(
          prisma.mediaAsset.create({
            data: { postId: newPost.id, type: "AUDIO", url: audioUrl },
          })
        );
      }
      await Promise.all(mediaPromises);

      // 5) Return the newly created post (with author & media)
      const postWithMedia = await prisma.post.findUnique({
        where: { id: newPost.id },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          mediaAssets: true,
        },
      });

      return res.status(201).json({ post: postWithMedia });
    } catch (err) {
      console.error("Error creating group post:", err);
      return res.status(500).json({ error: "Failed to create post" });
    }
  }

  else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end("Method Not Allowed");
  }
}
