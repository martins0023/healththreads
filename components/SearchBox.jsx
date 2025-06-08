// components/SearchBox.jsx

import { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { SearchIcon } from "lucide-react";
import Link from "next/link";

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({
    users: [],
    posts: [],
    groups: [],
  });
  const ref = useRef();

  // Debounced fetch on every query change
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      if (q.trim() === "") {
        setSuggestions({ users: [], posts: [], groups: [] });
        return;
      }
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          setSuggestions(await res.json());
        }
      } catch (err) {
        console.error("Search suggest error:", err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q, open]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const clearAndClose = () => {
    setQ("");
    setSuggestions({ users: [], posts: [], groups: [] });
    setOpen(false);
  };

  return (
    <div ref={ref} className="w-full">
      {/* Compact input */}
      <div className="relative w-full">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search HealthThread…"
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Full‐screen overlay */}
      {open && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header with back/cancel */}
          <div className="flex items-center px-4 py-2 border-b border-gray-200">
            <button
              onClick={clearAndClose}
              className="text-gray-600 hover:text-gray-800 mr-4"
            >
              Cancel
            </button>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search HealthThread…"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="overflow-auto p-4 space-y-8 flex-1">
            {/* People */}
            {suggestions.users.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-2">People</h2>
                <div className="bg-gray-50 rounded-lg divide-y">
                  {suggestions.users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/users/${u.username}`}
                      className="flex items-center px-4 py-3 hover:bg-gray-100"
                      onClick={clearAndClose}
                    >
                      <img
                        src={u.avatarUrl || "/avatars/default-pic.jpg"}
                        alt={u.name}
                        className="h-8 w-8 rounded-full mr-3 object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-500">@{u.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {suggestions.posts.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-2">Posts</h2>
                <div className="bg-gray-50 rounded-lg divide-y">
                  {suggestions.posts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/posts/${p.id}`}
                      className="block px-4 py-3 hover:bg-gray-100"
                      onClick={clearAndClose}
                    >
                      <p className="text-gray-800 text-sm line-clamp-2">
                        {p.title || p.textContent}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Communities */}
            {suggestions.groups.length > 0 && (
              <section>
                <h2 className="text-lg font-medium mb-2">Communities</h2>
                <div className="bg-gray-50 rounded-lg divide-y">
                  {suggestions.groups.map((g) => (
                    <Link
                      key={g.id}
                      href={`/communities/${g.id}`}
                      className="block px-4 py-3 hover:bg-gray-100"
                      onClick={clearAndClose}
                    >
                      <p className="text-gray-800 text-sm">{g.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No results (only if user has typed something) */}
            {q.trim() !== "" &&
             suggestions.users.length === 0 &&
             suggestions.posts.length === 0 &&
             suggestions.groups.length === 0 && (
              <p className="text-center text-gray-500 mt-12">
                No results for{" "}
                <span className="font-medium text-gray-700">“{q}”</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
