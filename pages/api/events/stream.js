// pages/api/events/stream.js

import { getUserFromToken } from "../../../lib/auth";

/**
 * In-memory store of all open SSE connections.
 * Each entry is { userId: string, res: http.ServerResponse }.
 * In production you might use Redis Pub/Sub, but for a single Next.js instance
 * this in-memory array suffices.
 */
let clients = [];

/**
 * Handler for GET /api/events/stream
 *   - Authenticates via getUserFromToken
 *   - Sends proper SSE headers and registers the response object
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  // 1) Authenticate user via your existing JWT/session logic
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // 2) Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  // Send a first newline to establish the stream
  res.write("\n");

  // 3) Register this connection
  clients.push({ userId: user.id, res });

  // 4) When client disconnects, remove from `clients`
  req.on("close", () => {
    clients = clients.filter((c) => c.res !== res);
  });
}

/**
 * Broadcast helper: sends an event to all registered clients (or a subset).
 * 
 * @param {{ type: string, payload: any }} event   
 *         - event.type: e.g. "new_post", "new_comment", "new_like"
 *         - event.payload: JSON-serializable object
 * @param {{ toUserIds?: string[], excludeUserIds?: string[] }} options
 *         - If toUserIds is provided, only send to those userIds.
 *         - If excludeUserIds is provided, exclude those userIds.
 */
export function broadcast(
  event,
  { toUserIds = null, excludeUserIds = [] } = {}
) {
  const dataString = JSON.stringify(event.payload);

  clients.forEach(({ userId, res }) => {
    // If `toUserIds` is given, skip any userId not in that list
    if (toUserIds && !toUserIds.includes(userId)) {
      return;
    }
    // If explicitly excluded, skip
    if (excludeUserIds.includes(userId)) {
      return;
    }
    // Write SSE fields
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${dataString}\n\n`);
  });
}
