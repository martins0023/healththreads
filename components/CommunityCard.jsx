// components/CommunityCard.jsx

import { useState } from "react";
import { showToast } from "../lib/toast";

/**
 * Props:
 *   - group: {
 *       id,
 *       name,
 *       description,
 *       avatarUrl,
 *       memberCount,
 *       isMember
 *     }
 *   - onToggle: (groupId: string, newIsMember: boolean, newCount: number) => void
 */
export default function CommunityCard({ group, onToggle }) {
  const [isMember, setIsMember] = useState(group.isMember);
  const [memberCount, setMemberCount] = useState(group.memberCount);
  const [loading, setLoading] = useState(false);

  const handleJoinToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ groupId: group.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update membership.");
      }
      const { action, memberCount: updatedCount } = await res.json();
      const newIsMember = action === "joined";
      setIsMember(newIsMember);
      setMemberCount(updatedCount);

      showToast(
        newIsMember
          ? `You joined "${group.name}".`
          : `You left "${group.name}".`,
        newIsMember ? "success" : "info"
      );

      if (typeof onToggle === "function") {
        onToggle(group.id, newIsMember, updatedCount);
      }
    } catch (err) {
      console.error("Toggle group membership error:", err);
      showToast("Could not update membership.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col overflow-hidden">
      {/* Avatar / Icon area */}
      <div className="flex-shrink-0 flex items-center justify-center bg-gray-100 h-24">
        {group.avatarUrl ? (
          <img
            src={group.avatarUrl}
            alt={group.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-indigo-200 flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-xl">
              {group.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info + Actions */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {group.name}
        </h3>
        <p className="mt-1 text-sm text-gray-600 flex-1">
          {group.description
            ? group.description.length > 80
              ? group.description.slice(0, 80) + "…"
              : group.description
            : "No description."}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>

        <button
          onClick={handleJoinToggle}
          disabled={loading}
          className={`mt-4 inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isMember
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "…" : isMember ? "Joined" : "Join"}
        </button>
      </div>
    </div>
  );
}
