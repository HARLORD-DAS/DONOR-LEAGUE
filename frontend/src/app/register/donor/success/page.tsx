"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Success3D, BloodDrop3D } from "@/components/Icons3D";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const donorId = searchParams.get("id") || "DL-D-2026-CONFIRMED";
  const name = searchParams.get("name") || "Registered Donor";
  const bloodGroup = searchParams.get("blood") || "O+";
  const city = searchParams.get("city") || "Registered City";
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-elevated text-center">
        {/* Premium 3D Success Illustration */}
        <div className="flex justify-center mb-6">
          <Success3D size={84} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight uppercase">
          YOU HAVE SUCCESSFULLY REGISTERED AS A BLOOD DONOR!
        </h1>

        <p className="text-sm sm:text-base text-slate-600 mt-4 max-w-lg mx-auto leading-relaxed">
          Your donor profile has been created successfully. You can now receive blood donation requests from nearby locations according to your blood group, availability and notification preferences.
        </p>

        {/* Profile Card Summary */}
        <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border mt-8 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Donor ID</div>
            <div className="text-sm font-bold text-brand-primary">{donorId}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Donor Name</div>
            <div className="text-sm font-bold text-brand-navy">{name}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Blood Group</div>
            <div className="text-base font-extrabold text-red-600 flex items-center gap-1.5">
              <BloodDrop3D size={18} />
              <span>{bloodGroup}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Registered Location</div>
            <div className="text-sm font-semibold text-brand-navy">{city}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Registration Date</div>
            <div className="text-sm font-semibold text-slate-700">{dateStr}</div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Current Availability</div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold w-fit mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              AVAILABLE
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={() => router.push("/donor/dashboard")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-primary text-white font-bold shadow-3d hover:bg-brand-secondary transition-all text-sm"
          >
            GO TO DASHBOARD
          </button>

          <button
            onClick={() => router.push("/donor/dashboard?tab=profile")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border-2 border-brand-border text-brand-navy font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            VIEW MY PROFILE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessfulDonorRegistrationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-medium">Loading confirmed registration...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
