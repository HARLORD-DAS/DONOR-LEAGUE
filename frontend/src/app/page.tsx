"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BloodDrop3D, Hospital3D, Compass3D } from "@/components/Icons3D";

export default function HomeLandingPage() {
  const { user, loading, getPostAuthRedirect } = useAuth();

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-12">
      {/* App Header (Plain Text Branding) */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-black text-brand-navy tracking-tight uppercase">
          DONOR LEAGUE
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-3 font-medium leading-relaxed">
          Location-Based Emergency Blood Donor Identification &amp; Real-Time Coordination Platform
        </p>
      </div>

      {/* If User is already signed in, provide a direct shortcut */}
      {user && !loading ? (
        <div className="w-full max-w-xl bg-white rounded-3xl p-8 border border-brand-border shadow-elevated text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand-primary text-xs font-bold uppercase tracking-wider mb-3">
            Active Session
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">
            Welcome back, {user.full_name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
            Account Status: <b className="uppercase text-brand-navy">{user.role}</b>
            {user.identifier ? ` • ${user.identifier}` : ""}
          </p>

          <Link
            href={getPostAuthRedirect()}
            className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full bg-brand-primary text-white font-bold text-sm shadow-[0_8px_20px_rgba(21,94,239,0.35)] hover:bg-brand-secondary transition-all"
          >
            <span>
              {user.role === "pending"
                ? "Continue to Role Selection"
                : user.profile_completed
                  ? "Open Your Dashboard"
                  : "Complete Your Registration"}
            </span>
            <span>›</span>
          </Link>
        </div>
      ) : (
        /* Two Clear Authentication Options: Sign Up & Sign In */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
          {/* Option 1: Sign Up */}
          <div className="bg-white rounded-[36px] p-8 sm:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(21,94,239,0.09)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(21,94,239,0.16)]">
            <div className="w-24 h-24 rounded-full bg-blue-50/80 border-4 border-white shadow-[0_8px_24px_rgba(21,94,239,0.1)] flex items-center justify-center mb-6">
              <BloodDrop3D size={52} />
            </div>

            <h2 className="text-2xl font-bold text-brand-navy mb-2">
              Sign Up
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
              New to Donor League? Create an account to choose your role and start saving lives or finding donors.
            </p>

            <Link
              href="/signup"
              className="w-full max-w-[200px] py-3.5 px-6 rounded-full bg-brand-primary text-white font-bold text-sm shadow-[0_8px_20px_rgba(21,94,239,0.35)] hover:bg-brand-secondary transition-all flex items-center justify-center gap-2 group mt-auto"
            >
              <span>Create Account</span>
              <span className="text-base transition-transform group-hover:translate-x-1">›</span>
            </Link>
          </div>

          {/* Option 2: Sign In */}
          <div className="bg-white rounded-[36px] p-8 sm:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(21,94,239,0.09)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(21,94,239,0.16)]">
            <div className="w-24 h-24 rounded-full bg-blue-50/80 border-4 border-white shadow-[0_8px_24px_rgba(21,94,239,0.1)] flex items-center justify-center mb-6">
              <Hospital3D size={52} />
            </div>

            <h2 className="text-2xl font-bold text-brand-navy mb-2">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
              Already have an account? Sign in to jump straight to your verified Donor or Attender dashboard.
            </p>

            <Link
              href="/login"
              className="w-full max-w-[200px] py-3.5 px-6 rounded-full bg-white text-brand-navy border-2 border-brand-border font-bold text-sm hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2 group mt-auto"
            >
              <span>Sign In</span>
              <span className="text-base transition-transform group-hover:translate-x-1">›</span>
            </Link>
          </div>
        </div>
      )}

      {/* Feature & Security Trust Badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 pt-4">
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-600 font-bold">✓</span> Safe &amp; Secure Authentication
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-brand-primary">📍</span> OpenStreetMap Proximity Matching
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-red-500">⚡</span> Real-Time Emergency Coordination
        </span>
      </div>
    </div>
  );
}
