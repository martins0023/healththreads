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
  // Customize pageSize as desired
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

  // Reference to the “load more” sentinel at the bottom
  const observerRef = useRef();

  // When the sentinel intersects the viewport, load the next page
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

  // Fetch current user once on mount
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

  // Handle error state
  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        <p>Failed to load feed. Try refreshing?</p>
      </div>
    );
  }

  // If initial load is still pending
  const isLoadingInitialData = !posts.length && isValidating;
  if (isLoadingInitialData) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>Loading feed…</p>
      </div>
    );
  }

  // 3. If we have no posts after loading, show a “no posts” message
  //    (This could mean the user has no timeline posts yet.)
  if (!isLoadingInitialData && posts.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No posts found. Follow some people or create one!</p>
      </div>
    );
  }

  return (
    <div>
      {/* If userLoaded is true but no currentUser, show a banner to sign in */}
     {userLoaded && !currentUser && (
       <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
         <p>You’re not signed in. <a href="/signin" className="font-medium text-indigo-600 hover:underline">Sign in</a> to create or interact with posts.</p>
       </div>
     )}
      {/* Render each post */}
      {posts.map((post, idx) => {
        // Skip any undefined entries just in case
        if (!post) {
          return null;
        }
        // Attach the “lastPostRef” to the final item
        if (idx === posts.length - 1) {
          return (
            <div key={post.id} ref={lastPostRef}>
              <PostCard post={post} />
            </div>
          );
        } 
        // Otherwise just render normally
        return <PostCard key={post.id} post={post} />;
      })}

      {/* Loading indicator for pagination */}
      {isLoadingMore && (
        <div className="py-4 text-center text-gray-500">
          <p>Loading more…</p>
        </div>
      )}

      {/* “No more data” indicator */}
      {!hasMore && (
        <div className="py-4 text-center text-gray-500">
          <p>You’ve reached the end of the feed.</p>
        </div>
      )}
    </div>
  );
}
