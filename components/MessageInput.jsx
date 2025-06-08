// components/MessageInput.jsx

import { useState, useRef, useEffect } from "react";
import {
  PaperClipIcon,
  MicrophoneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Pusher from "pusher-js";
import { showToast } from "../lib/toast";
import { Send } from "lucide-react";

// Initialize Pusher client (only once)
const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  authEndpoint: "/api/pusher/auth",
});

/**
 * Props:
 *   - recipientId: string  // the user we’re chatting with
 *   - onMessageSent: (msg) => void
 *   - viewerId: string     // our own user ID
 */
export default function MessageInput({ recipientId, onMessageSent, viewerId }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef();
  const channelRef = useRef();
  const typingTimer = useRef();

  // Build the channel name only once per recipient/viewer pair
  const channelName = recipientId
    ? viewerId < recipientId
      ? `private-chat-${viewerId}-${recipientId}`
      : `private-chat-${recipientId}-${viewerId}`
    : null;

  // Subscribe/unsubscribe to the Pusher channel
  useEffect(() => {
    if (!channelName) return;
    channelRef.current = pusherClient.subscribe(channelName);
    return () => {
      pusherClient.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName]);

  // Emit a client event: "client-typing"
  const emitTyping = () => {
    if (!channelRef.current) return;
    // client events must be prefixed with "client-"
    channelRef.current.trigger("client-typing", { from: viewerId });
  };

  // Handle text changes + debounce typing
  const handleTextChange = (e) => {
    setText(e.target.value);

    // clear any pending timer
    clearTimeout(typingTimer.current);
    emitTyping();

    // prevent sending too many events: wait 1.5s after last keystroke
    typingTimer.current = setTimeout(() => {
      // We'll let ChatWindow hide the "typing…" indicator after a timeout there
    }, 1500);
  };

  // Cleanup preview blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // … the rest of your existing file‐upload + recording + send logic …

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      return showToast("Media devices not supported", "error");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mr = new MediaRecorder(stream);
      setMediaRecorder(mr);
      setAudioChunks([]);
      mr.ondataavailable = (e) => {
        setAudioChunks((prev) => [...prev, e.data]);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setSelectedFile(blob);
        setPreviewUrl(url);
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      showToast("Cannot access microphone", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Upload to your updated `/api/media/presign` (which now accepts type=file)
  const uploadToS3 = async (file, mediaType, mimeType) => {
    const query = new URLSearchParams({
      type: mediaType,
      filename: file.name || `recording.${mimeType?.split("/")[1] || "webm"}`,
      mimeType,
    });
    const presignRes = await fetch(`/api/media/presign?${query.toString()}`, {
      credentials: "include",
    });
    if (!presignRes.ok) throw new Error("Could not get upload URL");
    const { url: presignedUrl, publicUrl } = await presignRes.json();

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType || "application/octet-stream" },
      body: file,
    });
    if (!uploadRes.ok) {
      const txt = await uploadRes.text();
      console.error("Upload failed:", uploadRes.status, txt);
      throw new Error("Upload failed");
    }
    return publicUrl;
  };

  // Send text or selectedFile
  const handleSend = async () => {
    if (!text.trim() && !selectedFile) return;
    setUploading(true);
    try {
      const payload = { text: text.trim() || null };
      if (selectedFile) {
        let mType = "FILE";
        const mimeType = selectedFile.type || "";
        if (mimeType.startsWith("image/")) mType = "IMAGE";
        else if (mimeType.startsWith("audio/")) mType = "AUDIO";
        else if (mimeType.startsWith("video/")) mType = "VIDEO";

        const url = await uploadToS3(
          selectedFile,
          mType.toLowerCase(),
          mimeType
        );
        payload.mediaUrl = url;
        payload.mediaType = mType;
      }

      const res = await fetch(`/api/messages/${recipientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const { message } = await res.json();
      onMessageSent(message);

      // reset
      setText("");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not send", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="border-t mb-10 border-gray-200 px-4 py-2 flex items-center space-x-2 ">
      <button
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        title="Attach file"
      >
        <PaperClipIcon className="h-5 w-5 text-gray-500" />
      </button>

      <button
        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
          isRecording ? "text-red-500" : "text-gray-500"
        }`}
        onClick={() => (isRecording ? stopRecording() : startRecording())}
        title={isRecording ? "Stop recording" : "Record audio"}
      >
        <MicrophoneIcon className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <textarea
          rows={1}
          value={text}
          onChange={handleTextChange}
          placeholder="Type a message"
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
        />

        {/* Preview (image/audio/video/file) if selected */}
        {previewUrl && (
          <div className="mt-2 relative">
            {selectedFile.type.startsWith("image/") && (
              <img
                src={previewUrl}
                alt="preview"
                className="h-24 w-24 object-cover rounded-lg"
              />
            )}
            {selectedFile.type.startsWith("audio/") && (
              <audio src={previewUrl} controls className="h-10 w-full" />
            )}
            {selectedFile.type.startsWith("video/") && (
              <video
                src={previewUrl}
                controls
                className="h-24 w-full rounded-lg"
              />
            )}
            {!selectedFile.type.startsWith("image/") &&
              !selectedFile.type.startsWith("audio/") &&
              !selectedFile.type.startsWith("video/") && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 text-sm">
                    {selectedFile.name}
                  </span>
                </div>
              )}
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-0 right-0 p-1 bg-black bg-opacity-50 rounded-full"
              aria-label="Remove"
            >
              <XCircleIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={(!text.trim() && !selectedFile) || uploading || isRecording}
        className={`p-2 rounded-full ${
          (text.trim() || selectedFile) && !uploading && !isRecording
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-300 cursor-not-allowed"
        } text-white`}
      >
        <Send />
      </button>

      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
