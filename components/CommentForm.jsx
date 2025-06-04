// components/CommentForm.jsx

import { useState } from "react";
import { showToast } from "../lib/toast";

export default function CommentForm({ postId, parentId = null, onSuccess }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentId }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Failed to post comment.");
      }
      setText("");
      showToast("Comment posted", "success");
      if (onSuccess) onSuccess();    // ← call parent’s callback (fetchComments)
    } catch (err) {
      console.error("Post comment error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment…"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className={`px-4 py-1 text-sm font-medium text-white rounded-md focus:outline-none ${
            loading || !text.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
