// components/StoryBar.jsx

import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

/**
 * StoryBar
 *
 * Props:
 *  - memberGroups: array of { id, name, avatarUrl }
 *  - currentUser: the logged‐in user object
 *  - onViewStories: (groupId) => open the story viewer
 *  - onAddStory: (groupId) => open the uploader
 */
export default function StoryBar({
  memberGroups,
  currentUser,
  onViewStories,
  onAddStory,
}) {
  // Keep track of which groups have existing stories
  const [storiesByGroup, setStoriesByGroup] = useState({});
  // Keep a set of groupIds whose stories have been viewed
  const [viewedGroups, setViewedGroups] = useState(new Set());

  // 1) Fetch each group’s stories on mount (or when memberGroups changes)
  useEffect(() => {
    if (!memberGroups || memberGroups.length === 0) return;
    let isMounted = true;

    (async () => {
      try {
        const fetches = memberGroups.map((g) =>
          fetch(`/api/groups/${g.id}/stories`, {
            credentials: "include",
          })
            .then((res) => (res.ok ? res.json() : { stories: [] }))
            .catch(() => ({ stories: [] }))
        );
        const results = await Promise.all(fetches);

        if (!isMounted) return;
        const byGroup = {};
        results.forEach((r, idx) => {
          byGroup[memberGroups[idx].id] = r.stories || [];
        });
        setStoriesByGroup(byGroup);
      } catch (err) {
        console.error("Error loading group stories:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [memberGroups]);

  if (!memberGroups || memberGroups.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 px-2">
        {memberGroups.map((group) => {
          const hasStories =
            Array.isArray(storiesByGroup[group.id]) &&
            storiesByGroup[group.id].length > 0;
          const hasViewed = viewedGroups.has(group.id);

          // Determine border classes:
          //  • If hasStories && not viewed → indigo border
          //  • If hasStories && viewed     → gray border
          //  • If no stories               → dashed gray border
          const borderClass = hasStories
            ? hasViewed
              ? "border-gray-300"
              : "border-indigo-500"
            : "border-dashed border-gray-300";

          return (
            <div key={group.id} className="flex-shrink-0 text-center">
              <div
                className={`relative inline-flex items-center justify-center h-16 w-16 rounded-full border-2 ${borderClass} focus:outline-none`}
              >
                {/* Clicking the avatar bubble either views or adds a story */}
                <button
                  onClick={() => {
                    if (hasStories) {
                      // Mark as viewed
                      setViewedGroups((prev) => {
                        const clone = new Set(prev);
                        clone.add(group.id);
                        return clone;
                      });
                      onViewStories(group.id);
                    } else {
                      onAddStory(group.id);
                    }
                  }}
                  className="transition-colors duration-150 hover:border-indigo-500 h-full w-full rounded-full flex items-center justify-center overflow-hidden"
                >
                  {/* 1) Outer “frame” for avatar or placeholder */}
                  {hasStories ? (
                    <img
                      src={group.avatarUrl || "/avatars/default-pic.jpg"}
                      alt={group.name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <PlusIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </button>

                {/* 2) Always‐visible “+” badge in bottom‐right corner */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddStory(group.id);
                  }}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 focus:outline-none hover:bg-gray-100"
                  aria-label="Add another story"
                >
                  <PlusIcon className="h-4 w-4 text-indigo-600" />
                </button>
              </div>

              {/* 3) Group name below the avatar */}
              <p className="mt-1 w-16 text-xs text-gray-600 truncate">
                {group.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
