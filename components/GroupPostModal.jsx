// components/GroupPostModal.jsx

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import GroupPostForm from "./GroupPostForm";

/**
 * A modal wrapper around GroupPostForm.
 *
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 *   - groupId: string
 *   - onPostCreated: (newPost) => void
 */
export default function GroupPostModal({
  isOpen,
  onClose,
  groupId,
  onPostCreated,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Create a New Post
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          <GroupPostForm
            groupId={groupId}
            onPostCreated={(newPost) => {
              onPostCreated(newPost);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
