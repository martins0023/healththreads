// components/ConversationsList.jsx

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Loading from "./Loading"

export default function ConversationsList({ onSelectConversation, selectedUserId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/messages/conversations", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Could not fetch conversations");
        const { conversations } = await res.json();
        setConversations(conversations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <Loading message="Loading conversations…" />;
  }

  if (conversations.length === 0) {
    return <div className="text-center p-4 text-gray-500">No conversations yet.</div>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map(({ user, lastMessage }) => {
        const isUnread = lastMessage && !lastMessage.isRead && lastMessage.senderId !== selectedUserId;
        return (
          <button
            key={user.id}
            onClick={() => onSelectConversation(user)}
            className={`w-full text-left flex items-center px-4 py-3 hover:bg-gray-100 transition-colors ${
              selectedUserId === user.id ? "bg-gray-50" : ""
            }`}
          >
            <img
              src={user.avatarUrl || "/avatars/default-pic.jpg"}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{user.name}</p>
                {isUnread && (
                  <span className="h-2 w-2 bg-red-500 rounded-full ml-2" />
                )}
              </div>
              {lastMessage ? (
                <div className="text-gray-500 text-sm truncate">
                  {lastMessage.text
                    ? lastMessage.text.length > 30
                      ? lastMessage.text.slice(0, 30) + "…"
                      : lastMessage.text
                    : lastMessage.mediaType
                    ? `[${lastMessage.mediaType.toLowerCase()}]`
                    : ""}
                  <span className="ml-2 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No messages yet.</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
