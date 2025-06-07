// components/MessageBubble.jsx

import { format } from "date-fns";

export default function MessageBubble({ message, isOwn }) {
  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
    >
      <div
        className={`max-w-xs ${
          isOwn ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
        } rounded-lg px-3 py-2`}
      >
        {message.text && (
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        )}

        {message.mediaUrl && message.mediaType === "IMAGE" && (
          <img
            src={message.mediaUrl}
            alt="img"
            className="mt-2 rounded-lg max-h-48 object-contain"
          />
        )}
        {message.mediaUrl && message.mediaType === "AUDIO" && (
          <audio
            src={message.mediaUrl}
            controls
            className="mt-2 w-full"
          />
        )}
        {message.mediaUrl && message.mediaType === "VIDEO" && (
          <video
            src={message.mediaUrl}
            controls
            className="mt-2 rounded-lg max-h-48 object-contain w-full"
          />
        )}
        {message.mediaUrl && message.mediaType === "FILE" && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center mt-2 ${
              isOwn ? "text-indigo-100" : "text-indigo-600"
            } hover:underline`}
          >
            Download File
          </a>
        )}

        <div className="text-right text-[0.65rem] text-gray-400 mt-1">
          {format(new Date(message.createdAt), "p")}
        </div>
      </div>
    </div>
  );
}
