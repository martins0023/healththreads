// pages/api/posts.js

import prisma from "../../lib/prisma";
import redis from "../../lib/redisClient";
import { getUserFromToken } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Authenticate
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { text, imageUrl, videoUrl, audioUrl } = req.body;

  // 2. Validate input
  if (!text && !imageUrl && !videoUrl && !audioUrl) {
    return res.status(400).json({ error: "Post must have text or media" });
  }

  try {
    // 3. Create Post record in AWS RDS via Prisma
    const newPost = await prisma.post.create({
      data: {
        authorId: user.id,
        textContent: text || "",
      },
    });

    // 4. Create related MediaAsset rows if necessary
    const mediaPromises = [];
    if (imageUrl) {
      mediaPromises.push(
        prisma.mediaAsset.create({
          data: {
            postId: newPost.id,
            type: "IMAGE",
            url: imageUrl,
          },
        })
      );
    }
    if (videoUrl) {
      mediaPromises.push(
        prisma.mediaAsset.create({
          data: {
            postId: newPost.id,
            type: "VIDEO",
            url: videoUrl,
          },
        })
      );
    }
    if (audioUrl) {
      mediaPromises.push(
        prisma.mediaAsset.create({
          data: {
            postId: newPost.id,
            type: "AUDIO",
            url: audioUrl,
          },
        })
      );
    }
    await Promise.all(mediaPromises);

    // 5. Fan-out to Upstash Redis
    //    Use sorted sets named "timeline:{userId}"
    const timelineKeyForUser = `timeline:${user.id}`;
    const timestampScore = newPost.createdAt.getTime();

    // a) Add to the author’s own timeline
    await redis.zadd(timelineKeyForUser, timestampScore, newPost.id);

    // b) Fetch all followers from RDS via Prisma
    const followers = await prisma.follow.findMany({
      where: { followedId: user.id },
      select: { followerId: true },
    });

    // c) For each follower, add to their timeline
    const pipeline = redis.pipeline();
    for (const f of followers) {
      const followerTimelineKey = `timeline:${f.followerId}`;
      pipeline.zadd(followerTimelineKey, timestampScore, newPost.id);
    }
    await pipeline.exec();

    // 6. Fetch the newly created post (with author + mediaAssets) to return
    const postWithMedia = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        mediaAssets: true,
      },
    });

    return res.status(201).json({ post: postWithMedia });
  } catch (error) {
    console.error("Error in /api/posts:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
}
