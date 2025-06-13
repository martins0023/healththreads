// pages/signup.jsx

import { useState, useEffect } from "react";
import { useRouter } from "next/router"; // Next.js specific for Canvas environment
import Link from "next/link"; // Next.js specific for Canvas environment
import Lottie from "lottie-react"; // Not resolvable in Canvas environment
import {
  ArrowRight,
  Eye,
  EyeClosed,
  LucideArrowLeft,
  LucideArrowLeftCircle,
} from "lucide-react";
import onboardingAnimation from "../public/animations/Onboarding.json"; // Not resolvable in Canvas environment
import { showToast } from "../lib/toast"; // Not directly usable in Canvas without context

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
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6 p-6 sm:p-8 md:p-10 rounded-2xl border border-neutral-200">
        {/* Logo and Main Header */}
        <div className="">
          {/* Custom X-like Logo */}

          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
            {step === 1 ? (
              "Join HealthThreads"
            ) : (
              <>
                <LucideArrowLeft className="w-7 h-7 bg-gray-200 rounded-full p-1" />
                <div className="flex flex-col pt-2 ">Create Your Account</div>
              </>
            )}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 text-center">
            {step === 1 ? (
              "Connect, learn, and share your health journey."
            ) : (
              <>
                Already have an account?{" "}
                {/* Replaced Next.js Link with a standard anchor tag */}
                <a
                  href="/signin"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-4 text-center text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Onboarding with Social Options */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Placeholder for Lottie animation - using a simple image for Canvas environment */}
            <Lottie
              animationData={onboardingAnimation}
              loop
              className="h-56 mx-auto"
            />

            {/* Social Login Buttons */}
            <button
              type="button"
              className="w-full flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-full shadow-sm text-base font-semibold text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-200 transition"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google logo"
                className="h-5 w-5 mr-2"
              />
              Sign up with Google
            </button>
            <button
              type="button"
              className="w-full flex justify-center items-center py-2.5 px-4 border border-neutral-300 rounded-full shadow-sm text-base font-semibold text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-200 transition"
            >
              {/* Using inline SVG for Apple logo for simplicity and no external dependencies */}
              <img
                src="https://www.apple.com/favicon.ico"
                alt="Google logo"
                className="h-5 w-5 mr-2"
              />
              Sign up with Apple
            </button>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">Or</span>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-base font-semibold rounded-full shadow-sm text-white transition duration-150 ease-in-out bg-indigo-500 hover:bg-indigo-600 focus:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create account
            </button>
            <p className="mt-2 text-xs text-neutral-500 text-center">
              By signing up, you agree to the{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              , including{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Cookie Use
              </a>
              .
            </p>
          </div>
        )}

        {/* Step 2: Sign-Up Form */}
        {step === 2 && (
          <div className="space-y-6">
            <form className="space-y-6" onSubmit={handleSignup}>
              {/* Full Name */}
              <div className="relative">
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-400 transition duration-150 ease-in-out"
                  placeholder="Full Name"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-400 transition duration-150 ease-in-out"
                  placeholder="Email Address"
                />
              </div>

              {/* Username */}
              <div className="relative">
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-400 transition duration-150 ease-in-out"
                  placeholder="Username"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-400 transition duration-150 ease-in-out"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none"
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
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-blue-500 placeholder-neutral-400 transition duration-150 ease-in-out"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none"
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
                {loading ? "Creating account…" : "Register"}
              </button>
            </form>
            <p className="mt-2 text-xs text-neutral-500 text-center">
              By signing up, you agree to the{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              , including{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Cookie Use
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
