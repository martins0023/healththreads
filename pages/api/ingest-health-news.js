// pages/api/ingest-health-news.js

import Parser from "rss-parser";
import { PrismaClient } from "@prisma/client";
import { Client as ESClient } from "@elastic/elasticsearch";

// Initialize Prisma, Elasticsearch, and RSS Parser outside the handler
// so they can be reused across warm invocations of the serverless function.
const prisma = new PrismaClient();
const es = new ESClient({
  node: process.env.NEXT_PUBLIC_ELASTICSEARCH_URL,
  auth: {
    // IMPORTANT: On Vercel, you should generally use specific API Keys or Username/Password
    // stored as sensitive environment variables for security.
    // If NEXT_PUBLIC_ELASTICSEARCH_API_KEY is for the frontend, use a separate
    // ELASTICSEARCH_API_KEY for the serverless function.
    apiKey: process.env.ELASTICSEARCH_API_KEY // <-- Use a *non-public* env var here
  }
});
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
  }
});

// List of RSS feeds to ingest:
// Re-enable and verify these URLs lead directly to XML RSS feeds, not HTML pages.
const FEEDS = [
  // NEJM: Often problematic due to strict bot detection. Try a specific section feed if this one fails.
//   { url: "https://www.nejm.org/rss", source: "NEJM" },
  // JAMA: This is a known RSS feed.
//   { url: "https://jamanetwork.com/rss/site_1/5.xml", source: "JAMA" },
  // Medscape: This is a known general news RSS feed.
//   { url: "https://www.medscape.com/index/list_13470_0", source: "Medscape" },
  // WHO: This is a common pattern for their general news feed.
  // VERIFY on who.int for the exact feed you need.
//   { url: "https://www.who.int/feeds/news/en/rss.xml", source: "WHO" },
  // CDC: This is a podcast feed, not general news. If you need text news, find an alternative.
//   { url: "https://www2c.cdc.gov/podcasts/feed.asp?feedid=183", source: "CDC" },
  // rss.app generated feed: This should be a valid XML feed.
  { url: "https://rss.app/feeds/thrQcFSwy24jw45w.xml", source: "HealthThreads" },
  { url: "https://rss.app/feeds/t7lF7JdPIEK4kzH2.xml", source: "HealthThreads" }
];

// This is the handler for the API route.
// Vercel Cron Jobs will make a request to this endpoint.
export default async function handler(req, res) {
  // Optional: Add a simple security check to ensure it's Vercel's cron calling,
  // or a secret token you've set up.
  // For production, you MUST secure this endpoint.
  // Example: if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }

  console.log("Starting health news ingestion job...");

  const results = {
    successfulFeeds: [],
    failedFeeds: [],
  };

  for (let { url, source } of FEEDS) {
    console.log(`Attempting to parse RSS feed: ${url} from source: ${source}`);
    try {
      let feed = await parser.parseURL(url);

      if (!feed.items || feed.items.length === 0) {
        console.log(`No items found in feed: ${url} (${source}). Skipping.`);
        results.successfulFeeds.push({ url, source, status: 'no_items' });
        continue;
      }

      for (let item of feed.items) {
        if (!item.link) {
          console.warn(`Skipping item from ${source} due to missing link:`, item.title);
          continue;
        }

        const publishedAt = item.isoDate
          ? new Date(item.isoDate)
          : (item.pubDate ? new Date(item.pubDate) : new Date()); // Default to now if both are missing

        try {
          // Upsert into Prisma
          const record = await prisma.healthNews.upsert({
            where: { url: item.link },
            update: {
              title: item.title,
              summary: item.contentSnippet || item.content || item.description || "",
              source,
              publishedAt,
            },
            create: {
              title: item.title,
              summary: item.contentSnippet || item.content || item.description || "",
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
          // console.log(`Indexed item: ${record.title} from ${source}`); // Optional: detailed log
        } catch (dbOrEsError) {
          console.error(`Error processing item from ${source} (URL: ${item.link}):`, dbOrEsError.message);
          // Don't 'continue' here for the outer loop, only skip this specific item.
          // The outer loop will proceed to the next item in the same feed if there are more.
        }
      }
      results.successfulFeeds.push({ url, source, status: 'processed_items' });

    } catch (feedError) {
      console.error(`Error parsing or fetching feed ${url} (${source}):`, feedError.message);
      results.failedFeeds.push({ url, source, error: feedError.message });
      continue; // Move to the next feed if a feed itself fails
    }
  }

  const completionMessage = `Health-news ingestion job completed: ${new Date().toISOString()}. Successful feeds: ${results.successfulFeeds.length}, Failed feeds: ${results.failedFeeds.length}.`;
  console.log(completionMessage);

  res.status(200).json({
    message: completionMessage,
    results: results,
  });
}