// scripts/ingest-health-news.js
const Parser = require("rss-parser");
const { PrismaClient } = require("@prisma/client");
const { Client: ESClient } = require("@elastic/elasticsearch");
const cron = require("node-cron");
const prisma = new PrismaClient();

const es = new ESClient({
  node: process.env.NEXT_PUBLIC_ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.NEXT_PUBLIC_ELASTICSEARCH_API_KEY, // Make sure this is set in your .env
  },
});

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
  },
});

// List of RSS feeds to ingest:

const FEEDS = [
  {
    url: "https://rss.app/feeds/thrQcFSwy24jw45w.xml",
    source: "HealthThreads",
  },

  {
    url: "https://rss.app/feeds/t7lF7JdPIEK4kzH2.xml",
    source: "HealthThreads",
  }, // add more…
];

async function ingestOnce() {
  for (let { url, source } of FEEDS) {
    console.log(`Attempting to parse RSS feed: ${url} from source: ${source}`);
    let feed = await parser.parseURL(url);
    for (let item of feed.items) {
      const publishedAt = item.isoDate
        ? new Date(item.isoDate)
        : new Date(item.pubDate); // Upsert into Prisma

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
      }); // Index into ES

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
