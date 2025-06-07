import React from "react";

export default function ProfileTabs({ tab, setTab }) {
  return (
    <div className="flex space-x-4 border-b border-gray-200">
      {['feed','blogs','about'].map((t) => (
        <button
          key={t}
          className={`py-2 px-4 text-sm font-medium $
            tab === t
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setTab(t)}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}