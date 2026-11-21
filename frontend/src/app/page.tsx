"use client";

import React from "react";
import Link from "next/link";
import { BloodDrop3D, Hospital3D } from "@/components/Icons3D";

export default function HomeLandingPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-12">
      {/* App Name as Plain Text (No Logo/Emblem) */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy tracking-tight">
          DONOR LEAGUE
        </h1>
      </div>

      {/* Two Clean 3D Cards: Donor & Attender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
        {/* Card 1: Donor */}
        <div className="bg-white rounded-[36px] p-8 sm:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(21,94,239,0.09)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(21,94,239,0.16)]">
          {/* Circular Badge with 3D Blood Drop Icon (No character) */}
          <div className="w-32 h-32 rounded-full bg-blue-50/80 border-4 border-white shadow-[0_8px_24px_rgba(21,94,239,0.1)] flex items-center justify-center mb-6">
            <BloodDrop3D size={68} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy mb-6">
            Donor
          </h2>

          <Link
            href="/register/donor"
            className="w-full max-w-[200px] py-3.5 px-6 rounded-full bg-brand-primary text-white font-bold text-sm shadow-[0_8px_20px_rgba(21,94,239,0.35)] hover:bg-brand-secondary transition-all flex items-center justify-center gap-2 group"
          >
            <span>Continue</span>
            <span className="text-base transition-transform group-hover:translate-x-1">›</span>
          </Link>
        </div>

        {/* Card 2: Attender */}
        <div className="bg-white rounded-[36px] p-8 sm:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(21,94,239,0.09)] flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(21,94,239,0.16)]">
          {/* Circular Badge with 3D Hospital Icon (No character) */}
          <div className="w-32 h-32 rounded-full bg-blue-50/80 border-4 border-white shadow-[0_8px_24px_rgba(21,94,239,0.1)] flex items-center justify-center mb-6">
            <Hospital3D size={68} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy mb-6">
            Attender
          </h2>

          <Link
            href="/register/attendant"
            className="w-full max-w-[200px] py-3.5 px-6 rounded-full bg-brand-primary text-white font-bold text-sm shadow-[0_8px_20px_rgba(21,94,239,0.35)] hover:bg-brand-secondary transition-all flex items-center justify-center gap-2 group"
          >
            <span>Continue</span>
            <span className="text-base transition-transform group-hover:translate-x-1">›</span>
          </Link>
        </div>
      </div>

      {/* Bottom Sign In Link & Info Chips */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <Link
          href="/login"
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-primary transition-colors"
        >
          Already have an account? <span className="text-brand-primary underline">Sign In</span>
        </Link>

        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 pt-2">
          <span className="flex items-center gap-1.5">
            <span className="text-brand-primary">✓</span> Safe & Secure
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-brand-primary">📍</span> Location Based
          </span>
        </div>
      </div>
    </div>
  );
}
