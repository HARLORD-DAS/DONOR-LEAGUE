"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email_or_phone: identifier.trim(),
          password: password,
        }),
      });

      const userProfile = await login(data);

      // Routing logic based on account status & role completion:
      // 1. Pending role -> Role Selection
      // 2. Donor role with incomplete profile -> Donor Registration
      // 3. Attender role with incomplete profile -> Attender Registration
      // 4. Donor role with completed profile -> Donor Dashboard
      // 5. Attender role with completed profile -> Attender Dashboard
      if (userProfile.role === "pending") {
        router.push("/select-role");
      } else if (userProfile.role === "donor") {
        if (userProfile.profile_completed) {
          router.push("/donor/dashboard");
        } else {
          router.push("/register/donor");
        }
      } else if (userProfile.role === "attendant") {
        if (userProfile.profile_completed) {
          router.push("/attendant/dashboard");
        } else {
          router.push("/register/attendant");
        }
      } else {
        router.push("/select-role");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email/phone and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-elevated">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Sign In to DONOR LEAGUE
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Enter your credentials to access your account and dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address or Mobile Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. rahul@example.com or 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-light text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary focus:ring-2 focus:ring-brand-light text-sm outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-primary text-white font-semibold shadow-3d hover:bg-brand-secondary transition-all disabled:opacity-60 text-sm mt-3"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an account yet?{" "}
          <Link href="/signup" className="text-brand-primary font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
