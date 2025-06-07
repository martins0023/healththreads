// pages/messages.jsx
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import ConversationsList from "../components/ConversationsList";

const ChatWindow = dynamic(() => import("../components/ChatWindow"), {
  ssr: false,
});

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewer, setViewer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
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
      <Layout>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-gray-500">Loading user…</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Messages</title>
      </Head>
      <div className="flex flex-1 h-[calc(100vh-4rem)] bg-gray-50">
        {/* Conversations list */}
        <div className="hidden md:flex md:flex-col w-1/3 border-r border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold font-grotesk">Chats</h2>
          </div>
          <ConversationsList
            onSelectConversation={setSelectedUser}
            selectedUserId={selectedUser?.id}
          />
        </div>

        {/* Mobile header + list */}
        <div className="flex-1 flex flex-col">
          <div className="md:hidden border-b border-gray-200 px-4 py-3">
            <h2 className="text-xl font-semibold font-grotesk">Chats</h2>
          </div>
          <div className="md:hidden">
            <ConversationsList
              onSelectConversation={setSelectedUser}
              selectedUserId={selectedUser?.id}
            />
          </div>

          {/* Chat window */}
          <div className="flex-1">
            <ChatWindow partner={selectedUser} viewerId={viewer.id} />
          </div>
        </div>
      </div>
    </>
  );
}
