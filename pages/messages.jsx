// pages/messages.jsx
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Loading from "../components/Loading";
import ConversationsList from "../components/ConversationsList";
import FollowListModal from "../components/FollowListModal";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

const ChatWindow = dynamic(() => import("../components/ChatWindow"), {
  ssr: false,
});

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const { user } = await res.json();
          setViewer(user);
        } else {
          router.push("/signin");
        }
      } catch {
        router.push("/signin");
      }
    })();
  }, [router]);

  if (!viewer) {
    return (
      <Loading message="Loading user…" />
    );
  }

  return (
    <>
      <Head>
        <title>Messages</title>
      </Head>
      <>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        {/* ─── DESKTOP: always show sidebar + chat ─────────────────────────────────── */}
        <div className="hidden md:flex md:flex-1">
          <div className="flex flex-col w-1/3 border-r border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Chats</h2>
            </div>
            <ConversationsList
              onSelectConversation={setSelectedUser}
              selectedUserId={selectedUser?.id}
            />
          </div>
          <div className="flex-1">
            <ChatWindow partner={selectedUser} viewerId={viewer.id} />
          </div>
        </div>

        {/* ─── MOBILE: if no user selected, show list; else full-screen chat ───────── */}
        <div className="md:hidden flex flex-1 flex-col">
          {!selectedUser ? (
            <>
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-xl font-semibold">Chats</h2>
              </div>
              <div className="flex-1 overflow-auto">
                <ConversationsList
                  onSelectConversation={setSelectedUser}
                  selectedUserId={selectedUser?.id}
                />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-10"
                aria-label="Start new chat"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </>
          ) : (
            <>
              {/* back button + partner info */}
              {/* <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-white">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 mr-3"
                  aria-label="Back to chats"
                >
                  <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                </button>
                <img
                  src={selectedUser.avatarUrl || "/avatars/default-pic.jpg"}
                  alt={selectedUser.name}
                  className="h-8 w-8 rounded-full object-cover mr-2"
                />
                <h2 className="font-medium text-gray-900">
                  {selectedUser.name}
                </h2>
              </div> */}
              <div className="flex-1">
                <ChatWindow partner={selectedUser} viewerId={viewer.id} />
              </div>
            </>
          )}
        </div>
      </div>
      </>

      <FollowListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(u) => setSelectedUser(u)}
        viewerId={viewer.id}
      />
    </>
  );
}
