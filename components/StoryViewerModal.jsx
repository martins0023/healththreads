// components/StoryViewerModal.jsx

import { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

/**
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - groupId: string|null
 *
 * When `isOpen && groupId` are set, fetch `/api/groups/{groupId}/stories`
 * (which returns { stories: [...] }). Each story has:
 *   { id, mediaUrl, mediaType: "IMAGE"|"VIDEO", user: { name, avatarUrl }, createdAt }
 *
 * Auto-advances through all stories, showing a blurred placeholder while loading.
 */
export default function StoryViewerModal({ isOpen, onClose, groupId }) {
  const [stories, setStories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  // 1) When `isOpen` or `groupId` changes, fetch the stories list
  useEffect(() => {
    if (!isOpen || !groupId) return;
    let isMounted = true;

    (async () => {
      setLoadingList(true);
      try {
        const res = await fetch(`/api/groups/${groupId}/stories`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load stories");
        const json = await res.json();
        if (isMounted) {
          setStories(json.stories || []);
          setCurrentIndex(0);
          setLoadingMedia(true);
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
        if (isMounted) {
          setStories([]);
        }
      } finally {
        if (isMounted) setLoadingList(false);
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(timerRef.current);
    };
  }, [isOpen, groupId]);

  // 2) When `currentIndex` or `loadingMedia` changes, set up auto-advance
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Pause any playing video when index changes
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    const current = stories[currentIndex];
    if (!current || loadingMedia) return;

    if (current.mediaType === "IMAGE") {
      // After 5 sec, advance
      timerRef.current = setTimeout(handleAdvance, 5000);
    } else {
      // For video: try to play, fallback to 5 sec if autoplay blocked
      const vid = videoRef.current;
      if (vid) {
        vid.play().catch(() => {
          timerRef.current = setTimeout(handleAdvance, 5000);
        });
      }
    }

    return () => {
      clearTimeout(timerRef.current);
      if (videoRef.current) videoRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loadingMedia, stories]);

  // Advance to next or close if at end
  function handleAdvance() {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setLoadingMedia(true);
    } else {
      onClose();
    }
  }

  if (!isOpen) return null;
  if (loadingList) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <p className="text-white">Loading stories…</p>
      </div>
    );
  }
  if (!stories.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white">No stories in this group.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const current = stories[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2 focus:outline-none"
        aria-label="Close"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {/* Progress bar strip */}
      <div className="absolute top-4 left-0 right-0 flex px-4 space-x-1">
        {stories.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded ${
              idx < currentIndex
                ? "bg-white opacity-90"
                : idx === currentIndex
                ? "bg-white opacity-60"
                : "bg-white bg-opacity-30"
            }`}
          />
        ))}
      </div>

      {/* Media container (centered) */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Blurred overlay while loadingMedia */}
        {loadingMedia && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="h-24 w-24 bg-white rounded-full animate-pulse opacity-50 blur-sm" />
          </div>
        )}

        {current.mediaType === "VIDEO" ? (
          <video
            ref={videoRef}
            src={current.mediaUrl}
            className={`max-h-full max-w-full object-contain ${
              loadingMedia ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300`}
            onLoadedData={() => setLoadingMedia(false)}
            onEnded={handleAdvance}
            muted
          />
        ) : (
          <img
            src={current.mediaUrl}
            alt="Story"
            className={`max-h-full max-w-full object-contain ${
              loadingMedia ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300`}
            onLoad={() => setLoadingMedia(false)}
          />
        )}
      </div>

      {/* Footer: poster info */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-3">
        <img
          src={current.user.avatarUrl || "/avatars/default-pic.jpg"}
          alt={current.user.name}
          className="h-10 w-10 rounded-full object-cover border-2 border-white"
        />
        <div>
          <p className="text-sm font-medium text-white">{current.user.name}</p>
          <p className="text-xs text-white opacity-75">
            {new Date(current.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
