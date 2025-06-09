// components/ChatWindow.jsx

import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import EmptyState from "./EmptyState";

export default function ChatWindow({ partner, viewerId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef();

  const channelName =
    partner && viewerId
      ? viewerId < partner.id
        ? `private-chat-${viewerId}-${partner.id}`
        : `private-chat-${partner.id}-${viewerId}`
      : null;

  // 1) load message history
  useEffect(() => {
    if (!partner) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/messages/${partner.id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load messages");
        const { messages: thread } = await res.json();
        setMessages(thread);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
        }, 100);
      }
    })();
  }, [partner]);

  // 2) subscribe to Pusher for real-time events
  useEffect(() => {
    if (!channelName) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
    });
    const channel = pusher.subscribe(channelName);

    channel.bind("new-message", (newMsg) => {
      // **ignore messages we ourselves just sent**
      if (newMsg.senderId === viewerId) return;
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }, 100);
    });

    channel.bind("messages-read", ({ from }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === from && m.recipientId === viewerId
            ? { ...m, isRead: true }
            : m
        )
      );
    });

    // typing indicator
    channel.bind("typing", ({ from }) => {
      if (from === partner.id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [channelName, partner?.id, viewerId]);

  // 3) mark unread messages as read
  useEffect(() => {
    if (!partner || messages.length === 0) return;
    const hasUnread = messages.some(
      (m) =>
        m.senderId === partner.id &&
        m.recipientId === viewerId &&
        !m.isRead
    );
    if (!hasUnread) return;

    const t = setTimeout(async () => {
      try {
        await fetch(`/api/messages/${partner.id}/read`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error(err);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [messages, partner, viewerId]);

  if (!partner) {
    return <EmptyState message="Select a conversation to start chatting." />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 ">
        <img
          src={partner.avatarUrl || "/avatars/default-pic.jpg"}
          alt={partner.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="ml-3">
          <p className="font-medium text-gray-900">{partner.name}</p>
        </div>
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="px-4 pb-1 text-gray-500 text-sm italic">
          {partner.name} is typing…
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 ">
        {loading ? (
          <div className="text-center text-gray-500">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet.</div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={m.senderId === viewerId}
            />
          ))
        )}
        <div className="h-2" />
      </div>

      {/* Input */}
      <MessageInput
        recipientId={partner.id}
        onMessageSent={(msg) => {
          // only our optimistic add here
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => {
            scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
          }, 100);
        }}
        viewerId={viewerId}
      />
    </div>
  );
}
