// pages/api/messages/[userId].js

import { getUserFromToken } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  const { userId } = req.query;
  const viewer = await getUserFromToken(req);
  if (!viewer) return res.status(401).json({ error: "Unauthorized" });

  // Only allow GET and POST
  if (req.method === "GET") {
    // Check mutual follow
    const follows = await prisma.follow.findFirst({
      where: { followerId: viewer.id, followedId: userId },
    });
    const followedBack = await prisma.follow.findFirst({
      where: { followerId: userId, followedId: viewer.id },
    });
    if (!follows || !followedBack) {
      return res
        .status(403)
        .json({ error: "Cannot chat unless you follow each other." });
    }

    try {
      const rawMessages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: viewer.id, recipientId: userId },
            { senderId: userId, recipientId: viewer.id },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      const thread = rawMessages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        text: m.text,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        createdAt: m.createdAt.toISOString(),
        isRead: m.isRead,
      }));
      return res.json({ messages: thread });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "POST") {
    const { text, mediaUrl, mediaType } = req.body;
    // Check mutual follow
    const follows = await prisma.follow.findFirst({
      where: { followerId: viewer.id, followedId: userId },
    });
    const followedBack = await prisma.follow.findFirst({
      where: { followerId: userId, followedId: viewer.id },
    });
    if (!follows || !followedBack) {
      return res
        .status(403)
        .json({ error: "Cannot chat unless you follow each other." });
    }

    try {
      const created = await prisma.message.create({
        data: {
          senderId: viewer.id,
          recipientId: userId,
          text: text ?? null,
          mediaUrl: mediaUrl ?? null,
          mediaType: mediaType ?? null,
        },
      });

      const payload = {
        id: created.id,
        senderId: created.senderId,
        recipientId: created.recipientId,
        text: created.text,
        mediaUrl: created.mediaUrl,
        mediaType: created.mediaType,
        createdAt: created.createdAt.toISOString(),
        isRead: created.isRead,
      };

      // Trigger Pusher event on private‐chat-{conversationChannel}
      // We’ll use a channel named “private-chat-{smallerUserId}-{largerUserId}”
      const channelName =
        viewer.id < userId
          ? `private-chat-${viewer.id}-${userId}`
          : `private-chat-${userId}-${viewer.id}`;
      await pusher.trigger(channelName, "new-message", payload);

      return res.status(201).json({ message: payload });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
