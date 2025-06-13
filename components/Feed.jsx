// components/Feed.jsx

import { useEffect, useRef, useState, useCallback } from "react";
import { Share2, Heart, MessageCircle, Repeat } from "lucide-react"; // For modern icons
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

  const formatPostDate = (dateString) => {
    if (!dateString) return "Date Unknown"; // Handle undefined or null dateString
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date"; // Handle invalid date strings

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime()); // Use getTime() for reliable difference
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? "just now" : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}w ago`;
    }
    // Fallback for older dates: Month Day, Year (e.g., Jun 12, 2025)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // new state for health-news:
  const [newsPage, setNewsPage] = useState(0);
  const [news, setNews] = useState([]);
  const [newsHasMore, setNewsHasMore] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);

  // when we switch to HealthNews tab, fetch page
  const fetchNews = async (page) => {
    setNewsLoading(true);
    const res = await fetch(`/api/health-news?limit=10&page=${page}`);
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
            <div
              className="mb-4"
              key={item.id}
              ref={isLast ? lastPostRef : null}
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-neutral-200 hover:shadow-lg transition-shadow duration-200">
                <div className="p-4 flex flex-col space-y-2">
                  {/* Source and Published Date */}
                  <div className="flex justify-between items-center text-sm font-medium text-neutral-500">
                    <span className="text-blue-600 font-semibold">
                      {item.source || "Unknown Source"}
                    </span>
                    <span className="text-neutral-500">
                      {formatPostDate(item.publishedAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-800 leading-tight">
                    <a
                      href={item.url || "#"} // Fallback to '#' if url is missing
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {item.title || "No Title Available"}
                    </a>
                  </h3>

                  {/* Summary */}
                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-3">
                    {item.summary || "No summary available."}
                  </p>

                  {/* Reaction and Share Buttons */}
                  <div className="flex justify-around items-center pt-3 border-t border-neutral-100 mt-4">
                    {/* Likes/Heart Button */}
                    <button
                      className="flex items-center text-neutral-500 hover:text-red-500 transition-colors duration-200 focus:outline-none"
                      onClick={() => console.log("Like clicked for:", item.id)} // Placeholder action
                    >
                      <Heart className="h-5 w-5 mr-1" />
                      <span className="text-sm">
                        {item.likes != null ? item.likes : 0}
                      </span>{" "}
                      {/* Display likes count */}
                    </button>

                    {/* Comments Button */}
                    <button
                      className="flex items-center text-neutral-500 hover:text-blue-500 transition-colors duration-200 focus:outline-none"
                      onClick={() =>
                        console.log("Comment clicked for:", item.id)
                      } // Placeholder action
                    >
                      <MessageCircle className="h-5 w-5 mr-1" />
                      <span className="text-sm">
                        {item.comments != null ? item.comments : 0}
                      </span>{" "}
                      {/* Display comments count */}
                    </button>

                    {/* Share/Retweet Button */}
                    <button
                      className="flex items-center text-neutral-500 hover:text-green-500 transition-colors duration-200 focus:outline-none"
                      onClick={() => console.log("Share clicked for:", item.id)} // Placeholder action
                    >
                      <Repeat className="h-5 w-5 mr-1" />
                      <span className="text-sm">
                        {item.shares != null ? item.shares : 0}
                      </span>{" "}
                      {/* Display shares count */}
                    </button>

                    {/* Generic Share Button (e.g., via Web Share API) */}
                    <button
                      className="flex items-center text-neutral-500 hover:text-gray-900 transition-colors duration-200 focus:outline-none"
                      onClick={() => {
                        const shareData = {
                          title: item.title || "Health News",
                          text: item.summary || "",
                          url: item.url || window.location.href, // Fallback to current URL if item.url is missing
                        };
                        if (navigator.share) {
                          navigator
                            .share(shareData)
                            .then(() => console.log("Successful share"))
                            .catch((error) =>
                              console.log("Error sharing", error)
                            );
                        } else {
                          // Fallback for browsers that don't support Web Share API
                          navigator.clipboard.writeText(shareData.url); // Copy URL to clipboard
                          // Using a simple message, not alert() as per instructions
                          console.log(
                            "Link copied to clipboard:",
                            shareData.url
                          );
                          // You might display a temporary message in the UI here instead of alert.
                        }
                      }}
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
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
