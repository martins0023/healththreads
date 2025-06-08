// components/LogoutButton.jsx

import { useRouter } from "next/router";
import { useState } from "react";

export default function LogoutButton({ children, className }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Logout failed');
      router.push('/signin');
    } catch (err) {
      console.error('Logout error:', err);
      // Optionally show a toast or error message here
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`
        ${className || ""}
        bg-red-500 hover:bg-red-600 focus:bg-red-700
        text-white font-semibold text-sm
        px-3 py-2 rounded-md shadow
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50
      `}
      aria-busy={loading}
    >
      {loading ? 'Logging out...' : children || 'Logout'}
    </button>
  );
}
