// pages/communities.jsx

import { useEffect, useState } from "react";
import CommunityCard from "../components/CommunityCard";
import StoryBar from "../components/StoryBar";
import UploadStoryModal from "../components/UploadStoryModal";
import StoryViewerModal from "../components/StoryViewerModal";
import {
  CheckBadgeIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";
import CreateCommunityModal from "../components/CreateCommunityModal";

// --------------------------------------------
// Helper: Fetch the current user (or null).
async function fetchCurrentUser() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const { user } = await res.json();
    return user || null;
  } catch {
    return null;
  }
}
// --------------------------------------------
// Main `Communities` page component
export default function Communities() {
  // — State for groups + loading/errors
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState("");

  // — State for currentUser + loadingUser
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // — “Create Community” modal (same as before)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // — “Upload Story” modal
  const [storyUploadGroupId, setStoryUploadGroupId] = useState(null);

  // — “View Stories” modal
  const [storyViewGroupId, setStoryViewGroupId] = useState(null);

  // 1) On mount, fetch current user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const u = await fetchCurrentUser();
      if (isMounted) {
        setCurrentUser(u);
        setLoadingUser(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2) On mount, fetch all public groups
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch("/api/groups", { credentials: "include" });
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
          setGroupsError("Could not load communities. Try again.");
        }
      } finally {
        if (isMounted) {
          setLoadingGroups(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3) Handler when a CommunityCard toggles join/leave
  const handleToggle = (groupId, newIsMember, newCount) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, isMember: newIsMember, memberCount: newCount }
          : g
      )
    );
  };

  // 4) Callback when a new group is created (prepend to list)
  const handleNewGroupCreated = (createdGroup) => {
    setGroups((prev) => [createdGroup, ...prev]);
  };

  // 5) Extract only the groups that the current user belongs to:
  const memberGroups = groups.filter((g) => g.isMember);

  return (
    <>
      <div className="max-w-3xl mx-auto py-4 sm:px-6 lg:px-8">
        {!loadingUser && currentUser && memberGroups.length > 0 && (
          <StoryBar
            memberGroups={memberGroups}
            currentUser={currentUser}
            onViewStories={(gid) => setStoryViewGroupId(gid)}
            onAddStory={(gid) => setStoryUploadGroupId(gid)}
          />
        )}
      </div>

      {/* Upload Story Modal */}
      <UploadStoryModal
        isOpen={!!storyUploadGroupId}
        onClose={() => setStoryUploadGroupId(null)}
        groupId={storyUploadGroupId}
        onUploaded={() => {
          // After upload, we re‐render StoryBar so it fetches fresh stories
          setStoryUploadGroupId(null);
        }}
      />

      {/* View Stories Modal */}
      <StoryViewerModal
        isOpen={!!storyViewGroupId}
        onClose={() => setStoryViewGroupId(null)}
        groupId={storyViewGroupId}
      />
      <div className="max-w-3xl mb-10 mx-auto py-5 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-grotesk">
          Health Tribes & Circles
        </h2>
        <p className="text-gray-600 mb-6">
          Join or browse community groups (“Health Tribes”) to connect with
          peers.
        </p>

        {/* — If user is a verified practitioner, show the “Create Community” button — */}
        {!loadingUser && currentUser && currentUser.isPractitioner && (
          <div className="mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2 text-white" />
              Create Community
            </button>
          </div>
        )}

        {/* — Modal for “Create Community” form — */}
        <CreateCommunityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleNewGroupCreated}
        />

        {/* — Render either: Loading, Error, “No communities”, or the grid — */}
        {loadingGroups ? (
          <div className="py-12 text-center text-gray-500">
            Loading communities…
          </div>
        ) : groupsError ? (
          <div className="py-12 text-center text-red-500">{groupsError}</div>
        ) : (
          <>
            {groups.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-4">
                <p>No communities available.</p>

                {/* If no communities AND user is a practitioner, encourage creation */}
                {!loadingUser && currentUser && currentUser.isPractitioner && (
                  <p className="flex items-center flex-col gap-2 text-sm text-gray-600">
                    <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                    You’re a verified practitioner—click “Create Community”
                    above to start your first group!
                  </p>
                )}
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
          </>
        )}
      </div>
    </>
  );
}
