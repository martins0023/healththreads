// pages/communities.jsx

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import CommunityCard from "../components/CommunityCard";
import { showToast } from "../lib/toast";

export default function Communities() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1) Fetch all public groups from our API (client‐side).
  useEffect(() => {
    let isMounted = true; // avoid setting state after unmount

    async function fetchGroups() {
      setLoading(true);
      try {
        const res = await fetch("/api/groups", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load communities.");
        }
        const json = await res.json();
        if (isMounted) {
          setGroups(json.groups || []);
        }
      } catch (err) {
        console.error("Error fetching communities:", err);
        if (isMounted) {
          setError("Could not load communities. Try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGroups();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2) When one card’s “Join/Leave” toggles, update that one group in state.
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
          <div className="py-12 text-center text-gray-500">Loading communities…</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">{error}</div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No communities available.
          </div>
        ) : (
          // 3) Responsive grid: 1 column on mobile, 2 on sm, 3 on md, 4 on lg+
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
