"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { BloodDrop3D, Hospital3D, Success3D } from "@/components/Icons3D";

export default function DonorHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "pending") {
        router.push("/select-role");
      } else if (user.role === "attendant") {
        router.push("/attendant/dashboard");
      } else if (user.role === "donor" && !user.profile_completed) {
        router.push("/register/donor");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchDonationHistory() {
      try {
        setLoading(true);
        const data = await apiRequest("/donors/history");
        setHistory(data || []);
      } catch (err) {
        console.error("Failed to load donation history", err);
      } finally {
        setLoading(false);
      }
    }
    if (user && user.role === "donor" && user.profile_completed) {
      fetchDonationHistory();
    }
  }, [user]);

  if (loading) {
    return <div className="p-12 text-center text-sm font-medium text-slate-500">Loading donation history...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Your Donation History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified records of completed life-saving blood donations.
          </p>
        </div>
        <button
          onClick={() => router.push("/donor/dashboard")}
          className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-navy hover:bg-slate-50 transition-all self-start sm:self-auto"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <Hospital3D size={48} className="mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-brand-navy text-base">No completed donations yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Once you accept a blood request and your donation is confirmed by the hospital, your record will be preserved here permanently.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((h) => (
              <div key={h.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Success3D size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-navy">{h.hospital_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Donation Confirmed &bull; {new Date(h.confirmation_timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Units Donated: <b>{h.units_donated || 1}</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Fulfilled
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
