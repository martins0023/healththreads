// pages/api/messages/conversations.js

import { getUserFromToken } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const viewer = await getUserFromToken(req);
  if (!viewer) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Find mutual followers
    const following = await prisma.follow.findMany({
      where: { followerId: viewer.id },
      select: { followedId: true },
    });
    const followers = await prisma.follow.findMany({
      where: { followedId: viewer.id },
      select: { followerId: true },
    });
    const followingIds = new Set(following.map((f) => f.followedId));
    const followerIds = new Set(followers.map((f) => f.followerId));
    const mutualIds = [...followingIds].filter((id) => followerIds.has(id));

    const conversations = await Promise.all(
      mutualIds.map(async (otherId) => {
        const other = await prisma.user.findUnique({
          where: { id: otherId },
          select: { id: true, name: true, avatarUrl: true },
        });
        const lastMsg = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: viewer.id, recipientId: otherId },
              { senderId: otherId, recipientId: viewer.id },
            ],
          },
          orderBy: { createdAt: "desc" },
        });
        return {
          user: other,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                text: lastMsg.text,
                mediaUrl: lastMsg.mediaUrl,
                mediaType: lastMsg.mediaType,
                senderId: lastMsg.senderId,
                createdAt: lastMsg.createdAt.toISOString(),
                isRead: lastMsg.isRead,
              }
            : null,
        };
      })
    );

    return res.json({ conversations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
