// components/Feed.jsx

import { useEffect, useRef, useState, useCallback } from "react";
import PostCard from "./PostCard";
import { useFeed } from "../lib/useFeed";
import { useRouter } from "next/router";
import Preloader from "./Preloader";

export default function Feed() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // ——— Pagination via useFeed (returns ALL post types) ———
  const pageSize = 10;
  const {
    posts,
    error,
    size,
    setSize,
    isValidating,
    isLoadingMore,
    hasMore,
  } = useFeed(pageSize);

  // We will display only posts whose `type` matches selectedTab
  const [selectedTab, setSelectedTab] = useState("THREAD"); // "THREAD" or "DEEP"

  // IntersectionObserver for infinite‐scroll (unchanged)
  const observerRef = useRef();
  const lastPostRef = useCallback(
    (node) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setSize(size + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, setSize, size, hasMore]
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

  // Error / loading states
  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Failed to load feed. Try refreshing?</p>
      </div>
    );
  }
  const isLoadingInitialData = !posts.length && isValidating;
  if (isLoadingInitialData) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>Loading feed…</p>
      </div>
    );
  }
  if (!isLoadingInitialData && posts.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No posts found. Follow some people or create one!</p>
      </div>
    );
  }

  // Filter posts by type
  const displayedPosts = posts.filter((p) => p.type === selectedTab);

  return (
    <div>
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
        <button
          onClick={() => setSelectedTab("THREAD")}
          className={`px-4 py-2 rounded-full text-sm ${
            selectedTab === "THREAD"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Threads
        </button>
        <button
          onClick={() => setSelectedTab("DEEP")}
          className={`px-4 py-2 rounded-full text-sm ${
            selectedTab === "DEEP"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Deep
        </button>
      </div>

      {/* ——— Render posts of the selected type ——— */}
      {displayedPosts.map((post, idx) => {
        if (!post) return null;
        if (idx === displayedPosts.length - 1) {
          return (
            <div key={post.id} ref={lastPostRef}>
              <PostCard post={post} />
            </div>
          );
        }
        return <PostCard key={post.id} post={post} />;
      })}

      {/* ——— Infinite‐scroll Loader & “End of feed” ——— */}
      {isLoadingMore && (
        <div className="py-4 text-center text-gray-500">
          <p>Loading more…</p>
        </div>
      )}
      {!hasMore && (
        <div className="py-4 text-center text-gray-500">
          <p>You’ve reached the end of the {selectedTab === "THREAD" ? "Threads" : "Deep"} feed.</p>
        </div>
      )}
    </div>
  );
}
