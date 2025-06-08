// pages/api/follow/[userId].js

import prisma from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  const { userId: targetId } = req.query;

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Authenticate
  const me = await getUserFromToken(req);
  if (!me) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (me.id === targetId) {
    return res.status(400).json({ error: "Can't follow yourself" });
  }

  try {
    // 2) See if we already follow
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followedId: { followerId: me.id, followedId: targetId },
      },
    });

    let isFollowing;
    if (existing) {
      // 3a) Unfollow
      await prisma.follow.delete({
        where: { id: existing.id },
      });
      isFollowing = false;
    } else {
      // 3b) Follow
      await prisma.follow.create({
        data: {
          followerId: me.id,
          followedId: targetId,
        },
      });
      isFollowing = true;
    }

    // 4) Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followedId: targetId },
    });

    return res.status(200).json({ isFollowing, followerCount });
  } catch (err) {
    console.error("Error toggling follow:", err);
    return res.status(500).json({ error: "Failed to toggle follow" });
  }
}
