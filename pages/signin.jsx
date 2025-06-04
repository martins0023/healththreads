// pages/signin.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
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
      // Success: redirect to feed
      router.replace("/");
    } catch (err) {
      console.error("Signin error:", err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link href="/signup">
            <span className="font-medium text-indigo-600 hover:text-indigo-500">
              create an account
            </span>
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          {errorMsg && (
            <div className="mb-4 text-red-500 text-sm">{errorMsg}</div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email or Username */}
            <div>
              <label
                htmlFor="emailOrUsername"
                className="block text-sm font-medium text-gray-700"
              >
                Email or Username
              </label>
              <div className="mt-1">
                <input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="email"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
