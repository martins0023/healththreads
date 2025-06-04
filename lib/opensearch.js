// lib/opensearch.js

import { Client } from "@opensearch-project/opensearch";

const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT; // e.g. https://search-…us-west-2.es.amazonaws.com

export const osClient = new Client({
  node: OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD,
  },
});

// Utility to index a Prisma Post into the “posts” index
export async function indexPost(post) {
  /**
   * post should be an object like:
   * {
   *   id, textContent, author: { id, name }, createdAt,
   *   mediaAssets: [ { type, url }, … ],
   *   hashtags: [ { tag }, … ]
   * }
   */
  const body = {
    id: post.id,
    text: post.textContent || "",
    authorName: post.author.name,
    createdAt: post.createdAt,
    hashtags: post.hashtags.map((h) => h.hashtag.tag),
    // … any other fields …
  };

  await osClient.index({
    index: "posts",
    id: post.id,
    body,
  });
}
