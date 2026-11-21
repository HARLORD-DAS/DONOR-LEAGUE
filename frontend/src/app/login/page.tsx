"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { BloodDrop3D, Hospital3D } from "@/components/Icons3D";

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
          email_or_phone: identifier,
          password: password,
        }),
      });

      await login(data);
      if (data.role === "donor") {
        router.push("/donor/dashboard");
      } else {
        router.push("/attendant/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-brand-border shadow-elevated">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
            Sign In to DONOR LEAGUE
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your Donor or Attendant coordination dashboard
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
              placeholder="e.g. arjun.donor@donorleague.org or 9876543210"
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
            className="w-full py-3 px-4 rounded-xl bg-brand-primary text-white font-semibold shadow-3d hover:bg-brand-secondary transition-all disabled:opacity-60 text-sm mt-2"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin("arjun.donor@donorleague.org", "DonorPass@123")}
              className="p-2.5 rounded-xl border border-blue-200 bg-brand-light/50 hover:bg-brand-light text-left transition-colors flex items-center gap-2"
            >
              <BloodDrop3D size={24} />
              <div>
                <div className="text-xs font-bold text-brand-navy">Demo Donor</div>
                <div className="text-[10px] text-slate-500">Arjun (O+)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("attendant@donorleague.org", "AttendantPass@123")}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-center gap-2"
            >
              <Hospital3D size={24} />
              <div>
                <div className="text-xs font-bold text-brand-navy">Demo Attendant</div>
                <div className="text-[10px] text-slate-500">Deepak Joshi</div>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account yet?{" "}
          <a href="/register/donor" className="text-brand-primary font-semibold hover:underline">
            Register as Donor
          </a>
          {" or "}
          <a href="/register/attendant" className="text-brand-primary font-semibold hover:underline">
            Attendant
          </a>
        </div>
      </div>
    </div>
  );
}
