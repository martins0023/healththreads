// pages/api/auth/signin.js

import prisma from "../../../lib/prisma";
import { verifyPassword, setTokenCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() },
        ],
      },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Issue JWT cookie
    setTokenCookie(res, { userId: user.id });

    // Return minimal user info
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl || null,
      },
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({ error: "Failed to sign in." });
  }
}
