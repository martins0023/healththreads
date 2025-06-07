// pages/api/search/suggest.js

import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = (req.query.q || "").trim();
  if (q.length < 2) {
    return res.status(200).json({ users: [], posts: [], groups: [] });
  }

  try {
    // Case‐insensitive contains search
    const whereUsers = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    };
    const users = await prisma.user.findMany({
      where: whereUsers,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
      take: 5,
    });

    const wherePosts = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { textContent: { contains: q, mode: "insensitive" } },
      ],
    };
    const posts = await prisma.post.findMany({
      where: wherePosts,
      select: {
        id: true,
        title: true,
        textContent: true,
      },
      take: 5,
    });

    const groups = await prisma.group.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
    });

    return res.status(200).json({ users, posts, groups });
  } catch (err) {
    console.error("Search suggest error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
