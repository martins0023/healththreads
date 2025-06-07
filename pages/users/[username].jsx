// pages/users/[username].jsx

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { format } from "date-fns";
import {
  CalendarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import prisma from "../../lib/prisma";
import { getUserFromToken } from "../../lib/auth";
import PostCard from "../../components/PostCard";
import { showToast } from "../../lib/toast";
import {
  CheckBadgeIcon,
  CameraIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";

export default function UserProfile({
  profileUser,
  isOwnProfile,
  threadPosts,
  deepPosts,
  stats,
}) {
  const router = useRouter();
  const { username } = router.query;

  // Local state for which tab is active: "feed" | "blogs" | "about"
  const [tab, setTab] = useState("feed");

  // If this is the logged‐in user's own profile, we allow editing the “About” fields.
  const [bio, setBio] = useState(profileUser.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profileUser.avatarUrl || "");
  const [coverPictureUrl, setCoverPictureUrl] = useState(
    profileUser.coverPictureUrl || ""
  );
  const [isPractitioner, setIsPractitioner] = useState(
    profileUser.isPractitioner
  );

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // File input refs (hidden)
  const avatarInputRef = useRef();
  const coverInputRef = useRef();

  //track follow state & count
  const [isFollowing, setIsFollowing] = useState(stats.isFollowing);
  const [followerCount, setFollowerCount] = useState(stats.followerCount);

  // 1) “Date Joined” formatted as “MMMM yyyy”
  const joinedDate = format(new Date(profileUser.createdAt), "LLLL yyyy");

  // 2) Upload helper to S3 (same pattern as in create-post)
  const uploadToS3 = async (file, mediaType) => {
    // mediaType: “image” for both avatar & cover
    const query = new URLSearchParams({ type: mediaType, filename: file.name });
    const presignRes = await fetch(`/api/media/presign?${query.toString()}`, {
      credentials: "include",
    });
    if (!presignRes.ok) {
      throw new Error("Failed to get presigned URL");
    }
    const { url: presignedUrl, publicUrl } = await presignRes.json();
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error("S3 upload failed:", uploadRes.status, text);
      throw new Error("Failed to upload to S3");
    }
    return publicUrl;
  };

  // 3) Handler when user picks a new avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadToS3(file, "image");
      setAvatarUrl(url);
      showToast("Avatar uploaded", "success");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      showToast("Failed to upload avatar", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 4) Handler when user picks a new cover photo
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadToS3(file, "image");
      setCoverPictureUrl(url);
      showToast("Cover photo uploaded", "success");
    } catch (err) {
      console.error("Error uploading cover:", err);
      showToast("Failed to upload cover photo", "error");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handler to save “About” changes (only runs if isOwnProfile === true)
  const handleSaveAbout = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/update-profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio,
          avatarUrl,
          coverPictureUrl,
          isPractitioner,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to save profile.");
      }
      showToast("Profile updated", "success");
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast(err.message || "Error updating profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {profileUser.name} (@{profileUser.username}) • HealthThreads
        </title>
      </Head>

      <div className="max-w-3xl mx-auto space-y-6 mb-10">
        {/* ─── Cover/Placeholder Section ───────────────────────────────────────────────────────────── */}
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

          {/* If this is your own profile, show a “+” overlay in the top‐right corner */}
          {isOwnProfile && (
            <button
              onClick={() => coverInputRef.current.click()}
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

          {/* Hidden file input for cover photo */}
          <input
            type="file"
            accept="image/*"
            ref={coverInputRef}
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* ─── Avatar, Name, Verified Badge, Username, Follow Button ─────────────────────────── */}
        <div className="relative -pt-10 flex items-end space-x-4 px-4">
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatarUrl || "/avatars/default-pic.jpg"}
              alt={profileUser.name}
              className="h-32 w-32 rounded-full border-4 border-white object-cover bg-gray-200"
            />
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-gray-100 focus:outline-none"
                title="Change avatar"
              >
                {isUploadingAvatar ? (
                  <CameraIcon className="h-4 w-4 text-gray-500 animate-pulse" />
                ) : (
                  <PlusIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          {/* Name + Verified + Username */}
          <div className="flex-1 pb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {profileUser.name}
              </h1>
              {profileUser.isPractitioner && (
                <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-500">@{profileUser.username}</p>
          </div>
          {/* If viewing someone else’s profile, show a “Follow” button */}
        </div>
        {!isOwnProfile && (
          <div className="flex justify-end items-center space-x-4 px-4">
            <span className="text-sm text-gray-600">
              {followerCount} follower{followerCount === 1 ? "" : "s"}
            </span>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/follow/${profileUser.id}`, {
                    method: "POST",
                    credentials: "include",
                  });
                  if (!res.ok)
                    throw new Error("Could not update follow status");
                  const { isFollowing: nowFollowing, followerCount: newCount } =
                    await res.json();
                  setIsFollowing(nowFollowing);
                  setFollowerCount(newCount);
                } catch (err) {
                  console.error(err);
                  showToast(err.message || "Error toggling follow", "error");
                }
              }}
              className={`px-4 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isFollowing
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        )}
        {/* ─── “Date Joined” Line ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-2 px-4 text-sm text-gray-600">
            <CalendarIcon className="h-5 w-5" />
            <span>Joined {joinedDate}</span>
          </div>
          <div className="flex items-center space-x-2 px-4 text-sm">
            <p className="text-sm text-gray-700">
              {profileUser.bio || "No biography provided."}
            </p>
          </div>
        </div>

        <div className="border-b border px-4 text-gray-800" />

        {/* ─── Statistics Row: Reputation | Published | Followers | Following ───────────────── */}
        <div className="flex flex-col -pt-5 mx-4 gap-3">
          <div className="flex items-center space-x-1 text-sm text-gray-700">
            <GlobeAltIcon className="h-5 w-5 text-gray-500" />
            <span>{stats.totalLikes} Reputation</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-700">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
            <span>{stats.totalPosts} Published </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-700">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <span>{stats.followerCount} Followers</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-700">
            <UserIcon className="h-5 w-5 text-gray-500" />
            <span>{stats.followingCount} Following</span>
          </div>
        </div>

        {/* ─── Tab Navigation: “Feed” | “Blogs” | “About” ───────────────────────────────────────────── */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`py-2 px-4 text-sm font-medium ${
              tab === "feed"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setTab("feed")}
          >
            Feed
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              tab === "blogs"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setTab("blogs")}
          >
            Blogs
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              tab === "about"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setTab("about")}
          >
            About
          </button>
        </div>

        {/* ─── Tab Content ─────────────────────────────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {tab === "feed" && (
            <div className="space-y-4">
              {threadPosts.length === 0 ? (
                <p className="text-gray-500">No threads yet.</p>
              ) : (
                threadPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}

          {tab === "blogs" && (
            <div className="space-y-4">
              {deepPosts.length === 0 ? (
                <p className="text-gray-500">No blogs yet.</p>
              ) : (
                deepPosts.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}

          {tab === "about" && (
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>

              {/* If this is your own profile, allow editing: */}
              {isOwnProfile ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileUser.name}
                      //   disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md  text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileUser.username}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileUser.email}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Biography
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://…"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="practitionerCheck"
                      type="checkbox"
                      checked={isPractitioner}
                      onChange={(e) => setIsPractitioner(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="practitionerCheck"
                      className="text-sm text-gray-700"
                    >
                      Verified health professional
                    </label>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSaveAbout}
                      disabled={isSaving}
                      className={`px-6 py-2 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isSaving
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </>
              ) : (
                /* Otherwise, read-only “About” info */
                <>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Email: </span>
                    {profileUser.email}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Bio: </span>
                    {profileUser.bio || "No bio provided."}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Verified Professional: </span>
                    {profileUser.isPractitioner ? "Yes" : "No"}
                  </p>
                  {profileUser.practitionerDocs && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Docs: </span>
                      <a
                        href={profileUser.practitionerDocs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        View
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Server‐side data fetching for /users/[username]:
 *   1) Find the “profileUser” by `username`.
 *   2) If not found, return 404.
 *   3) Determine if the current request’s cookie belongs to this same user (isOwnProfile).
 *   4) Fetch the latest 20 “THREAD” posts as threadPosts.
 *   5) Fetch the latest 20 “DEEP” posts as deepPosts.
 *   6) Compute stats: totalPosts, totalLikes, followerCount, followingCount.
 */
export async function getServerSideProps(context) {
  const username = context.params.username;

  // 1) Fetch the user record by username
  const profileUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      coverPictureUrl: true,
      isPractitioner: true,
      practitionerDocs: true,
      createdAt: true, // to compute “Joined <Month Year>”
      // updatedAt, passwordHash, etc. are not needed here
    },
  });

  if (!profileUser) {
    return {
      notFound: true,
    };
  }

  // 2) Check if the current cookie user is the same as this profile (isOwnProfile)
  let isOwnProfile = false;
  let viewerId = null;
  try {
    const viewer = await getUserFromToken(context.req);
    if (viewer) {
      viewerId = viewer.id;
      if (viewer.id === profileUser.id) {
        isOwnProfile = true;
      }
    }
  } catch (e) {
    // Not signed in or error → isOwnProfile remains false
  }

  let isFollowing = false;
  if (!isOwnProfile && viewerId) {
    const f = await prisma.follow.findUnique({
      where: {
        followerId_followedId: {
          followerId: viewerId,
          followedId: profileUser.id,
        },
      },
    });
    isFollowing = !!f;
  }

  // 3) Fetch up to 20 THREAD posts by this user, most‐recent first
  let threadPosts = await prisma.post.findMany({
    where: {
      authorId: profileUser.id,
      type: "THREAD",
    },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, username: true },
      },
      mediaAssets: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // 4) Fetch up to 20 DEEP posts by this user, most‐recent first
  let deepPosts = await prisma.post.findMany({
    where: {
      authorId: profileUser.id,
      type: "DEEP",
    },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, username: true },
      },
      mediaAssets: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (viewerId) {
    // Combine all post IDs into a single array
    const allPostIds = [
      ...threadPosts.map((p) => p.id),
      ...deepPosts.map((p) => p.id),
    ];

    // Query `like` table for any matches
    const likedRows = await prisma.like.findMany({
      where: {
        userId: viewerId,
        postId: { in: allPostIds },
      },
      select: { postId: true },
    });
    const likedSet = new Set(likedRows.map((l) => l.postId));

    // Annotate each threadPost
    threadPosts = threadPosts.map((p) => ({
      ...p,
      likedByCurrentUser: likedSet.has(p.id),
    }));
    // Annotate each deepPost
    deepPosts = deepPosts.map((p) => ({
      ...p,
      likedByCurrentUser: likedSet.has(p.id),
    }));
  } else {
    // If not logged in, default to `likedByCurrentUser: false`
    threadPosts = threadPosts.map((p) => ({ ...p, likedByCurrentUser: false }));
    deepPosts = deepPosts.map((p) => ({ ...p, likedByCurrentUser: false }));
  }
  // 5) Compute stats:
  //   • totalPosts = count of all posts by this user
  //   • totalLikes = sum of likeCount on their posts
  //   • followerCount = how many Follow rows where followedId = user.id
  //   • followingCount = how many Follow rows where followerId = user.id

  const totalPostsResult = await prisma.post.count({
    where: { authorId: profileUser.id },
  });
  const totalLikesResult = await prisma.post.aggregate({
    where: { authorId: profileUser.id },
    _sum: { likeCount: true },
  });
  const followerCount = await prisma.follow.count({
    where: { followedId: profileUser.id },
  });
  const followingCount = await prisma.follow.count({
    where: { followerId: profileUser.id },
  });

  const stats = {
    totalPosts: totalPostsResult,
    // If they have no posts, _sum.likeCount is null, so fallback to 0
    totalLikes: totalLikesResult._sum.likeCount ?? 0,
    followerCount,
    followingCount,
  };

  return {
    props: {
      profileUser: JSON.parse(JSON.stringify(profileUser)),
      isOwnProfile,
      threadPosts: JSON.parse(JSON.stringify(threadPosts)),
      deepPosts: JSON.parse(JSON.stringify(deepPosts)),
      stats: { ...stats, followerCount, isFollowing }
    },
  };
}
