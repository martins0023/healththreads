// components/PostCard.jsx

import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import Link from "next/link";
import { showToast } from "../lib/toast";
import { HeartIcon as OutlineHeart } from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeart } from "@heroicons/react/24/solid";
import { CheckBadgeIcon } from "@heroicons/react/24/solid"; // ← import the badge icon
import { useRouter } from "next/router";

function stripHtml(html) {
  if (!html) return "";
  // Remove anything between <...>
  return html.replace(/<[^>]*>/g, "");
}

export default function PostCard({ post }) {
  const router = useRouter();
  const isDetailPage = router.pathname === "/posts/[id]";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  // On mount, set `liked` from post.likedByCurrentUser (if provided)
  useEffect(() => {
    setLiked(!!post.likedByCurrentUser);
  }, [post.likedByCurrentUser]);

  // Toggle like (optimistic + server)
  const toggleLike = async () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      setLiked(false);
      setLikeCount((c) => c - 1);
    }
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Like failed");
      const { liked: newLiked, likeCount: newCount } = await res.json();
      setLiked(newLiked);
      setLikeCount(newCount);
    } catch (err) {
      console.error("Error toggling like:", err);
      // Roll back
      if (!liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
      showToast("Could not update like", "error");
    }
  };

  return (
    <article className="bg-white shadow-sm rounded-lg mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3">
        <img
          src={post.author.avatarUrl || "/avatars/default-pic.jpg"}
          alt={post.author.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="ml-3">
          <p className="flex items-center text-sm font-medium text-gray-900">
            {post.author.name}
            {/* If the author is a verified practitioner, render a check badge */}
            {post.author.isPractitioner && (
              <CheckBadgeIcon className="h-5 w-5 text-blue-500 ml-1" />
            )}
          </p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* If DEEP: render HTML; else render plain text */}
      {post.type === "DEEP" && post.title && (
        <div className="px-4 pt-2">
          <h2 className="text-lg font-semibold text-gray-800">{post.title}</h2>
        </div>
      )}

      {post.type === "DEEP" ? (
        isDetailPage ? (
          // ─── On the detail page, render full HTML safely ─────────────────
          <div
            className="px-4 pb-4 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.textContent }}
          />
        ) : (
          // ─── On any other page (feed/profile/blogs tab), show a truncated preview ───
          <div className="px-4 pb-4">
            <p className="text-gray-800 text-sm leading-relaxed">
              {(() => {
                const plain = stripHtml(post.textContent || "");
                if (plain.length <= 300) {
                  return plain;
                }
                return `${plain.slice(0, 300)}... `;
              })()}
              {(() => {
                const plain = stripHtml(post.textContent || "");
                if (plain.length > 300) {
                  return (
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Read more
                    </Link>
                  );
                }
                return null;
              })()}
            </p>
          </div>
        )
      ) : (
        // ─── THREADS (short posts) render normal text content ─────────────────────────
        post.textContent && (
          <div className="px-4 pb-4">
            <p className="text-gray-800 text-sm leading-relaxed">
              {post.textContent}
            </p>
          </div>
        )
      )}

      {/* Media Assets */}
      {post.mediaAssets && post.mediaAssets.length > 0 && (
        <div className="px-4 pb-4 space-y-4">
          {post.mediaAssets.map((media) => {
            if (media.type === "IMAGE") {
              return (
                <img
                  key={media.id}
                  src={media.url}
                  alt="User upload"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
              );
            }
            if (media.type === "VIDEO") {
              return (
                <video
                  key={media.id}
                  src={media.url}
                  controls
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
              );
            }
            if (media.type === "AUDIO") {
              return (
                <div
                  key={media.id}
                  className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-200"
                >
                  <audio controls src={media.url} className="flex-1" />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Footer: Like / Comment / Share */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
        {/* Like */}
        <button
          onClick={toggleLike}
          className="flex items-center space-x-1 hover:text-gray-700"
        >
          {liked ? (
            <SolidHeart className="h-5 w-5 text-red-500" />
          ) : (
            <OutlineHeart className="h-5 w-5" />
          )}
          <span>{likeCount}</span>
        </button>

        {/* Comment (link to detail) */}
        <Link
          href={`/posts/${post.id}`}
          className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.92 9.92 0 01-4.832-1.29L3 20l1.29-4.832A9.92 9.92 0 013 12c0-4.97 3.582-9 8-9s8 4.03 8 9z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span>{post.commentCount}</span>
        </Link>

        {/* Share */}
        <button
          onClick={() => {
            const shareUrl = `${window.location.origin}/posts/${post.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
              showToast("Post link copied to clipboard!", "info");
            });
          }}
          className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-6 6h3v2a2 2 0 002 2z" />
          </svg>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}
