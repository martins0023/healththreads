// pages/api/health-news.js

import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "20", 10);

  // If you want to support ES filtering, you could proxy through Elasticsearch here.
  // For now we just use Prisma directly:

  const [items, total] = await Promise.all([
    prisma.healthNews.findMany({
      orderBy: { publishedAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.healthNews.count(),
  ]);

  res.status(200).json({
    news: items.map((i) => ({
      ...i,
      publishedAt: i.publishedAt.toISOString(),
    })),
    total,
    hasMore: (page + 1) * limit < total,
  });
}
