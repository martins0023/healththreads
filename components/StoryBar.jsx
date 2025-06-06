// components/StoryBar.jsx

import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

// Each “bubble” shows either a group’s avatar (if it has stories), or “+” for upload.
export default function StoryBar({
  memberGroups,       // array of { id, name, avatarUrl }
  currentUser,        // the logged‐in user object
  onViewStories,      // callback(groupId) => open viewer
  onAddStory,         // callback(groupId) => open uploader
}) {
  const [storiesByGroup, setStoriesByGroup] = useState({}); // { groupId: [story,...] }

  // 1) Fetch stories for all memberGroups on mount
  useEffect(() => {
    if (!memberGroups || memberGroups.length === 0) return;
    let isMounted = true;

    (async () => {
      try {
        // We will fetch each group’s stories individually
        const fetches = memberGroups.map((g) =>
          fetch(`/api/groups/${g.id}/stories`, {
            credentials: "include",
          }).then((res) => (res.ok ? res.json() : { stories: [] }))
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

  if (!memberGroups || memberGroups.length === 0) return null;

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex space-x-4 px-2">
        {memberGroups.map((group) => {
          const hasStories =
            storiesByGroup[group.id] && storiesByGroup[group.id].length > 0;
          return (
            <div key={group.id} className="flex-shrink-0 text-center">
              <button
                onClick={() =>
                  hasStories
                    ? onViewStories(group.id)
                    : onAddStory(group.id)
                }
                className="relative inline-flex items-center justify-center h-16 w-16 rounded-full border-2 
                  focus:outline-none transition-colors duration-150 
                  hover:border-indigo-500
                  "
              >
                {hasStories ? (
                  <img
                    src={group.avatarUrl || "/avatars/default-pic.jpg"}
                    alt={group.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <PlusIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </button>
              <p className="mt-1 text-xs text-gray-600 truncate">
                {group.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
