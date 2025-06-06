// pages/api/groups/[groupId]/stories/index.js

import prisma from "../../../../../lib/prisma";
import { getUserFromToken } from "../../../../../lib/auth"; 

// Note: We assume your existing /api/media/presign route already works for generating S3 presigned URLs.

export default async function handler(req, res) {
  const { groupId } = req.query;

  // 1) Authenticate
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // 2) Check that group exists & is public or that user is a member
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, isPrivate: true },
  });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  // If group is private, only members can fetch/post
  if (group.isPrivate) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    });
    if (!membership) {
      return res.status(403).json({ error: "Not a member of this group" });
    }
  }

  // ====== GET: return all stories for this group (ordered newest→oldest) ======
  if (req.method === "GET") {
    try {
      const stories = await prisma.story.findMany({
        where: { groupId },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({ stories });
    } catch (err) {
      console.error("Error fetching stories:", err);
      return res.status(500).json({ error: "Failed to fetch stories." });
    }
  }

  // ====== POST: upload a new story ======
  // Body must contain { mediaUrl, mediaType } (we assume front-end first uploaded to S3 via /api/media/presign)
  if (req.method === "POST") {
    const { mediaUrl, mediaType } = req.body;
    if (!mediaUrl || !mediaType) {
      return res
        .status(400)
        .json({ error: "mediaUrl and mediaType are required." });
    }
    // Only members can post (same check as above)
    if (group.isPrivate) {
      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.id, groupId } },
      });
      if (!membership) {
        return res.status(403).json({ error: "Not a member of this group" });
      }
    } else {
      // For public groups, anyone can post a story once authenticated
    }

    try {
      const newStory = await prisma.story.create({
        data: {
          mediaUrl,
          mediaType,
          user: { connect: { id: user.id } },
          group: { connect: { id: groupId } },
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
      return res.status(201).json({ story: newStory });
    } catch (err) {
      console.error("Error creating story:", err);
      return res.status(500).json({ error: "Failed to create story." });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
