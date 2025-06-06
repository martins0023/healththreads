// components/GroupHeader.jsx

import React from "react";

export default function GroupHeader({ avatarUrl, name, description, memberCount }) {
  return (
    <div className="flex flex-col mb-6">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl || "/avatars/default-pic.jpg"}
          alt={name}
          className="h-16 w-16 rounded-full object-cover border border-gray-200"
        />
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
}
