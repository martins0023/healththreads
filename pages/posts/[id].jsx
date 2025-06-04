// pages/posts/[id].jsx

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import prisma from "../../lib/prisma";
import { getUserFromToken } from "../../lib/auth";
import CommentList from "../../components/CommentList";
import CommentForm from "../../components/CommentForm";
import { showToast } from "../../lib/toast";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon as OutlineHeart } from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeart } from "@heroicons/react/24/solid";
import Link from "next/link";

/**
 * Use getServerSideProps to fetch only the post itself (not comments).
 * All comment loading is done client-side via the /api/posts/[id]/comments route.
 */
export async function getServerSideProps(context) {
  const postId = context.params.id;

  // 1. Fetch the post (including author & media)
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      mediaAssets: true,
    },
  });

  if (!post) {
    return { notFound: true };
  }

  // 2. Determine if the current user liked this post (optional)
  let likedByCurrentUser = false;
  try {
    const user = await getUserFromToken(context.req);
    if (user) {
      const like = await prisma.like.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      });
      likedByCurrentUser = !!like;
    }
  } catch {
    likedByCurrentUser = false;
  }

  return {
    props: {
      post: JSON.parse(JSON.stringify(post)), // serialize dates
      likedByCurrentUser,
    },
  };
}

export default function PostDetail({ post, likedByCurrentUser }) {
  const router = useRouter();
  const [allComments, setAllComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const { user } = await res.json();
        setCurrentUser(user);
      }
    }
    fetchUser();
  }, []);

  // 2. Fetch nested comments on mount (and after replies)
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      const { comments } = await res.json();
      setAllComments(comments);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  // 3. Toggle like logic for the post itself
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liked, setLiked] = useState(likedByCurrentUser);

  const toggleLike = async () => {
    if (!currentUser) {
      router.push("/signin");
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
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Like failed");
      const { liked: newLiked, likeCount: serverCount } = await res.json();
      setLiked(newLiked);
      setLikeCount(serverCount);
    } catch (err) {
      console.error("Toggle like error:", err);
      // Roll back if error
      if (!liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      } else {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
      showToast("Could not update post like", "error");
    }
  };

  return (
    <>
      <Head>
        <title>{post.author.name}’s post</title>
        {/* Open Graph tags for sharing preview */}
        <meta
          property="og:title"
          content={`${post.author.name} on HealthThreads`}
        />
        <meta
          property="og:description"
          content={post.textContent
            ? post.textContent.slice(0, 100)
            : "Check out this post"}
        />
        {post.mediaAssets.length > 0 &&
          post.mediaAssets[0].type === "IMAGE" && (
            <meta
              property="og:image"
              content={post.mediaAssets[0].url}
            />
          )}
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_BASE_URL}/posts/${post.id}`}
        />
        <meta property="og:type" content="article" />
      </Head>

      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {/* Back to feed link */}
        <div>
          <Link href="/" className="text-indigo-600 hover:underline">
              &larr; Back to Feed
          </Link>
        </div>

        {/* Post Content */}
        <article className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="flex items-center px-4 py-3">
            <img
              src={post.author.avatarUrl || "/avatars/default-pic.jpg"}
              alt={post.author.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {post.author.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {post.textContent && (
            <div className="px-4 pb-4">
              <p className="text-gray-800 text-sm leading-relaxed">
                {post.textContent}
              </p>
            </div>
          )}

          {post.mediaAssets.length > 0 && (
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
                      <audio
                        controls
                        src={media.url}
                        className="flex-1"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Post Actions: Like / Comment / Share */}
          <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
            {/* Like Button */}
            <button
              onClick={toggleLike}
              className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
            >
              {liked ? (
                <SolidHeart className="h-5 w-5 text-red-500" />
              ) : (
                <OutlineHeart className="h-5 w-5" />
              )}
              <span>{likeCount}</span>
            </button>

            {/* Comment Count (scroll to comment section) */}
            <button
              onClick={() => {
                document
                  .getElementById("comment-section")
                  .scrollIntoView({ behavior: "smooth" });
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
                <path
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.92 9.92 0 01-4.832-1.29L3 20l1.29-4.832A9.92 9.92 0 013 12c0-4.97 3.582-9 8-9s8 4.03 8 9z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>{post.commentCount}</span>
            </button>

            {/* Share Button */}
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

        {/* COMMENTS SECTION */}
        <div id="comment-section" className="space-y-6">
          {currentUser ? (
            <CommentForm
              postId={post.id}
              parentId={null}
              onSuccess={fetchComments}
            />
          ) : (
            <div className="text-sm text-gray-600">
              <Link href="/signin" className="text-indigo-600 hover:underline">Sign in
              </Link>{" "}
              to comment.
            </div>
          )}

          <CommentList
            postId={post.id}
            comments={allComments}
            currentUser={currentUser}
            onCommentAdded={fetchComments}       
          />
        </div>
      </div>
    </>
  );
}
