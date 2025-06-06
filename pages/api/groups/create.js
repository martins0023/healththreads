// pages/api/groups/create.js

import prisma from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Authenticate
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2) Only allow practitioners to create a new group
  if (!user.isPractitioner) {
    return res
      .status(403)
      .json({ error: "Only verified practitioners can create a community." });
  }

  // 3) Expect { name, description, avatarUrl? } in body
  const { name, description, avatarUrl } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required." });
  }

  try {
    // 4) Create the new public group
    const newGroup = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        _count: { select: { members: true } },
      },
    });

    // 5) Return the newly created group’s basic info
    return res.status(201).json({
      group: {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        avatarUrl: newGroup.avatarUrl || null,
        memberCount: newGroup._count.members, // should be 0 on creation
        isMember: false,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/groups/create:", err);
    return res.status(500).json({ error: "Failed to create group." });
  }
}
