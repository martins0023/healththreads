// pages/signup.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) If already logged in, redirect to feed
  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        router.replace("/");
      }
    }
    checkSession();
  }, [router]);

  // 2) Submit form
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, username, password }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to sign up");
      }
      // On success, server set cookie; redirect
      router.replace("/");
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Title changes depending on step */}
        {step === 1 ? (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Join HealthThreads
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Connect with experts, share your health journey.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create an account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/signin">
                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </span>
              </Link>
            </p>
          </>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {step === 1 ? (
          // ─── STEP 1: Onboarding Info ───────────────────────────────────────────
          <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 text-center">
            <p className="text-gray-700">
              HealthThreads is a community for sharing tips, Q&A with verified practitioners,
              and staying up‐to‐date on the latest in medical news. Ready to get started?
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Get Started
            </button>
          </div>
        ) : (
          // ─── STEP 2: Sign‐Up Form ────────────────────────────────────────────────
          <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
            {errorMsg && (
              <div className="mb-4 text-red-500 text-sm">{errorMsg}</div>
            )}
            <form className="space-y-6" onSubmit={handleSignup}>
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
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
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {loading ? "Creating account…" : "Register"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
