// lib/offlineQueue.js

import localforage from "localforage";

// 1) Set up a store for queued requests
const queueStore = localforage.createInstance({
  name: "healththreads-queue",
});

export async function enqueueRequest({ url, method, body }) {
  const queue = (await queueStore.getItem("requests")) || [];
  queue.push({ url, method, body });
  await queueStore.setItem("requests", queue);
}

export async function processQueue() {
  const queue = (await queueStore.getItem("requests")) || [];
  const remaining = [];
  for (const req of queue) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        body: JSON.stringify(req.body),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Request failed");
    } catch (err) {
      console.error("Failed to replay queued request:", err);
      remaining.push(req);
    }
  }
  await queueStore.setItem("requests", remaining);
}
