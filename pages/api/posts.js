// pages/api/posts.js

import prisma from "../../lib/prisma";
import redis from "../../lib/redisClient";
import { getUserFromToken } from "../../lib/auth";
import { Client } from "@opensearch-project/opensearch";

// ——— OpenSearch client setup ———
const osClient = new Client({
  node: process.env.OPENSEARCH_ENDPOINT,
  auth:
    process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
      ? {
          username: process.env.OPENSEARCH_USERNAME,
          password: process.env.OPENSEARCH_PASSWORD,
        }
      : undefined,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Authenticate
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2. Extract body: now includes `type` and optional `title`
  const {
    text,
    imageUrl,
    videoUrl,
    audioUrl,
    type: postType = "THREAD",
    title: postTitle = null,
  } = req.body;

  // 3. Validate inputs
  //   - If DEEP, require a title and nonempty text
  if (postType === "DEEP") {
    if (!postTitle || typeof postTitle !== "string" || !text) {
      return res
        .status(400)
        .json({ error: "Deep posts require a title and text." });
    }
  } else {
    // THREAD: require either text (<=280 chars) or media
    if (!text && !imageUrl && !videoUrl && !audioUrl) {
      return res.status(400).json({ error: "Post must have text or media" });
    }
  }

  try {
    // 4. Create Post record in RDS via Prisma
    const newPost = await prisma.post.create({
      data: {
        authorId: user.id,
        textContent: text || "",
        type: postType, // THREAD or DEEP
        title: postType === "DEEP" ? postTitle : null,
      },
    });

    // 5. Create related MediaAsset rows if necessary
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

    // 6. Fan‐out to Redis (timelines)
    const timestampScore = newPost.createdAt.getTime();
    await redis.zadd(`timeline:${user.id}`, timestampScore, newPost.id);
    const followers = await prisma.follow.findMany({
      where: { followedId: user.id },
      select: { followerId: true },
    });
    const pipeline = redis.multi();
    for (const f of followers) {
      pipeline.zadd(`timeline:${f.followerId}`, timestampScore, newPost.id);
    }
    await pipeline.exec();

    // 7. Fetch newly created post (with author + mediaAssets) to return
    const postWithMedia = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        mediaAssets: true,
      },
    });

    // 8. Hashtag indexing in Redis sorted set (for “Trending”)—unchanged
    const hashtagRegex = /#(\w+)/g;
    let match;
    const hashtagPipeline = redis.multi();
    while ((match = hashtagRegex.exec(text || ""))) {
      const tag = match[1].toLowerCase();
      hashtagPipeline.zincrby("trending:hashtags", 1, tag);
    }
    await hashtagPipeline.exec();

    // 9. Index into OpenSearch “posts” index (now including title & type)
    const hashtagsArray = Array.from(
      new Set(
        (text || "")
          .match(hashtagRegex)
          ?.map((h) => h.slice(1).toLowerCase()) || []
      )
    );
    await osClient.index({
      index: "posts",
      id: postWithMedia.id,
      document: {
        id: postWithMedia.id,
        title: postWithMedia.title || "",
        textContent: postWithMedia.textContent,
        authorName: postWithMedia.author.name,
        authorId: postWithMedia.author.id,
        createdAt: postWithMedia.createdAt,
        hashtags: hashtagsArray,
        type: postWithMedia.type, // THREAD or DEEP
      },
      refresh: "true",
    });

    // 10. Publish “new_posts” event on Redis
    const ssePayload = {
      id: postWithMedia.id,
      title: postWithMedia.title || null,
      textContent: postWithMedia.textContent,
      type: postWithMedia.type,
      author: postWithMedia.author,
      mediaAssets: postWithMedia.mediaAssets,
      createdAt: postWithMedia.createdAt,
      likeCount: 0,
      commentCount: 0,
    };
    await redis.publish("new_posts", JSON.stringify(ssePayload));

    // 11. Return the created post
    return res.status(201).json({ post: postWithMedia });
  } catch (error) {
    console.error("Error in /api/posts:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
}
