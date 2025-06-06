// pages/api/groups/join.js

import prisma from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) Authenticate user
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2) Expect { groupId } in body
  const { groupId } = req.body;
  if (!groupId || typeof groupId !== "string") {
    return res.status(400).json({ error: "groupId is required." });
  }

  try {
    // 3) Ensure group exists and is public
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, isPrivate: true },
    });
    if (!group || group.isPrivate) {
      return res.status(404).json({ error: "Group not found." });
    }

    // 4) Check if user is already a member
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    });

    let action;
    if (existing) {
      // a) Already a member → remove them (Leave)
      await prisma.groupMember.delete({ where: { id: existing.id } });
      action = "left";
    } else {
      // b) Not a member → add them (Join)
      await prisma.groupMember.create({
        data: {
          user: { connect: { id: user.id } },
          group: { connect: { id: groupId } },
        },
      });
      action = "joined";
    }

    // 5) Return updated member count
    const memberCount = await prisma.groupMember.count({
      where: { groupId },
    });

    return res.status(200).json({ action, memberCount });
  } catch (err) {
    console.error("Error in POST /api/groups/join:", err);
    return res
      .status(500)
      .json({ error: "Failed to toggle membership." });
  }
}
