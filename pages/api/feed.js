// pages/api/feed.js

import prisma from "../../lib/prisma";
import redis from "../../lib/redisClient";
import { getUserFromToken } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Authenticate
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2) Pagination params
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "10", 10);
  const start = page * limit;
  const end = start + limit - 1;
  const timelineKey = `timeline:${user.id}`;

  // 3) On the very first page (page 0), rebuild the timeline zset
  if (page === 0) {
    // Gather author IDs (self + everyone you follow)
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followedId: true },
    });
    const authorIds = [user.id, ...following.map((f) => f.followedId)];

    // Fetch up to 1000 recent posts by those authors
    const recentPosts = await prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Write them back into Redis sorted set
    const pipeline = redis.multi();
    // (Overwrite existing sorted set)
    pipeline.del(timelineKey);
    for (const p of recentPosts) {
      pipeline.zadd(timelineKey, p.createdAt.getTime(), p.id);
    }
    // Set a TTL so that it periodically rebuilds if stale
    pipeline.expire(timelineKey, 60 * 60 * 24);
    await pipeline.exec();
  }

  // 4) Now fetch the requested slice of IDs
  let postIds = [];
  try {
    postIds = await redis.zrevrange(timelineKey, start, end);
  } catch (err) {
    console.error("Redis error fetching timeline:", err);
  }

  // 5) If after rebuild we still have no posts, return empty
  if (!postIds || postIds.length === 0) {
    return res.status(200).json({ posts: [], hasMore: false });
  }

  // 6) Fetch full post objects
  let posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          isPractitioner: true,
        },
      },
      mediaAssets: true,
    },
  });

  // 7) Maintain the original Redis order
  const orderMap = Object.fromEntries(postIds.map((id, i) => [id, i]));
  posts.sort((a, b) => orderMap[a.id] - orderMap[b.id]);

  // 8) Annotate likedByCurrentUser
  const likedRows = await prisma.like.findMany({
    where: {
      userId: user.id,
      postId: { in: postIds },
    },
    select: { postId: true },
  });
  const likedSet = new Set(likedRows.map((l) => l.postId));

  const serialized = posts.map((p) => ({
    id: p.id,
    author: p.author,
    mediaAssets: p.mediaAssets,
    textContent: p.textContent,
    title: p.title,
    type: p.type,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    likedByCurrentUser: likedSet.has(p.id),
    isNews: p.isNews,
    newsSource: p.newsSource,
  }));

  // 9) Determine hasMore via zcard
  let totalCount = 0;
  try {
    totalCount = await redis.zcard(timelineKey);
  } catch (err) {
    console.error("Redis error counting timeline:", err);
    totalCount = start + serialized.length;
  }
  const hasMore = end + 1 < totalCount;

  return res.status(200).json({ posts: serialized, hasMore });
}
