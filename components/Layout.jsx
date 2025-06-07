// components/Layout.jsx
import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BellIcon,
  ChatBubbleBottomCenterIcon,
  HomeIcon,
  MapIcon,
  UserGroupIcon,
  PlusIcon, // ← we’ll use Heroicons’ Plus
} from "@heroicons/react/24/outline";
import SearchBox from "./SearchBox";

export default function Layout({ children }) {
  const router = useRouter();
  const currentPath = router.pathname;

  // State to hold the current user's data
  const [currentUser, setCurrentUser] = useState(null);

  // On mount, fetch /api/auth/me to see if the user is signed in
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const { user } = await res.json();
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
        setCurrentUser(null);
      }
    }
    fetchUser();
  }, []);

  // Basic array of nav items (icon + label + href)
  const navItems = [
    { name: "Home", href: "/", Icon: HomeIcon },
    { name: "Message", href: "/messages", Icon: ChatBubbleBottomCenterIcon },
    { name: "Map", href: "/map", Icon: MapIcon },
    { name: "Notifications", href: "/notifications", Icon: BellIcon },
    { name: "Communities", href: "/communities", Icon: UserGroupIcon },
  ];
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ---------- DESKTOP SIDEBAR (md and up) ---------- */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-indigo-600">
            HealthThread
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(({ name, href, Icon }) => {
            const isActive = currentPath === href;
            return (
              <Link
                key={name}
                href={href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <Icon
                  className={`flex-shrink-0 h-6 w-6 mr-3 ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <Link href="/profile" className="flex items-center space-x-3">
            {/*
              If `currentUser` is loaded and has `avatarUrl`, show it;
              otherwise show the generic UserCircleIcon placeholder.
            */}
            {currentUser && currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name || "Your Profile"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <img
                src="/avatars/default-pic.jpg"
                alt="default"
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800">Your Profile</p>
              <p className="text-xs text-gray-500 truncate">View settings</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ---------- MAIN CONTENT (push right on desktop) ---------- */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            {/* Left: Search / Tabs */}
            <div className="flex-1 flex items-center space-x-4">
              <div className="flex-1">
                <SearchBox />
              </div>

              {/* Tabs (unchanged) */}
              <div className="hidden sm:flex space-x-6">
                <button className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-1">
                  Latest
                </button>
                <button className="text-sm font-medium text-gray-600 hover:text-gray-800 pb-1">
                  Trending
                </button>
                <button className="text-sm font-medium text-gray-600 hover:text-gray-800 pb-1">
                  Just Watched
                </button>
              </div>
            </div>

            {/* Right: Post Button & Profile Icon */}
            <div className="flex items-center space-x-4">
              {!currentPath.startsWith("/communities/") && (
                <Link
                  href="/create-post"
                  className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Post
                </Link>
              )}

              <Link href="/profile" className="flex-shrink-0">
                {currentUser && currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name || "Profile"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <img
                    src="/avatars/default-pic.jpg"
                    alt="default"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}

          {/* ——— MOBILE “+” BUTTON (absolute, bottom-right) ——— */}
          {!currentPath.startsWith("/communities/") && (
            <button
              onClick={() => router.push("/create-post")}
              className="md:hidden fixed bottom-12 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg"
              aria-label="Create new post"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          )}
        </main>
      </div>

      {/* ---------- MOBILE BOTTOM NAV (shown on < md) ---------- */}
      <nav className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around">
          {navItems.map(({ name, href, Icon }) => {
            const isActive = currentPath === href;
            return (
              <Link
                key={name}
                href={href}
                className="w-full inline-flex flex-col items-center justify-center py-2"
              >
                <Icon
                  className={`h-6 w-6 ${
                    isActive ? "text-indigo-950" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs hidden md:inline ${
                    isActive ? "text-indigo-800" : "text-gray-500"
                  }`}
                >
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
