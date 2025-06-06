// pages/communities.jsx

import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import CommunityCard from "../components/CommunityCard";
import { showToast } from "../lib/toast";
import { CheckBadgeIcon, PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";

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
// Helper: Upload a file to S3 via presigned URL.
async function uploadToS3(file, mediaType) {
  const query = new URLSearchParams({ type: mediaType, filename: file.name });
  const presignRes = await fetch(`/api/media/presign?${query.toString()}`, {
    credentials: "include",
  });
  if (!presignRes.ok) {
    throw new Error("Failed to get presigned URL for avatar");
  }
  const { url: presignedUrl, publicUrl } = await presignRes.json();

  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    console.error("S3 upload failed:", uploadRes.status, text);
    throw new Error("Failed to upload avatar to S3");
  }
  return publicUrl;
}

// --------------------------------------------
// Modal component containing the “Create Community” form.
function CreateCommunityModal({
  isOpen,
  onClose,
  onCreated /* callback to update parent state when new group is created */,
}) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const avatarInputRef = useRef();

  // When user picks a file, update local preview:
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      return;
    }
    setNewAvatarFile(file);
    setNewAvatarPreview(URL.createObjectURL(file));
  };

  // Submit “create new group”
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError("Name is required.");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      let avatarUrl = null;
      if (newAvatarFile) {
        avatarUrl = await uploadToS3(newAvatarFile, "image");
      }
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          avatarUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create community");
      }
      const { group: created } = await res.json();

      // Inform parent that a new group was created
      onCreated(created);

      showToast(`Created "${created.name}"!`, "success");
      // Reset form fields
      setNewName("");
      setNewDesc("");
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      onClose();
    } catch (err) {
      console.error("Error creating group:", err);
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Create a New Community
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleCreateGroup} className="px-4 py-4 space-y-4">
          {createError && (
            <p className="text-sm text-red-500">{createError}</p>
          )}
          <div>
            <label
              htmlFor="newName"
              className="block text-sm font-medium text-gray-700"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Weight Loss Warriors"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="newDesc"
              className="block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="newDesc"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short summary of your group…"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
            />
          </div>
          <div>
            <label
              htmlFor="newAvatar"
              className="block text-sm font-medium text-gray-700"
            >
              Avatar Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={avatarInputRef}
              onChange={onAvatarChange}
            />
            <div className="mt-1 flex items-center space-x-4">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Choose Image
              </button>
              {newAvatarPreview && (
                <img
                  src={newAvatarPreview}
                  alt="Avatar preview"
                  className="h-12 w-12 rounded-full object-cover border border-gray-200"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className={`inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                creating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {creating ? "Creating…" : "Create Community"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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

  // — State to control the “Create Community” modal
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <>
      <div className="max-w-3xl mb-10 mx-auto py-5 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-grotesk">
          Health Tribes & Circles
        </h2>
        <p className="text-gray-600 mb-6">
          Join or browse community groups (“Health Tribes”) to connect with peers.
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
                    You’re a verified practitioner—click “Create Community” above to start your first group!
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
