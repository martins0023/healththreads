// pages/search.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout"; // keep your existing layout
import Link from "next/link";

export default function SearchPage() {
  const router = useRouter();
  const { q: initialQ } = router.query;
  const [q, setQ] = useState(initialQ || "");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    users: [],
    posts: [],
    groups: [],
  });

  // whenever `q` changes, refetch
  useEffect(() => {
    if (!q || q.length < 2) {
      setSuggestions({ users: [], posts: [], groups: [] });
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          setSuggestions(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <div className="max-w-3xl mx-auto py-6">
        <form onSubmit={handleSubmit} className="relative mb-6">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search HealthThread…"
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="space-y-8">
          {/* ─── People ────────────────────────────────────────── */}
          {suggestions.users.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">People</h3>
              <div className="bg-white rounded-lg shadow divide-y">
                {suggestions.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/users/${u.username}`}
                    className="flex items-center px-4 py-3 hover:bg-gray-50"
                  >
                    <img
                      src={u.avatarUrl || "/avatars/default-pic.jpg"}
                      alt={u.name}
                      className="h-8 w-8 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-500">
                        @{u.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ─── Posts ─────────────────────────────────────────── */}
          {suggestions.posts.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Posts</h3>
              <div className="bg-white rounded-lg shadow divide-y">
                {suggestions.posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.id}`}
                    className="block px-4 py-3 hover:bg-gray-50"
                  >
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {p.title || p.textContent}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ─── Communities ───────────────────────────────────── */}
          {suggestions.groups.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Communities</h3>
              <div className="bg-white rounded-lg shadow divide-y">
                {suggestions.groups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/communities/${g.id}`}
                    className="block px-4 py-3 hover:bg-gray-50"
                  >
                    <p className="text-sm text-gray-800">{g.name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ─── No results ────────────────────────────────────── */}
          {!loading &&
            !suggestions.users.length &&
            !suggestions.posts.length &&
            !suggestions.groups.length && (
              <p className="text-center text-gray-500 mt-12">
                No results for “<span className="font-medium">{q}</span>”
              </p>
            )}
        </div>
      </div>
    </>
  );
}
