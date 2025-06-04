// components/PostCard.jsx

import { formatDistanceToNow } from "date-fns";

export default function PostCard({ post }) {
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
          <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Text Content */}
      {post.textContent && (
        <div className="px-4 pb-4">
          <p className="text-gray-800 text-sm leading-relaxed">{post.textContent}</p>
        </div>
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
                <div key={media.id} className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <audio controls src={media.url} className="flex-1" />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Footer: Like / Comment / Share (same as before) */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
        <button className="flex items-center space-x-1 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Like</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-gray-700">
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
          <span>Comment</span>
        </button>
        <button className="flex items-center space-x-1 hover:text-gray-700">
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
