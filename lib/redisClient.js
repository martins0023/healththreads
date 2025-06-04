// lib/redisClient.js
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL; // assume “rediss://…” for Upstash

// In serverless or dev, attach to global so we don’t recreate on every hot reload
let redis;
if (!global._redis) {
  global._redis = new Redis(redisUrl, {
    // Don’t allow extremely long retry cycles—fail fast if no connection.
    maxRetriesPerRequest: 2,   

    // If a command fails, wait this long (ms) before retrying.
    // Returning null means “don’t retry, just error out.”
    retryStrategy(times) {
      if (times > 2) {
        return null; 
      }
      // Otherwise wait 100 ms before next retry
      return 100;
    },

    // Adjust the connect timeout (default is 10s). 
    // If we can’t connect in 3s, give up early.
    connectTimeout: 3000,  

    // Enable TLS/SSL (for Upstash “rediss://”)
    tls: {
      // Upstash’s certificate is publicly trusted. No additional options needed
      // unless you have a custom CA, then you’d set `ca: …`.
    },

    // Optional: disable auto‐pipelining if you see “MaxRetriesPerRequest” on pipelines.
    // enableAutoPipelining: false,

    // Optional: force new connection per call (uncomment if you find the socket gets stale).
    // lazyConnect: true,
    // reconnectOnError(err) {
    //   // On certain errors (like stale socket), force a fresh connect.
    //   if (err.message.includes("ECONNRESET")) {
    //     return true;
    //   }
    //   return false;
    // },
  });

  global._redis.on("connect", () => console.log("⚡‍ Redis connected"));
  global._redis.on("error", (err) => console.error("❌ Redis error", err));
}
redis = global._redis;

export default redis;
