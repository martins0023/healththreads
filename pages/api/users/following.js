// pages/api/users/following.js

import { getUserFromToken } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const viewer = await getUserFromToken(req);
  if (!viewer) return res.status(401).json({ error: "Not authenticated" });
  // get users that viewer follows (or that follow viewer, adjust as desired)
  const follows = await prisma.follow.findMany({
    where: { followerId: viewer.id },
    select: {
      followed: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
    },
  });
  res.status(200).json(follows.map((f) => f.followed));
}
