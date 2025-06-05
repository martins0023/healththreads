// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\/feed\?.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "feed-api",
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^\/api\/posts\/.*$/,
      handler: "NetworkFirst",
    },
    // Cache likes/comments GET
    {
      urlPattern: /^\/api\/posts\/.*\/comments/,
      handler: "NetworkFirst",
    },
    // …other caching rules…
  ],
});

module.exports = withPWA({
  // any other Next.js config
});
