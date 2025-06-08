// pages/signup.jsx

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Lottie from "lottie-react";
import { ArrowRight, Eye, EyeClosed } from "lucide-react";
import { EyeIcon, EyeOffIcon } from "@heroicons/react/24/outline";
import onboardingAnimation from "../public/animations/Onboarding.json"; // put your Lottie JSON here
import { showToast } from "../lib/toast";

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) If already logged in, redirect to feed
  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) router.replace("/");
    }
    checkSession();
  }, [router]);

  // 2) Submit sign-up
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      showToast("Passwords do not match", "error");
      return;
    }

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
      router.replace("/");
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-white flex flex-col justify-center px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          {step === 1 ? (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900">
                Join HealthThreads
              </h2>
              <p className="mt-2 text-gray-600">
                Connect, learn, and share your health journey.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-extrabold text-gray-900">
                Create Your Account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Step 1: Onboarding with Lottie */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <Lottie
              animationData={onboardingAnimation}
              loop
              className="h-56 mx-auto"
            />
            <p className="mt-4 text-gray-700">
              HealthThreads is a community for sharing tips, Q&A with verified
              practitioners, and staying up‐to‐date on the latest medical news.
            </p>
            <button
              onClick={() => setStep(2)}
              className="flex flex-row items-center justify-center gap-2 mt-6 w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Get Started
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Step 2: Sign‐Up Form */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {errorMsg && (
              <div className="mb-4 text-center text-red-600">
                {errorMsg}
              </div>
            )}
            <form className="space-y-5" onSubmit={handleSignup}>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Jane Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="you@example.com"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="janedoe"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute mt-5 inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeClosed className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute mt-5 inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <Eye className="h-5 w-5" />
                    ) : (
                      <EyeClosed className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 rounded-lg text-white font-semibold transition ${
                  loading
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                }`}
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
                {loading ? "Creating account…" : "Register"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
