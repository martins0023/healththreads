// pages/api/summarize/[postId].js

import { getUserFromToken } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

// use the beta2 endpoint
const PALM_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateMessage";
// keep the key server-side only
const PALM_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1) auth
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { postId } = req.query;
  // 2) load post
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { textContent: true, title: true, type: true },
  });
  if (!post) return res.status(404).json({ error: "Post not found" });

  // 3) build prompt
  const raw =
    post.type === "DEEP" && post.title
      ? `Title: ${post.title}\n\n${post.textContent}`
      : post.textContent || "";
  const stripped = raw.replace(/<[^>]*>/g, "").trim();
  const prompt = `
You are an expert content summarizer.
Produce a concise, three-sentence summary of the text below, focusing on the core message and key takeaways. Do not add personal opinions.

Text:
"""${stripped}"""
`.trim();

  try {
    // 4) call PaLM beta2
    const apiRes = await fetch(`${PALM_ENDPOINT}?key=${PALM_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: { messages: [{ author: "user", content: prompt }] },
        temperature: 0.2,
        candidateCount: 1,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("PaLM error:", errText);
      return res.status(502).json({ error: "AI summarization failed" });
    }

    const { candidates } = await apiRes.json();
    const summary = candidates?.[0]?.content?.trim() || "";

    return res.status(200).json({ summary });
  } catch (err) {
    console.error("Summarize error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
