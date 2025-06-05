// pages/api/users/update-profile.js
import prisma from "../../../lib/prisma";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const { bio, avatarUrl, coverPictureUrl, isPractitioner } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        bio,
        avatarUrl,
        coverPictureUrl, 
        isPractitioner,
      },
    });
    return res.status(200).json({ user: updated });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}
