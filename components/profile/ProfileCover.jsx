import { CameraIcon, PlusIcon } from "@heroicons/react/24/solid";
import React from "react";

export default function ProfileCover({
  coverPictureUrl,
  isOwnProfile,
  isUploadingCover,
  onCoverClick,
  onCoverChange,
}) {
  return (
    <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
      {coverPictureUrl ? (
        <img
          src={coverPictureUrl}
          alt="Cover Photo"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200" />
      )}

      {isOwnProfile && (
        <button
          onClick={onCoverClick}
          disabled={isUploadingCover}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100 focus:outline-none"
          title="Change cover photo"
        >
          {isUploadingCover ? (
            <CameraIcon className="h-5 w-5 text-gray-500 animate-pulse" />
          ) : (
            <PlusIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        ref={onCoverChange.ref}
        onChange={onCoverChange.handler}
        className="hidden"
      />
    </div>
  );
}