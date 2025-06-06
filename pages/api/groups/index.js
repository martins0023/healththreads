// pages/api/groups/index.js

import prisma from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Attempt to identify current user (optional)
  let user = null;
  try {
    user = await getUserFromToken(req);
  } catch {
    user = null;
  }

  try {
    // 2) Fetch all public groups, along with a count of members,
    //    and whether the current user is already a member of each group.
    const groups = await prisma.group.findMany({
      where: { isPrivate: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true } },
        members: user
          ? {
              where: { userId: user.id },
              select: { id: true },
            }
          : false,
      },
    });

    // 3) Transform into a lighter payload
    const payload = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      avatarUrl: g.avatarUrl || null,
      memberCount: g._count.members,
      // if `members` array is non‐empty, current user is a member
      isMember: user ? g.members.length > 0 : false,
    }));

    return res.status(200).json({ groups: payload });
  } catch (err) {
    console.error("Error in GET /api/groups:", err);
    return res.status(500).json({ error: "Failed to fetch groups." });
  }
}
