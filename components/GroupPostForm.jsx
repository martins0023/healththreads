import React, { useState, useRef } from "react";
import {
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  FaceSmileIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { showToast } from "../lib/toast";

/**
 * Props:
 *   - groupId: string
 *   - onPostCreated: (newPost) => void
 *
 * This form allows attaching IMAGE, VIDEO or AUDIO, matching <MediaAsset> in Prisma.
 * The toolbar includes:
 *   • PhotoIcon   → opens file picker for images
 *   • VideoCameraIcon → opens file picker for videos
 *   • MicrophoneIcon  → opens file picker for audio
 *   • FaceSmileIcon, ChartBarIcon, CalendarDaysIcon (placeholders at 50% opacity)
 */
export default function GroupPostForm({ groupId, onPostCreated }) {
  const [newText, setNewText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // "IMAGE" | "VIDEO" | "AUDIO"
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef();

  // Step 1: Upload a single file to S3 via presigned URL
  const uploadToS3 = async (file, mediaType) => {
    const query = new URLSearchParams({ type: mediaType, filename: file.name });
    const presignRes = await fetch(`/api/media/presign?${query.toString()}`, {
      credentials: "include",
    });
    if (!presignRes.ok) throw new Error("Failed to get presigned URL");
    const { url: presignedUrl, publicUrl } = await presignRes.json();

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error("S3 upload failed:", uploadRes.status, text);
      throw new Error("Failed to upload file to S3");
    }
    return publicUrl;
  };

  // When user picks a file (could be image, video or audio)
  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedType(null);
      return;
    }

    // Determine which mediaType to use
    let mediaType = "IMAGE";
    if (f.type.startsWith("video/")) {
      mediaType = "VIDEO";
    } else if (f.type.startsWith("audio/")) {
      mediaType = "AUDIO";
    }

    setSelectedFile(f);
    setSelectedType(mediaType);
    setPreviewUrl(URL.createObjectURL(f));
  };

  // When user clicks the Photo/Video/Audio icon, we set accept accordingly
  const openFilePicker = (type) => {
    // Set the accept attribute on the DOM <input>
    if (type === "IMAGE") {
      fileInputRef.current.accept = "image/*";
    } else if (type === "VIDEO") {
      fileInputRef.current.accept = "video/*";
    } else if (type === "AUDIO") {
      fileInputRef.current.accept = "audio/*";
    }
    fileInputRef.current.click();
  };

  // Submit handler: upload media (if any), then POST to our API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newText.trim() && !selectedFile) {
      alert("Please enter text or select media.");
      return;
    }
    setSubmitting(true);

    try {
      let imageUrl = null;
      let videoUrl = null;
      let audioUrl = null;

      if (selectedFile) {
        const url = await uploadToS3(selectedFile, selectedType.toLowerCase());
        if (selectedType === "IMAGE") imageUrl = url;
        else if (selectedType === "VIDEO") videoUrl = url;
        else if (selectedType === "AUDIO") audioUrl = url;
      }

      // Build payload exactly as the API expects:
      const payload = {
        text: newText,
        imageUrl,
        videoUrl,
        audioUrl,
        type: "THREAD",
        title: null,
      };

      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create post");
      }

      const { post: created } = await res.json();

      // Prepare post object for immediate rendering:
      const serialized = {
        id: created.id,
        author: created.author,
        mediaAssets: created.mediaAssets,
        textContent: created.textContent,
        type: created.type,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        likeCount: created.likeCount,
        commentCount: created.commentCount,
        likedByCurrentUser: false,
      };

      onPostCreated(serialized);
      showToast("Post created in group!", "success");

      // Reset form
      setNewText("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedType(null);
    } catch (err) {
      console.error("Error creating community post:", err);
      showToast(err.message || "Error creating post", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-3">
        {/* 1) Textarea */}
        <textarea
          rows={4}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="What’s bothering your mind?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        />

        {/* 2) Preview if media selected */}
        {previewUrl && selectedType === "IMAGE" && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Image preview"
              className="w-full max-h-60 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setSelectedType(null);
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
              aria-label="Remove image"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {previewUrl && selectedType === "VIDEO" && (
          <div className="relative">
            <video
              src={previewUrl}
              controls
              className="w-full max-h-60 object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setSelectedType(null);
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
              aria-label="Remove video"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {previewUrl && selectedType === "AUDIO" && (
          <div className="relative">
            <audio src={previewUrl} controls className="w-full" />
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setSelectedType(null);
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
              aria-label="Remove audio"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        {/* 3) Icon toolbar + Submit */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            {/* Photo icon: accept images */}
            <button
              type="button"
              onClick={() => openFilePicker("IMAGE")}
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
              title="Add photo"
            >
              <PhotoIcon className="h-6 w-6 text-indigo-600" />
            </button>

            {/* Video icon: accept videos */}
            <button
              type="button"
              onClick={() => openFilePicker("VIDEO")}
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
              title="Add video"
            >
              <VideoCameraIcon className="h-6 w-6 text-indigo-600" />
            </button>

            {/* Audio icon: accept audio */}
            <button
              type="button"
              onClick={() => openFilePicker("AUDIO")}
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
              title="Add audio"
            >
              <MicrophoneIcon className="h-6 w-6 text-indigo-600" />
            </button>

            {/* GIF placeholder (50% opacity) */}
            {/* <button
              type="button"
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors cursor-not-allowed opacity-50"
              title="Add GIF (coming soon)"
            >
              <FaceSmileIcon className="h-6 w-6 text-gray-400" />
            </button> */}

            {/* Poll placeholder */}
            {/* <button
              type="button"
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors cursor-not-allowed opacity-50"
              title="Create poll (coming soon)"
            >
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </button> */}

            {/* Schedule placeholder */}
            {/* <button
              type="button"
              className="p-2 rounded-full hover:bg-indigo-100 transition-colors cursor-not-allowed opacity-50"
              title="Schedule (coming soon)"
            >
              <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
            </button> */}
          </div>

          {/* “Post” button */}
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full shadow-sm transition-colors ${
              submitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-indigo-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {/* Hidden file input (accepts image/video/audio based on which icon was clicked) */}
      <input
        type="file"
        accept="image/*,video/*,audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}

/**
 * Helper to open the correct accept filter.
 * This must be defined *below* the component, or you can inline it above.
 */
function openFilePicker(type) {
  if (!fileInputRef.current) return;
  if (type === "IMAGE") {
    fileInputRef.current.accept = "image/*";
  } else if (type === "VIDEO") {
    fileInputRef.current.accept = "video/*";
  } else if (type === "AUDIO") {
    fileInputRef.current.accept = "audio/*";
  } else {
    fileInputRef.current.accept = "";
  }
  fileInputRef.current.click();
}
