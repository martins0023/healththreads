// components/CommentList.jsx

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon as OutlineHeart } from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeart } from "@heroicons/react/24/solid";
import CommentForm from "./CommentForm";
import { showToast } from "../lib/toast";

/**
 * Props:
 *   - postId: string
 *   - comments: Array of top-level comment objects (each with `replies` nested)
 *   - currentUser: { id, name, avatarUrl } or null
 *   - onCommentAdded: callback function to re-fetch all comments (passed from PostDetail)
 */
export default function CommentList({
  postId,
  comments,
  currentUser,
  onCommentAdded,
}) {
  // Default to “recent” so newest comments show first
  const [sortBy, setSortBy] = useState("recent"); // changed default to "recent"

  // Sort top-level comments by the selected criteria
  const sortedComments = useMemo(() => {
    const clone = [...comments];
    if (sortBy === "popular") {
      return clone.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      // "recent": sort by createdAt descending
      return clone.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }, [comments, sortBy]);

  return (
    <div className="space-y-6">
      {/* SORT TOGGLE */}
      <div className="flex items-center justify-end space-x-4">
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            sortBy === "popular"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setSortBy("popular")}
        >
          Popular
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            sortBy === "recent"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setSortBy("recent")}
        >
          Recent
        </button>
      </div>

      {/* RENDER EACH TOP-LEVEL COMMENT */}
      {sortedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          currentUser={currentUser}
          level={0}
          onCommentAdded={onCommentAdded} 
        />
      ))}
    </div>
  );
}

/**
 * Renders a single comment + nested replies recursively.
 *
 * Props:
 *   - comment: {
 *         id, text, author: { id, name, avatarUrl }, createdAt,
 *         likeCount, likedByCurrentUser,
 *         replies: [ {...}, {...} ]
 *     }
 *   - postId: the parent post’s ID
 *   - currentUser: { id, name, avatarUrl } or null
 *   - level: 0 for top-level, 1 for first‐level reply, etc.
 *   - onCommentAdded: callback to re-fetch all comments after a reply is posted
 */
function CommentItem({
  comment,
  postId,
  currentUser,
  level,
  onCommentAdded,
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [liked, setLiked] = useState(!!comment.likedByCurrentUser);

  // 1. Toggle a comment like (optimistic UI, then server update)
  const handleCommentLike = async () => {
    if (!currentUser) {
      window.location.href = "/signin";
      return;
    }

    // Optimistic update
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      setLiked(false);
      setLikeCount((c) => c - 1);
    }

    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to like comment");
      }
      const { liked: newLiked, likeCount: serverCount } = await res.json();
      setLiked(newLiked);
      setLikeCount(serverCount);
    } catch (err) {
      console.error("Failed to like comment:", err);
      // Roll back
      if (!liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
      showToast("Could not like comment", "error");
    }
  };

  return (
    <div
      className={`${
        level > 0 ? "border-l border-gray-200 pl-4" : ""
      } space-y-2`}
    >
      {/* COMMENT HEADER */}
      <div className="flex items-start space-x-3">
        <img
          src={comment.author.avatarUrl || "/avatars/default-pic.jpg"}
          alt={comment.author.name}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {comment.author.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <p className="mt-1 text-gray-800 text-sm">{comment.text}</p>

          {/* COMMENT ACTIONS: Like / Reply */}
          <div className="flex items-center space-x-6 text-xs text-gray-500 mt-1">
            <button
              onClick={handleCommentLike}
              disabled={liked}
              className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
            >
              {liked ? (
                <SolidHeart className="h-4 w-4 text-red-500" />
              ) : (
                <OutlineHeart className="h-4 w-4" />
              )}
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => {
                if (!currentUser) {
                  window.location.href = "/signin";
                  return;
                }
                setShowReplyForm((prev) => !prev);
              }}
              className="hover:underline focus:outline-none text-indigo-600"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* REPLY FORM (if toggled on) */}
      {showReplyForm && currentUser && (
        <div className="mt-2 pl-10 w-full">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => {
              setShowReplyForm(false);
              onCommentAdded();         // ← re-fetch all comments after posting a reply
            }}
          />
        </div>
      )}

      {/* NESTED REPLIES (recursive) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUser={currentUser}
              level={level + 1}
              onCommentAdded={onCommentAdded}  // ← pass same callback down
            />
          ))}
        </div>
      )}
    </div>
  );
}
