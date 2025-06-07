// pages/api/users/update.js
import prisma from "../../../lib/prisma";
import { indexDocument } from "../../../lib/searchClient";

export default async function handler(req, res) {
  // ... upsert user into the database …
  const user = /* the newly created/updated user */
  await indexDocument("users", user.id, {
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
  });
  res.json({ user });
}
