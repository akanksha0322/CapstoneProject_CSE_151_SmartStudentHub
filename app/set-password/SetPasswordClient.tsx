"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState , Suspense  } from "react";
export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing activation link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/auth/set-password`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      token,
      new_password: password,
    }),
  }
);



      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to set password.");
      }

      setSuccess("Your account has been activated successfully.");

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }   
  };

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Set Your Password
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Complete your account activation to access your student profile.
        </p>

        {!token && (
          <p className="text-red-600 text-sm">
            Invalid or expired activation link.
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm mb-4">{success}</p>
        )}

        {token && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <p className="text-xs text-slate-500">
              Password must be at least 8 characters long.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Setting Password..." : "Set Password & Activate"}
            </button>
          </form>
        )}

        <p className="text-xs text-slate-500 mt-6 text-center">
          This activation link is valid for a limited time and can be used only once.
        </p>
      </div>
      </div>

  );
}
