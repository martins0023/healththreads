// pages/api/groups/index.js

import prisma from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Authenticate user
  let user = null;
  try {
    user = await getUserFromToken(req);
  } catch {
    user = null;
  }

  // 2. Fetch all **public** groups (isPrivate = false)
  try {
    // Get all groups with:
    //   - a count of total members
    //   - whether the current user is a member (if user exists)
    const groups = await prisma.group.findMany({
      where: { isPrivate: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
        // If user is logged in, also include a small sub‐query to see
        // if they belong to each group:
        members: user
          ? { where: { userId: user.id }, select: { id: true } }
          : false,
      },
    });

    // 3. Map to a simpler payload
    const payload = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      avatarUrl: g.avatarUrl || null,
      memberCount: g._count.members,
      isMember: user ? g.members.length > 0 : false,
    }));

    return res.status(200).json({ groups: payload });
  } catch (err) {
    console.error("Error in GET /api/groups:", err);
    return res.status(500).json({ error: "Failed to fetch groups." });
  }
}
