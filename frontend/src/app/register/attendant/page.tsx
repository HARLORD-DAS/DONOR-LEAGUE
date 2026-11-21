"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AttendantBadge3D } from "@/components/Icons3D";

export default function AttendantRegistrationPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "pending") {
        router.push("/select-role");
      } else if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "attendant" && user.profile_completed) {
        router.push("/attendant/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Attender-specific fields (account credentials prefilled automatically)
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [termsConsent, setTermsConsent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!city.trim() || !state.trim()) {
      setError("Please provide your city and state.");
      return;
    }

    if (!termsConsent) {
      setError("Please accept the terms and privacy policy.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        city: city.trim(),
        state: state.trim(),
        terms_consent: termsConsent,
      };

      await apiRequest("/auth/complete-profile/attendant", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshUser();
      router.push("/attendant/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 font-medium text-sm">Loading attender registration...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <AttendantBadge3D size={52} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
              Complete Attender Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Finalize your requester details to issue blood requirements and coordinate with nearby matching donors.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Verified Account Information (Prefilled, No duplicate credentials) */}
          <div className="bg-brand-bg rounded-2xl p-5 border border-brand-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3">
              1. Verified Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Full Name</span>
                <span className="text-sm font-bold text-brand-navy">{user.full_name}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Mobile Number</span>
                <span className="text-sm font-bold text-brand-navy">{user.phone}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Email Address</span>
                <span className="text-sm font-bold text-brand-navy">{user.email}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200/60">
              Account credentials securely verified. You do not need to re-enter your password.
            </p>
          </div>

          {/* Attender Location Information */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3">
              2. Attender Location Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-primary rounded border-slate-300"
              />
              <span className="text-xs text-slate-600">
                I agree to the <a href="/terms" target="_blank" className="text-brand-primary underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-brand-primary underline">Privacy Policy</a>. I understand that blood matching is a communication tool and clinical crossmatching must occur at the hospital.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-primary text-white font-bold shadow-3d hover:bg-brand-secondary transition-all disabled:opacity-60 text-sm mt-4"
          >
            {loading ? "Completing Registration..." : "Complete Attender Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
