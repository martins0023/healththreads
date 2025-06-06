import { XMarkIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";
import { showToast } from "../lib/toast";

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

export default function CreateCommunityModal({
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
            {createError && <p className="text-sm text-red-500">{createError}</p>}
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