// pages/signin.jsx

import { useState, useEffect } from "react";
// Removed: import { useRouter } from "next/router"; // Next.js specific
// Removed: import Link from "next/link"; // Next.js specific
import { Apple, AppleIcon, Eye, EyeClosed } from "lucide-react"; // Assuming lucide-react is installed for icons
import { useRouter } from "next/router";

export default function SignIn() {
  // const router = useRouter(); // Removed: Next.js specific
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) On mount, check if already logged in
  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        router.replace("/"); // already signed in
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailOrUsername, password }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Sign in failed");
      }
      router.replace("/");
    } catch (err) {
      console.error("Signin error:", err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mb-10 bg-neutral-50 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 p-6 sm:p-8 md:p-10 rounded-2xl border border-neutral-200">
        <div className="flex flex-col items-center">
          {/* Custom X-like Logo */}
          
            <h1 className="text-xl hidden md:outline font-semibold text-indigo-600">
            HealthThread
          </h1>

          <h2 className="mt-2 text-gray-900 font-extrabold">
            Sign in to <span className="text-xl sm:text-2xl">HealthThreads</span>
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            New to HealthThreads?{" "}
            {/* Replaced Next.js Link with a standard anchor tag */}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
              Create an account
            </a>
          </p>
        </div>

        <div className="space-y-6">
          {errorMsg && (
            <div className="mb-4 text-center text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Social Login Buttons (Placeholder for future integration) */}
          <button
            type="button"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-full shadow-sm text-base font-semibold text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-200 transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google logo" className="h-5 w-5 mr-2" />
            Sign in with Google
          </button>
          <button
            type="button"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-full shadow-sm text-base font-semibold text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-200 transition"
          >
            {/* Using inline SVG for Apple logo for simplicity and no external dependencies */}
            <img src="https://www.apple.com/favicon.ico" alt="Google logo" className="h-5 w-5 mr-2" />
            Sign in with Apple
          </button>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">Or</span>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email or Username */}
            <div className="relative">
              <label htmlFor="emailOrUsername" className="sr-only text-xs">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                autoComplete="username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className={`block w-full px-4 py-3 border ${
                  errorMsg ? "border-red-400" : "border-neutral-300"
                } rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-neutral-400 transition duration-150 ease-in-out`}
                placeholder="Email or Username"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`block w-full px-4 py-3 border ${
                  errorMsg ? "border-red-400" : "border-neutral-300"
                } rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-neutral-400 transition duration-150 ease-in-out`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeClosed className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-base font-semibold rounded-full shadow-sm text-white transition duration-150 ease-in-out ${
                  loading
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 focus:bg-indigo-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {loading && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </div>
          </form>
          <div>
            <p className="text-xs text-center text-gray-700">By signing in, you agree to the <span className="text-blue-600">Terms of Service {` `}</span>  and <span className="text-blue-600">Privacy Policy{` `}</span>, including <span className="text-blue-600">Cookie Use</span>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
