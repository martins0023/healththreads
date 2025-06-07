// pages/api/messages/[userId]/read.js

import { getUserFromToken } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query; // the other party
  const viewer = await getUserFromToken(req);
  if (!viewer) return res.status(401).json({ error: "Unauthorized" });

  // Mark all messages from userId→viewer.id as read
  try {
    const updated = await prisma.message.updateMany({
      where: {
        senderId: userId,
        recipientId: viewer.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Broadcast “read” event on same channel
    const channelName =
      viewer.id < userId
        ? `private-chat-${viewer.id}-${userId}`
        : `private-chat-${userId}-${viewer.id}`;

    await pusher.trigger(channelName, "messages-read", {
      readerId: viewer.id,
      from: userId,
    });

    return res.json({ updatedCount: updated.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
