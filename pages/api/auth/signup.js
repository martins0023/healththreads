// pages/api/auth/signup.js

import prisma from "../../../lib/prisma";
import { hashPassword, setTokenCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, username, password } = req.body;

  // Basic validation
  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email or username already in use." });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        // bio, avatarUrl, etc can be added later
      },
    });

    // Issue JWT cookie
    setTokenCookie(res, { userId: newUser.id });

    // Return minimal user info
    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        avatarUrl: newUser.avatarUrl || null,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Failed to create user." });
  }
}
