// pages/create-post.jsx

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css"; // Quill styles
import { useSWRConfig } from "swr";
import {
  MicrophoneIcon,
  PhotoIcon,
  VideoCameraIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { showToast } from "../lib/toast";

// Dynamically import ReactQuill to avoid SSR errors
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function CreatePost() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // 1) Redirect to /signin if not authenticated
  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        router.replace("/signin");
      }
    }
    checkAuth();
  }, [router]);

  // 2) “type” toggle: THREAD vs. DEEP
  const [type, setType] = useState("THREAD"); // default = THREAD

  // 3) If DEEP → Title is required
  const [title, setTitle] = useState("");

  // 4) Text content: for THREAD it’s plain text; for DEEP it’s HTML from Quill
  const [text, setText] = useState("");

  // 5) Media files + previews (unchanged)
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const audioInputRef = useRef();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers for file inputs
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const handleVideoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };
  const handleAudioChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };
  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };
  const removeAudio = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioFile(null);
    setAudioPreview(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  // Upload to S3 (unchanged)
  const uploadToS3 = async (file, mediaType) => {
    const query = new URLSearchParams({ type: mediaType, filename: file.name });
    const presignRes = await fetch(`/api/media/presign?${query.toString()}`, {
      credentials: "include",
    });
    if (!presignRes.ok) {
      throw new Error("Failed to get presigned URL");
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
      throw new Error("Failed to upload file to S3");
    }
    return publicUrl;
  };

  // 6) Form submit – send { text, imageUrl, videoUrl, audioUrl, type, title }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload any media
      let imageUrl = null,
        videoUrl = null,
        audioUrl = null;
      if (imageFile) imageUrl = await uploadToS3(imageFile, "image");
      if (videoFile) videoUrl = await uploadToS3(videoFile, "video");
      if (audioFile) audioUrl = await uploadToS3(audioFile, "audio");

      // Validate Deep posts: must have a title + nonempty HTML
      if (type === "DEEP" && (!title.trim() || !text.trim())) {
        alert("Deep posts require a title and body.");
        setIsSubmitting(false);
        return;
      }

      // For Thread posts: require at least one of text or media
      if (
        type === "THREAD" &&
        !text.trim() &&
        !imageUrl &&
        !videoUrl &&
        !audioUrl
      ) {
        alert("Thread posts require text or media.");
        setIsSubmitting(false);
        return;
      }

      const postPayload = {
        text: text || "",
        imageUrl,
        videoUrl,
        audioUrl,
        type,
        title: type === "DEEP" ? title : null,
      };

      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
      });
      if (!postRes.ok) {
        const err = await postRes.json();
        throw new Error(err.error || "Failed to create post");
      }
      const { post: newPost } = await postRes.json();

      // Optimistically prepend into SWR cache
      mutate(
        "/api/feed?page=0&limit=10",
        (cached) => {
          if (!cached) {
            return { posts: [newPost], hasMore: true };
          }
          return { ...cached, posts: [newPost, ...cached.posts] };
        },
        false
      );

      showToast("Post created", "success");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("There was an error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-800 mb-2">
        Create a New Post
      </h1>

      <p className="text-sm text-gray-700 mb-4">To create a post, switch between the appropriate tag for your kind of post and create. </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        {/* ——— Toggle Buttons: THREAD vs. DEEP ——— */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setType("THREAD")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              type === "THREAD"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Thread
          </button>
          <button
            type="button"
            onClick={() => setType("DEEP")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              type === "DEEP"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Deep
          </button>
        </div>

        {/* ——— If DEEP: Title Input ——— */}
        {type === "DEEP" && (
          <div>
            <label
              htmlFor="postTitle"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="postTitle"
              name="postTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your deep post"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        )}

        {/* ——— Text Editor: Quill for DEEP, Textarea for THREAD ——— */}
        <div>
          {type === "THREAD" ? (
            <>
              <label htmlFor="postText" className="sr-only">
                Post text
              </label>
              <textarea
                id="postText"
                name="postText"
                rows={4}
                maxLength={280}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's on your mind?"
                className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
              />
              <p className="mt-1 text-right text-xs text-gray-500">
                {text.length} / 280
              </p>
            </>
          ) : (
            <>
              <label className="sr-only">Deep Post Body</label>
              <ReactQuill
                theme="snow"
                value={text}
                onChange={setText}
                placeholder="Write your deep‐dive blog post here…"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["blockquote", "code-block"],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
                formats={[
                  "header",
                  "bold",
                  "italic",
                  "underline",
                  "list",
                  "bullet",
                  "blockquote",
                  "code-block",
                  "link",
                  "image",
                ]}
              />
            </>
          )}
        </div>

        {/* ——— Media Previews ——— */}
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected"
                className="max-h-64 w-full object-contain rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white p-1 rounded-full text-gray-600 hover:text-gray-800"
                aria-label="Remove image"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          {videoPreview && (
            <div className="relative">
              <video
                src={videoPreview}
                controls
                className="max-h-64 w-full object-contain rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 bg-white p-1 rounded-full text-gray-600 hover:text-gray-800"
                aria-label="Remove video"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          {audioPreview && (
            <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <audio controls src={audioPreview} className="flex-1" />
              <button
                type="button"
                onClick={removeAudio}
                className="p-1 rounded-full text-gray-600 hover:text-gray-800"
                aria-label="Remove audio"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* ——— File Pickers ——— */}
        <div className="flex flex-wrap items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={imageInputRef}
            onChange={handleImageChange}
          />
          <input
            type="file"
            accept="video/*"
            className="hidden"
            ref={videoInputRef}
            onChange={handleVideoChange}
          />
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            ref={audioInputRef}
            onChange={handleAudioChange}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <PhotoIcon className="h-6 w-6" />
            <span className="text-sm">Image</span>
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <VideoCameraIcon className="h-6 w-6" />
            <span className="text-sm">Video</span>
          </button>
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <MicrophoneIcon className="h-6 w-6" />
            <span className="text-sm">Audio</span>
          </button>
        </div>

        {/* ——— Submit Button ——— */}
        <div>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (type === "DEEP"
                ? (!title.trim() || !text.trim())
                : (!text.trim() && !imageFile && !videoFile && !audioFile))
            }
            className={`inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              (type === "DEEP"
                ? title.trim() && text.trim()
                : text.trim() || imageFile || videoFile || audioFile)
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isSubmitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
