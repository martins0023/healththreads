import { CameraIcon, PlusIcon } from "@heroicons/react/24/solid";
import React from "react";

export default function ProfileAvatar({
  avatarUrl,
  profileUserName,
  isOwnProfile,
  isUploadingAvatar,
  onAvatarClick,
  onAvatarChange,
}) {
  return (
    <div className="relative">
      <img
        src={avatarUrl || "/avatars/default-pic.jpg"}
        alt={profileUserName}
        className="h-32 w-32 rounded-full border-4 border-white object-cover bg-gray-200"
      />
      {isOwnProfile && (
        <button
          onClick={onAvatarClick}
          disabled={isUploadingAvatar}
          className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-gray-100 focus:outline-none"
          title="Change avatar"
        >
          {isUploadingAvatar ? (
            <CameraIcon className="h-4 w-4 text-gray-500 animate-pulse" />
          ) : (
            <PlusIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
      )}
      <input
        type="file"
        accept="image/*"
        ref={onAvatarChange.ref}
        onChange={onAvatarChange.handler}
        className="hidden"
      />
    </div>
  );
}