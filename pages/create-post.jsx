// pages/create-post.jsx
import {
  MicrophoneIcon,
  PhotoIcon,
  VideoCameraIcon,
  XCircleIcon,
  XIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useSWRConfig } from "swr";

export default function CreatePost() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // 1. Redirect to /signin if not authenticated
  useEffect(() => {
      async function checkAuth() {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/signin");
        }
      }
      checkAuth();
    }, [router]);

  // Text content
  const [text, setText] = useState("");

  // Selected files
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  // Preview URLs
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  // Refs for the <input type="file" />
  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const audioInputRef = useRef();

  // Submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers when a file is picked
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

  // Remove preview + reset file
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

  // Upload helper to S3 using a presigned URL
  const uploadToS3 = async (file, type) => {
    // 1. Get presigned URL (include credentials so the cookie is sent)
    const query = new URLSearchParams({ type, filename: file.name });
    const presignRes = await fetch(`/api/media/presign?${query.toString()}`, {
      credentials: "include", // ← ensures your auth cookie is sent
    });
    if (!presignRes.ok) {
      throw new Error("Failed to get presigned URL");
    }
    const { url: presignedUrl, publicUrl } = await presignRes.json();

    // 2. Upload file to S3 via PUT
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
                "Content-Type": file.type, //"x-amz-acl": "public-read", 
              },
      body: file,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error("S3 upload failed; status:", uploadRes.status, "body:", text);
      throw new Error("Failed to upload file to S3");
    }

    // 3. Return the public URL so the backend can store it
    return publicUrl;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Upload any media and get back public URLs
      let imageUrl = null,
        videoUrl = null,
        audioUrl = null;

      if (imageFile) {
        imageUrl = await uploadToS3(imageFile, "image");
      }
      if (videoFile) {
        videoUrl = await uploadToS3(videoFile, "video");
      }
      if (audioFile) {
        audioUrl = await uploadToS3(audioFile, "audio");
      }

      // 2. Create the post in your database
      const postPayload = {
        text: text || "",
        imageUrl,
        videoUrl,
        audioUrl,
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

      // 3. Optimistically prepend to the feed (key = "/api/feed?page=0&limit=10")
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

      // 4. Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("There was an error creating your post. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Create a New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Textarea */}
        <div>
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
          <p className="mt-1 text-right text-xs text-gray-500">{text.length} / 280</p>
        </div>

        {/* PREVIEWS */}
        <div className="space-y-4">
          {/* Image Preview */}
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

          {/* Video Preview */}
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
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Audio Preview */}
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

        {/* FILE PICKERS */}
        <div className="flex flex-wrap items-center space-x-4">
          {/* Hidden file inputs */}
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

          {/* Buttons to trigger file pickers */}
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

        {/* SUBMIT BUTTON */}
        <div>
          <button
            type="submit"
            disabled={
              isSubmitting || (!text && !imageFile && !videoFile && !audioFile)
            }
            className={`inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              text || imageFile || videoFile || audioFile
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
