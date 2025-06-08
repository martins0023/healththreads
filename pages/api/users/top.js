// pages/api/users/top.js

import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const limit = parseInt(req.query.limit || "5", 10);

  try {
    // 1) Group posts by authorId, summing their likeCount
    const groups = await prisma.post.groupBy({
      by: ["authorId"],
      _sum: { likeCount: true },
      orderBy: { _sum: { likeCount: "desc" } },
      take: limit,
    });

    // If no posts/users, return empty
    if (groups.length === 0) {
      return res.json({ users: [] });
    }

    // 2) Fetch user details for these authorIds
    const authorIds = groups.map((g) => g.authorId);
    const users = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
    });

    // 3) Merge sums back in and preserve order
    const usersById = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});
    const result = groups.map((g) => {
      const u = usersById[g.authorId];
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl,
        reputation: g._sum.likeCount ?? 0,
      };
    });

    return res.json({ users: result });
  } catch (err) {
    console.error("Error fetching top users:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
