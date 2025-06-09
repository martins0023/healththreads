// components/FollowListModal.jsx

import { XMarkIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import Loading from "./Loading";
import { useEffect, useState } from "react";

export default function FollowListModal({
  isOpen,
  onClose,
  onSelect,
  viewerId,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/users/following", {
          credentials: "include",
        });
        if (res.ok && isActive) {
          const list = await res.json();
          setUsers(list);
        }
      } catch (err) {
        console.error("Failed to load following:", err);
      } finally {
        if (isActive) setLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Start a New Chat
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loading message="Loading…" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              You’re not following anyone yet.
            </div>
          ) : (
            <ul>
              {users.map((u) => (
                <li key={u.id} className="border-b last:border-none">
                  <button
                    onClick={() => {
                      onSelect(u);
                      onClose();
                    }}
                    className="w-full flex items-center px-6 py-4 hover:bg-gray-50 focus:outline-none"
                  >
                    <img
                      src={u.avatarUrl || "/avatars/default-pic.jpg"}
                      alt={u.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-4 flex-1 text-left">
                      <p className="text-gray-900 font-medium">{u.name}</p>
                      <p className="text-gray-500 text-sm">
                        @{u.username}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
