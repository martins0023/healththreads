// components/SearchBox.jsx

import { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { SearchIcon } from "lucide-react";
import Link from "next/link";

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState({
    users: [],
    posts: [],
    groups: [],
  });
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (q.length < 2) {
      setSuggestions({ users: [], posts: [], groups: [] });
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      setSuggestions(await res.json());
    }, 200);
    return () => clearTimeout(timeout);
  }, [q]);

  // close on outside click
  useEffect(() => {
    function onClick(e) {
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search HealthThread…"
          className="w-full pl-8 pr-8 py-2 border border-gray-300 rounded-md text-sm"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setSuggestions({ users: [], posts: [], groups: [] });
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {open &&
        (suggestions.users.length ||
          suggestions.posts.length ||
          suggestions.groups.length) > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 h-screen overflow-auto">
            {/* Users */}
            {suggestions.users.map((u) => {
              // Link to /users/:username
              const href = `/users/${encodeURIComponent(u.username)}`;
              return (
                <Link
                  key={u.id}
                  href={href}
                  className="flex items-center px-4 py-2 hover:bg-gray-100"
                >
                  <img
                    src={u.avatarUrl || "/avatars/default-pic.jpg"}
                    className="h-6 w-6 rounded-full mr-2"
                    alt={u.name}
                  />
                  <span className="text-sm">
                    {u.name} (@{u.username})
                  </span>
                </Link>
              );
            })}

            {/* Posts */}
            {suggestions.posts.map((p) => (
              <Link
                key={p.id}
                href={`/posts/${p.id}`}
                className="block px-4 py-2 hover:bg-gray-100 text-sm line-clamp-2"
              >
                {p.title || p.textContent}
              </Link>
            ))}
            {/* Groups */}
            {suggestions.groups.map((g) => (
              <Link
                key={g.id}
                href={`/communities/${g.id}`}
                className="block px-4 py-2 hover:bg-gray-100 text-sm"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
