// pages/api/auth/me.js

import { getUserFromToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Return user data (as in signup/signin)
  return res.status(200).json({ user });
}
