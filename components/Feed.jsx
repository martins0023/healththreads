// components/Feed.jsx

import { useEffect, useRef, useState, useCallback } from "react";
import PostCard from "./PostCard";
import { useFeed } from "../lib/useFeed";
import { useRouter } from "next/router";
import EmptyFeed from "./EmptyFeed";
import Loading from "./Loading";
import FollowSuggestions from "./FollowSuggestions";

export default function Feed() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // ——— Pagination via useFeed (returns ALL post types) ———
  const pageSize = 10;
  const { posts, error, size, setSize, isValidating, isLoadingMore, hasMore } =
    useFeed(pageSize);

  // new state for health-news:
  const [newsPage, setNewsPage] = useState(0);
  const [news, setNews] = useState([]);
  const [newsHasMore, setNewsHasMore] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);

  // when we switch to HealthNews tab, fetch page
  const fetchNews = async (page) => {
    setNewsLoading(true);
    const res = await fetch(`/api/health-news?limit=20&page=${page}`);
    const json = await res.json();
    setNews((prev) => (page === 0 ? json.news : [...prev, ...json.news]));
    setNewsHasMore(json.hasMore);
    setNewsLoading(false);
  };

  // We will display only posts whose `type` matches selectedTab
  const [selectedTab, setSelectedTab] = useState("THREAD"); // "THREAD" or "DEEP"

  // IntersectionObserver for infinite‐scroll (unchanged)
  const observerRef = useRef();
  const lastPostRef = useCallback(
    (node) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (selectedTab === "HEALTH") {
            if (newsHasMore) setNewsPage((p) => p + 1);
          } else if (hasMore) {
            setSize(size + 1);
          }
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasMore, newsHasMore, selectedTab]
  );

  // Fetch current user once on mount (unchanged)
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const { user } = await res.json();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setUserLoaded(true);
    }
    fetchUser();
  }, []);

  // fetch first news page on mount or tab switch
  useEffect(() => {
    if (selectedTab === "HEALTH") {
      setNewsPage(0);
      fetchNews(0);
    }
  }, [selectedTab]);

  // Error / loading states
  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Failed to load feed. Try refreshing?</p>
      </div>
    );
  }
  const isLoadingInitialData = !posts.length && isValidating;
  if (isLoadingInitialData && selectedTab !== "HEALTH") {
    return <Loading message="Loading Feed…" />;
  }

  if (!isLoadingInitialData && posts.length === 0) {
    return (
      <div className="mb-10">
        <EmptyFeed message="Your feed is empty." />
        <FollowSuggestions limit={5} />
      </div>
    );
  }

  // Filter posts by type
  const displayedPosts =
    selectedTab === "HEALTH"
      ? news
      : posts.filter((p) => p.type === selectedTab);

  return (
    <div className="mb-10">
      {/* ——— “Sign in” Banner ——— */}
      {userLoaded && !currentUser && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
          role="alert"
        >
          <p>
            You’re not signed in.{" "}
            <a
              href="/signin"
              className="font-medium text-indigo-600 hover:underline"
            >
              Sign in
            </a>{" "}
            to create or interact with posts.
          </p>
        </div>
      )}

      {/* ——— Tabs: “Threads” vs. “Deep” ——— */}
      <div className="flex justify-center space-x-4 mb-6">
        {[
          { key: "THREAD", label: "Threads" },
          { key: "DEEP", label: "Deep" },
          { key: "HEALTH", label: "Medical News" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedTab(key)}
            className={`px-4 py-2 rounded-full text-sm ${
              selectedTab === key
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ——— Render posts of the selected type ——— */}
      {selectedTab === "HEALTH" &&
        displayedPosts.length === 0 &&
        !newsLoading && <EmptyFeed message="No medical news found." />}
      {displayedPosts.map((item, idx) => {
        if (selectedTab === "HEALTH") {
          // render a news card
          const isLast = idx === displayedPosts.length - 1;
          return (
            <div key={item.id} ref={isLast ? lastPostRef : null}>
              <div className="bg-white p-4 mb-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-indigo-600">
                    {item.source}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.publishedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-gray-700 text-sm line-clamp-3">
                  {item.summary}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-indigo-600 hover:underline text-sm"
                >
                  Read more
                </a>
              </div>
            </div>
          );
        } else {
          // normal PostCard
          const isLast = idx === displayedPosts.length - 1;
          return idx === displayedPosts.length - 1 ? (
            <div key={item.id} ref={lastPostRef}>
              <PostCard post={item} />
            </div>
          ) : (
            <PostCard key={item.id} post={item} />
          );
        }
      })}

      {/* loader / end of content */}
      {selectedTab === "HEALTH" ? (
        newsLoading ? (
          <Loading message="Loading News…" />
        ) : !newsHasMore ? (
          <div className="py-4 text-center text-gray-500">No more news.</div>
        ) : null
      ) : isLoadingMore ? (
        <div className="py-4 text-center text-gray-500">Loading more…</div>
      ) : !hasMore ? (
        <div className="py-4 text-center text-gray-500">End of feed.</div>
      ) : null}
    </div>
  );
}
