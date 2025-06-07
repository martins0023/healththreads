import React from "react";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

export default function ProfileHeader({
  name,
  username,
  isPractitioner,
  isOwnProfile,
  onFollowClick,
}) {
  return (
    <div className="relative -pt-10 flex items-end space-x-4 px-4">
      {/* Avatar handled by ProfileAvatar */}
      <div className="flex-1 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {isPractitioner && (
              <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">@{username}</p>
        </div>
        {!isOwnProfile && (
          <button
            onClick={onFollowClick}
            className="px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            Follow
          </button>
        )}
      </div>
    </div>
  );
}