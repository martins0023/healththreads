import React from "react";
import {
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function ProfileStats({ stats }) {
  return (
    <div className="flex flex-col -pt-5 mx-4 gap-3">
      <div className="flex items-center space-x-1 text-sm text-gray-700">
        <GlobeAltIcon className="h-5 w-5 text-gray-500" />
        <span>{stats.totalLikes} Reputation</span>
      </div>
      <div className="flex items-center space-x-1 text-sm text-gray-700">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
        <span>{stats.totalPosts} Published</span>
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
  )
}