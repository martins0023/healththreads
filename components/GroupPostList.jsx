// components/GroupPostList.jsx

import React from "react";
import PostCard from "./PostCard";

export default function GroupPostList({ posts }) {
  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet. Be the first!</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
