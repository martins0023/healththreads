// components/FollowSuggestions.jsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { showToast } from "../lib/toast";

export default function FollowSuggestions({ limit = 5 }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/users/top?limit=${limit}`);
        const { users } = await res.json();
        setUsers(users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  const handleFollow = async (userId) => {
    try {
      const res = await fetch(`/api/follow/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || "Failed to follow");
      }
  
      const { isFollowing, followerCount } = await res.json();
  
      if (isFollowing) {
        showToast("Now following!", "success");
        // Remove from "who to follow"
        setUsers((u) => u.filter((x) => x.id !== userId));
      } else {
        showToast("Unfollowed", "info");
        // (If you wanted, you could re‐insert them back into suggestions here)
      }
  
      // Optionally, if you have a global store of the current user's "following count",
      // update it here, or refetch / invalidate any SWR / react‐query for profile data.
    } catch (err) {
      console.error(err);
      showToast(err.message || "Error toggling follow", "error");
    }
  };

  if (loading) {
    return <p className="text-gray-500 text-center py-4">Loading suggestions…</p>;
  }
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-20">
      <h2 className="text-lg font-medium text-gray-900 mb-3">
        Who to follow
      </h2>
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={u.avatarUrl || "/avatars/default-pic.jpg"}
                alt={u.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">@{u.username}</p>
              </div>
            </div>
            <button
              onClick={() => handleFollow(u.id)}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700"
            >
              Follow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
