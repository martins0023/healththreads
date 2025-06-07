// components/ChatHeaderWithCall.jsx

import { PhoneIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

export default function ChatHeaderWithCall({ partner }) {
  const startCall = () => {
    // e.g., route to `/call?room=private-${viewer.id}-${partner.id}`
    // or invoke your WebRTC/Twilio logic here.
  };

  return (
    <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-white">
      <img
        src={partner.avatarUrl || "/avatars/default-pic.jpg"}
        alt={partner.name}
        className="h-10 w-10 rounded-full object-cover"
      />
      <div className="ml-3 flex-1">
        <p className="font-medium text-gray-900">{partner.name}</p>
      </div>
      <button
        onClick={startCall}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Audio call"
      >
        <PhoneIcon className="h-6 w-6 text-gray-500" />
      </button>
      <button
        onClick={startCall}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Video call"
      >
        <VideoCameraIcon className="h-6 w-6 text-gray-500" />
      </button>
    </div>
  );
}
