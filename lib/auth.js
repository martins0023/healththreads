// lib/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "replace-with-strong-secret";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

// 1) Hash a plaintext password for new signups
export async function hashPassword(plaintext) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(plaintext, salt);
}

// 2) Compare a candidate password during signin
export async function verifyPassword(plaintext, hash) {
  return await bcrypt.compare(plaintext, hash);
}

/**
 * Set an HttpOnly JWT cookie on the response.
 * Payload should at least contain { userId }.
 */
export function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  // Set cookie: token=<jwt>; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax
  // Next.js automatically prefixes "Set-Cookie" correctly.
  res.setHeader("Set-Cookie", [
    `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`,
  ]);
}

/**
 * Remove the cookie by setting an expired cookie.
 */
export function clearTokenCookie(res) {
  res.setHeader("Set-Cookie", [
    `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  ]);
}
/**
 * Reads the JWT from an HttpOnly cookie named "token", verifies it,
 * and returns the user record { id, name, avatarUrl, username } or null if invalid.
 */
export async function getUserFromToken(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;

  // Find "token=<jwt>"
  const tokenCookie = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="));
  if (!tokenCookie) return null;

  const token = tokenCookie.split("=")[1];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload should contain { userId }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        username: true,
        isPractitioner: true, // Include practitioner status if needed
      },
    });
    return user;
  } catch (err) {
    console.error("Invalid JWT:", err);
    return null;
  }
}

/**
 * (Optional) A helper to set a cookie after login/registration:
 * res.setHeader('Set-Cookie', `token=${jwt}; HttpOnly; Path=/; Max-Age=...`);
 * 
 * Example usage:
 *   const jwt = signJwt({ userId: newUser.id });
 *   res.setHeader("Set-Cookie", `token=${jwt}; HttpOnly; Path=/; Max-Age=86400`);
 */
export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}
