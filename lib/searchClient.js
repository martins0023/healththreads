// lib/searchClient.js
import { Client } from "@elastic/elasticsearch";

export const es = new Client({
  node: process.env.NEXT_PUBLIC_ELASTICSEARCH_URL,
  auth: { apiKey: process.env.NEXT_PUBLIC_ELASTICSEARCH_AP_KEY },
});

export async function indexDocument(index, id, body) {
  await es.index({ index, id, body, refresh: "wait_for" });
}
