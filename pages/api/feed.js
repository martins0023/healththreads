// pages/api/feed.js

import prisma from "../../lib/prisma";
import redis from "../../lib/redisClient";
import { getUserFromToken } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Authenticate
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2. Parse pagination
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "10", 10);
  const start = page * limit;
  const end = start + limit - 1;

  // 3. Fetch post IDs from Upstash Redis
  const timelineKey = `timeline:${user.id}`;
  let postIds;
  try {
    postIds = await redis.zrevrange(timelineKey, start, end);
  } catch (err) {
    console.error("Redis error fetching timeline:", err);
    return res.status(500).json({ error: "Failed to fetch timeline" });
  }

  // 4. If no posts, return empty
  if (!postIds || postIds.length === 0) {
    return res.status(200).json({ posts: [], hasMore: false });
  }

  // 5. Fetch full Post objects from AWS RDS via Prisma
  let posts;
  try {
    posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        mediaAssets: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Prisma error fetching posts:", err);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }

  // 6. Determine if more pages exist
  let totalCount;
  try {
    totalCount = await redis.zcard(timelineKey);
  } catch (err) {
    console.error("Redis error counting timeline:", err);
    totalCount = postIds.length; // fallback
  }
  const hasMore = end + 1 < totalCount;

  // 7. Return
  return res.status(200).json({ posts, hasMore });
}
