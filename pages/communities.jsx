// pages/communities.jsx

import { useEffect, useState } from "react";
import CommunityCard from "../components/CommunityCard";
import Layout from "../components/Layout";
// import { getUserFromToken } from "../lib/auth"; // for server-side auth if needed

export default function Communities() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all public groups on mount
  useEffect(() => {
    async function fetchGroups() {
      setLoading(true);
      try {
        const res = await fetch("/api/groups", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load communities.");
        }
        const { groups } = await res.json();
        setGroups(groups);
      } catch (err) {
        console.error("Error fetching communities:", err);
        setError("Could not load communities. Try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  // Handler when a single group’s membership toggles
  const handleToggle = (groupId, newIsMember, newCount) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, isMember: newIsMember, memberCount: newCount }
          : g
      )
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Health Tribes & Circles
        </h2>
        <p className="text-gray-600 mb-6">
          Join or browse the community groups (“Health Tribes”) to connect with peers.
        </p>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading communities…
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">{error}</div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No communities available.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {groups.map((group) => (
              <CommunityCard
                key={group.id}
                group={group}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
