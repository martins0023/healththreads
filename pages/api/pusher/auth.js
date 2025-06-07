// pages/api/pusher/auth.js

import Pusher from "pusher";
import { getUserFromToken } from "../../../lib/auth";

const pusherServer = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") return res.status(405).end();

  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  // You could enforce here that channel matches “private-chat-…” 
  // and that user is one of the two IDs in that channel.
  const authResponse = pusherServer.authenticate(socketId, channel, {
    user_id: user.id,
  });
  res.status(200).send(authResponse);
}
