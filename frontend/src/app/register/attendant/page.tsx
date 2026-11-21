"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AttendantBadge3D } from "@/components/Icons3D";

export default function AttendantRegistrationPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [termsConsent, setTermsConsent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!termsConsent) {
      setError("Please accept the terms and privacy policy.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: fullName,
        mobile_number: mobileNumber,
        email,
        password,
        confirm_password: confirmPassword,
        city,
        state,
        terms_consent: termsConsent,
      };

      const res = await apiRequest("/auth/register/attendant", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await login(res);
      router.push("/attendant/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <AttendantBadge3D size={52} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
              Attendant Registration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create an account to submit blood requirements and connect with nearby donors.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Deepak Joshi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91 98111 22233"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deepak@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
              />
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
            {loading ? "Creating Account..." : "Register as Attendant"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{" "}
          <a href="/login" className="text-brand-primary font-semibold hover:underline">
            Sign In here
          </a>
        </div>
      </div>
    </div>
  );
}
