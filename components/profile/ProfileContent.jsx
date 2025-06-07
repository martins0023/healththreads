import React from "react";
import PostCard from "../PostCard";

export default function ProfileContent({
  tab,
  threadPosts,
  deepPosts,
  profileUser,
  bio,
  setBio,
  avatarUrl,
  setAvatarUrl,
  coverPictureUrl,
  setCoverPictureUrl,
  isPractitioner,
  setIsPractitioner,
  isOwnProfile,
  isSaving,
  handleSaveAbout,
}) {
  switch(tab) {
    case 'feed':
      return (
        <div className="space-y-4">
          {threadPosts.length === 0 ? (
            <p className="text-gray-500">No threads yet.</p>
          ) : (
            threadPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      );
    case 'blogs':
      return (
        <div className="space-y-4">
          {deepPosts.length === 0 ? (
            <p className="text-gray-500">No blogs yet.</p>
          ) : (
            deepPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      );
    case 'about':
      return (
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
      );
    default:
      return null;
  }
}