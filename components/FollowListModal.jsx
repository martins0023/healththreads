// components/FollowListModal.jsx
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function FollowListModal({
  isOpen,
  onClose,
  onSelect,
  viewerId,
}) {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const res = await fetch("/api/users/following", {
        credentials: "include",
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-80 max-h-[70vh] overflow-auto shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Start a new chat</h3>
          <button onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <ul>
          {users.length === 0 && (
            <li className="p-4 text-gray-500">
              You’re not following anyone yet.
            </li>
          )}
          {users.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => {
                  onSelect(u);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3"
              >
                <img
                  src={u.avatarUrl || "/avatars/default-pic.jpg"}
                  className="h-8 w-8 rounded-full object-cover"
                  alt={u.name}
                />
                <span>
                  {u.name} (@{u.username})
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
