// components/StoryViewerModal.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { createPortal } from "react-dom";
import Loading from "./Loading"; // Assuming this component exists and handles its own styling

/**
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - groupId: string|null
 *
 * Fetches and displays stories for a group. Allows swiping between stories.
 * The 'X' close button click defers actual closing until all content finishes.
 */
export default function StoryViewerModal({ isOpen, onClose, groupId }) {
  const [stories, setStories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // For swipe gestures
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const SWIPE_THRESHOLD = 50; // Min distance (px) for a swipe to be registered

  // Effect to track component mount status for createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to manage body overflow when modal is open/closed
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = ""; // Cleanup on unmount
    };
  }, [isOpen]);

  // Effect to fetch stories when modal opens or groupId changes
  useEffect(() => {
    if (!isOpen || !groupId) {
      // Reset state if modal is closed or no groupId
      setStories([]);
      setCurrentIndex(0);
      setLoadingList(true); // Prepare for next potential opening
      return;
    }

    let isComponentMounted = true;
    (async () => {
      setLoadingList(true);
      setLoadingMedia(true); // Assume media will need to load for the first story
      try {
        const res = await fetch(`/api/groups/${groupId}/stories`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to load stories: ${res.statusText}`);
        const json = await res.json();
        if (isComponentMounted) {
          setStories(json.stories || []);
          setCurrentIndex(0); // Start from the first story
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
        if (isComponentMounted) {
          setStories([]); // Clear stories on error
        }
      } finally {
        if (isComponentMounted) {
          setLoadingList(false);
        }
      }
    })();

    return () => {
      isComponentMounted = false;
      clearTimeout(timerRef.current); // Clear timer on cleanup
    };
  }, [isOpen, groupId]);

  // Function to advance to the next story or close if at the end
  const handleAdvance = useCallback(() => {
    clearTimeout(timerRef.current);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setLoadingMedia(true);
    } else {
      onClose(); // All stories viewed, trigger modal close
    }
  }, [currentIndex, stories, onClose]);

  // Effect to manage auto-advance timer and video playback
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause(); // Pause any previous video
    }

    const currentStory = stories[currentIndex];
    if (!currentStory || loadingMedia) {
      if (videoRef.current) videoRef.current.currentTime = 0; // Reset video if new media is loading
      return; // Wait for media to load
    }

    if (currentStory.mediaType === "IMAGE") {
      timerRef.current = setTimeout(handleAdvance, 5000); // 5 seconds for images
    } else if (currentStory.mediaType === "VIDEO") {
      const vid = videoRef.current;
      if (vid) {
        vid.currentTime = 0; // Ensure video starts from the beginning
        vid.play().catch((error) => {
          console.warn("Video autoplay failed or was interrupted:", error);
          timerRef.current = setTimeout(handleAdvance, 5000); // Fallback timer
        });
      }
    }

    return () => { // Cleanup for this specific story
      clearTimeout(timerRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [currentIndex, loadingMedia, stories, handleAdvance]);

  // Swipe navigation: Go to Previous Story
  const goToPreviousStory = () => {
    if (stories.length > 1 && currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setLoadingMedia(true);
    }
  };

  // Swipe navigation: Go to Next Story
  const goToNextStory = () => {
    if (stories.length > 1 && currentIndex < stories.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setLoadingMedia(true);
    }
  };

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e) => {
    if (stories.length <= 1) return; // No swiping if only one or no story
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || stories.length <= 1) {
      return;
    }
    // Prevent vertical page scroll if horizontal swipe is intended
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || stories.length <= 1) {
      touchStartXRef.current = null; // Reset refs
      touchStartYRef.current = null;
      return;
    }

    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Check for significant horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) { // Swipe Right (Previous)
        goToPreviousStory();
      } else { // Swipe Left (Next)
        goToNextStory();
      }
    }
    touchStartXRef.current = null; // Reset refs
    touchStartYRef.current = null;
  };

  // Render nothing if modal is not open or component not yet mounted (for portal)
  if (!isOpen) return null;
  if (!mounted) return null;

  const portalTarget = document.body; // Target for createPortal

  // Display loading state for the story list
  if (loadingList) {
    return <Loading message="Loading stories…" />;
  }

  // Display message if no stories are available
  if (!stories.length) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-90">
        <div className="text-center p-4">
          <p className="text-white text-lg mb-4">No stories in this group.</p>
          <button
            onClick={onClose} // This close button works immediately
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            Close
          </button>
        </div>
      </div>,
      portalTarget
    );
  }

  const currentStory = stories[currentIndex];

  // Main story viewer UI
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none touch-pan-y" // touch-pan-y to allow vertical scroll if not captured by swipe
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button (Top Right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white cursor-pointer bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full p-2 focus:outline-none z-20" // z-20 to be above progress
        aria-label="Close stories"
      >
        <XMarkIcon className="h-6 w-6 text-white" />
      </button>

      {/* Progress bar strip (Top) */}
      <div className="absolute top-4 left-0 right-0 flex px-4 space-x-1 z-10">
        {stories.map((_, idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded ${ // Using original styling for progress segments
              idx < currentIndex
                ? "bg-white opacity-90"  // Viewed stories
                : idx === currentIndex
                ? "bg-white opacity-60"  // Current story (can be animated for actual progress)
                : "bg-white bg-opacity-30"  // Upcoming stories
            }`}
          />
        ))}
      </div>

      {/* Media container (Centered) */}
      {/* Adjusted padding: pt-12 (for top bar) and pb-20 (for footer info) */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden pt-12 pb-20">
        {loadingMedia && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="h-24 w-24 bg-white rounded-full animate-pulse opacity-50 blur-sm" />
          </div>
        )}

        {currentStory.mediaType === "VIDEO" ? (
          <video
            ref={videoRef}
            key={currentStory.id || currentIndex} // Ensures React re-creates element on story change
            src={currentStory.mediaUrl}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
              loadingMedia ? "opacity-0" : "opacity-100"
            }`}
            onLoadedData={() => setLoadingMedia(false)}
            onEnded={handleAdvance}
            onError={(e) => {
              console.error("Error loading video:", currentStory.mediaUrl, e);
              setLoadingMedia(false); // Stop loading indicator
              timerRef.current = setTimeout(handleAdvance, 500); // Advance quickly
            }}
            playsInline // Important for playback on mobile browsers
            autoPlay // Attempt to autoplay
            muted // Autoplay often requires video to be muted
          />
        ) : (
          <img
            key={currentStory.id || currentIndex} // Ensures React re-creates element on story change
            src={currentStory.mediaUrl}
            alt={`Story by ${currentStory.user.name}`}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
              loadingMedia ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setLoadingMedia(false)}
            onError={(e) => {
              console.error("Error loading image:", currentStory.mediaUrl, e);
              setLoadingMedia(false); // Stop loading indicator
              timerRef.current = setTimeout(handleAdvance, 500); // Advance quickly
            }}
          />
        )}
      </div>

      {/* Footer: Poster information (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10">
        <div className="flex items-center space-x-3">
          <img
            src={currentStory.user.avatarUrl || "/avatars/default-pic.jpg"} // Fallback avatar
            alt={currentStory.user.name}
            className="h-10 w-10 rounded-full object-cover border-2 border-white/80"
          />
          <div>
            <p className="text-sm font-semibold text-white shadow-sm">{currentStory.user.name}</p>
            <p className="text-xs text-white opacity-80 shadow-sm">
              {new Date(currentStory.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}