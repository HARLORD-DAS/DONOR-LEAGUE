"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BloodDrop3D, Hospital3D } from "@/components/Icons3D";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, loading: authLoading, selectRole } = useAuth();
  const [submittingRole, setSubmittingRole] = useState<"donor" | "attendant" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Route Protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "donor") {
        if (user.profile_completed) {
          router.push("/donor/dashboard");
        } else {
          router.push("/register/donor");
        }
      } else if (user.role === "attendant") {
        if (user.profile_completed) {
          router.push("/attendant/dashboard");
        } else {
          router.push("/register/attendant");
        }
      }
    }
  }, [user, authLoading, router]);

  const handleRoleSelect = async (role: "donor" | "attendant") => {
    if (submittingRole) return;
    setError(null);
    setSubmittingRole(role);

    try {
      await selectRole(role);
      if (role === "donor") {
        router.push("/register/donor");
      } else {
        router.push("/register/attendant");
      }
    } catch (err: any) {
      setError(err.message || "Failed to set account role. Please try again.");
      setSubmittingRole(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 font-medium text-sm">Loading account status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy tracking-tight uppercase">
          CHOOSE YOUR ROLE
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Welcome, <span className="font-semibold text-brand-navy">{user.full_name}</span>. Please choose how you want to participate in the Donor League network.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-2xl mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium text-center">
          {error}
        </div>
      )}

      {/* Two Large Interactive Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
        {/* Card 1 – Donor */}
        <button
          type="button"
          disabled={submittingRole !== null}
          onClick={() => handleRoleSelect("donor")}
          className={`group bg-white rounded-[36px] p-8 sm:p-10 border text-center transition-all duration-300 flex flex-col items-center justify-between cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-light ${
            submittingRole === "donor"
              ? "border-brand-primary ring-2 ring-brand-primary bg-blue-50/20"
              : "border-slate-100 shadow-[0_20px_50px_rgba(21,94,239,0.09)] hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(21,94,239,0.18)] hover:border-blue-200"
          }`}
        >
          {/* Circular Badge with Large 3D Blood Drop Icon */}
          <div className="w-32 h-32 rounded-full bg-blue-50/80 border-4 border-white shadow-[0_8px_24px_rgba(21,94,239,0.1)] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
            <BloodDrop3D size={72} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy mb-3 tracking-tight">
            DONOR
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 px-2">
            Register as a blood donor and help people who need blood.
          </p>

          <div className="w-full max-w-[200px] py-3.5 px-6 rounded-full bg-brand-primary text-white font-bold text-sm shadow-[0_8px_20px_rgba(21,94,239,0.35)] group-hover:bg-brand-secondary transition-all flex items-center justify-center gap-2">
            <span>{submittingRole === "donor" ? "Saving..." : "Continue"}</span>
            <span className="text-base transition-transform group-hover:translate-x-1">›</span>
          </div>
        </button>

        {/* Card 2 – Attender */}
        <button
          type="button"
          disabled={submittingRole !== null}
          onClick={() => handleRoleSelect("attendant")}
          className={`group bg-white rounded-[36px] p-8 sm:p-10 border text-center transition-all duration-300 flex flex-col items-center justify-between cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-light ${
            submittingRole === "attendant"
              ? "border-brand-primary ring-2 ring-brand-primary bg-blue-50/20"
              : "border-slate-100 shadow-[0_20px_50px_rgba(21,94,239,0.09)] hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(21,94,239,0.18)] hover:border-blue-200"
          }`}
        >
          {/* Circular Badge with Large 3D Hospital Icon */}
          <div className="w-32 h-32 rounded-full bg-blue-50/80 border-4 border-white shadow-[0_8px_24px_rgba(21,94,239,0.1)] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
            <Hospital3D size={72} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy mb-3 tracking-tight">
            ATTENDER
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 px-2">
            Search for suitable blood donors for patients who need blood.
          </p>

          <div className="w-full max-w-[200px] py-3.5 px-6 rounded-full bg-brand-primary text-white font-bold text-sm shadow-[0_8px_20px_rgba(21,94,239,0.35)] group-hover:bg-brand-secondary transition-all flex items-center justify-center gap-2">
            <span>{submittingRole === "attendant" ? "Saving..." : "Continue"}</span>
            <span className="text-base transition-transform group-hover:translate-x-1">›</span>
          </div>
        </button>
      </div>
    </div>
  );
}
