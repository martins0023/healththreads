// scripts/ingest-health-news.js

import Parser from "rss-parser";
import { PrismaClient } from "@prisma/client";
import { Client as ESClient } from "@elastic/elasticsearch";
import cron from "node-cron";

const prisma = new PrismaClient();
const es = new ESClient({ node: process.env.NEXT_PUBLIC_ELASTICSEARCH_URL });
const parser = new Parser();

// List of RSS feeds to ingest:
const FEEDS = [
  { url: "https://www.nejm.org/rss", source: "NEJM" },
  { url: "https://jamanetwork.com/rss/site_1/5.xml", source: "JAMA" },
  { url: "https://www.medscape.com/rss/site_43.xml", source: "Medscape" },
  // add more…
];

async function ingestOnce() {
  for (let { url, source } of FEEDS) {
    let feed = await parser.parseURL(url);
    for (let item of feed.items) {
      const publishedAt = item.isoDate
        ? new Date(item.isoDate)
        : new Date(item.pubDate);

      // Upsert into Prisma
      const record = await prisma.healthNews.upsert({
        where: { url: item.link },
        update: {
          title: item.title,
          summary: item.contentSnippet || item.content || "",
          source,
          publishedAt,
        },
        create: {
          title: item.title,
          summary: item.contentSnippet || item.content || "",
          url: item.link,
          source,
          publishedAt,
        },
      });

      // Index into ES
      await es.index({
        index: "health_news",
        id: record.id,
        body: {
          title: record.title,
          summary: record.summary,
          url: record.url,
          source: record.source,
          publishedAt: record.publishedAt,
        },
      });
    }
  }

  console.log("Health-news ingestion complete:", new Date().toISOString());
}

// Run once immediately, then every hour
ingestOnce();
cron.schedule("0 * * * *", ingestOnce);
