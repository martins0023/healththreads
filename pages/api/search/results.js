// pages/api/search/results.js
import { es } from "../../../lib/searchClient";

export default async function handler(req, res) {
  const { q, type = "all", page = "0", limit = "10" } = req.query;
  const from = parseInt(page) * parseInt(limit);

  const index =
    type === "users" ? "users" :
    type === "posts" ? "posts" :
    type === "groups" ? "groups" :
    ["users", "posts", "groups"];

  const { body } = await es.search({
    index,
    from,
    size: parseInt(limit),
    body: {
      query: {
        multi_match: {
          query: q,
          fields: ["name^2", "username", "title^2", "textContent", "description"],
        },
      },
    },
  });

  const results = body.hits.hits.map((h) => ({
    id: h._id,
    index: h._index,
    ...h._source,
  }));

  res.json({
    results,
    total: body.hits.total.value,
    page: parseInt(page),
    limit: parseInt(limit),
  });
}
