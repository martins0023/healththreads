// components/UploadStoryModal.jsx

import { useState, useRef, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { showToast } from "../lib/toast";

/**
 * uploadToS3:
 *  - Requests a presigned S3 URL from /api/media/presign
 *  - PUTs the file to that URL
 *  - Returns the resulting `publicUrl`
 *
 * If anything goes wrong, we log the exact status & body from the presign endpoint,
 * then throw a descriptive Error so the caller can show a toast.
 */
async function uploadToS3(file, mediaType) {
  // Build the query string: ?type=image/video&filename=originalFilename
  const query = new URLSearchParams({
    type: mediaType,
    filename: file.name,
  }).toString();

  let presignRes;
  try {
    presignRes = await fetch(`/api/media/presign?${query}`, {
      method: "GET",
      credentials: "include",
    });
  } catch (networkErr) {
    console.error("Network error calling /api/media/presign:", networkErr);
    throw new Error("Network error requesting upload URL");
  }

  if (!presignRes.ok) {
    let errText = "";
    try {
      // Attempt to read any JSON body
      const body = await presignRes.json();
      errText = JSON.stringify(body);
    } catch {
      errText = await presignRes.text();
    }
    console.error(
      `Presign endpoint returned ${presignRes.status}. Body: ${errText}`
    );
    throw new Error(
      `Failed to get presigned URL (status ${presignRes.status})`
    );
  }

  let json;
  try {
    json = await presignRes.json();
  } catch (parseErr) {
    console.error("Failed to parse JSON from /api/media/presign:", parseErr);
    throw new Error("Invalid JSON from presign endpoint");
  }

  const { url: presignedUrl, publicUrl } = json;
  if (!presignedUrl || !publicUrl) {
    console.error(
      "Presign endpoint did not return both `url` and `publicUrl`:",
      json
    );
    throw new Error("Presign endpoint returned invalid data");
  }

  // 2) Upload the file via PUT
  let uploadRes;
  try {
    uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
  } catch (networkErr) {
    console.error("Network error uploading to S3:", networkErr);
    throw new Error("Network error uploading file");
  }

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    console.error(
      "S3 upload failed; status:",
      uploadRes.status,
      "body:",
      text
    );
    throw new Error("Failed to upload file to S3");
  }

  return publicUrl;
}

export default function UploadStoryModal({
  isOpen,
  onClose,
  groupId,
  onUploaded,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef();

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose an image or video.");
      return;
    }
    setUploading(true);
    setError("");

    try {
      // Determine mediaType: if it starts with "video/", treat as VIDEO; otherwise IMAGE
      const mime = file.type || "";
      const mediaType = mime.startsWith("video/") ? "VIDEO" : "IMAGE";

      // 1) Upload to S3
      let mediaUrl;
      try {
        mediaUrl = await uploadToS3(file, mediaType.toLowerCase());
      } catch (uploadErr) {
        showToast(uploadErr.message, "error");
        setUploading(false);
        return;
      }

      // 2) POST to /api/groups/[groupId]/stories
      const res = await fetch(`/api/groups/${groupId}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mediaUrl, mediaType }),
      });
      if (!res.ok) {
        let errJson = {};
        try {
          errJson = await res.json();
        } catch {}
        console.error(
          "POST /api/groups/[groupId]/stories failed:",
          res.status,
          errJson
        );
        throw new Error(errJson.error || "Failed to upload story");
      }

      showToast("Story uploaded!", "success");
      onUploaded(); // Let parent re-fetch if desired
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      console.error("Unexpected error in UploadStoryModal:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Add a Story</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <label
              htmlFor="storyFile"
              className="block text-sm font-medium text-gray-700"
            >
              Choose Image or Video
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Select File
            </button>
          </div>

          {preview && (
            <div className="mt-2">
              {file.type.startsWith("video/") ? (
                <video
                  src={preview}
                  controls
                  className="w-full max-h-48 object-contain rounded-md"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-48 object-contain rounded-md"
                />
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {uploading ? "Uploading…" : "Upload Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
