"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Success3D, Call3D, Hospital3D, BloodDrop3D } from "@/components/Icons3D";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function DonorAcceptedConfirmationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [latestConnection, setLatestConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

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
    async function fetchAccepted() {
      try {
        setLoading(true);
        const connections = await apiRequest("/donors/requests/accepted");
        if (connections && connections.length > 0) {
          setLatestConnection(connections[0]);
        }
      } catch (err) {
        console.error("Failed to load accepted requests", err);
      } finally {
        setLoading(false);
      }
    }
    if (user && user.role === "donor" && user.profile_completed) {
      fetchAccepted();
    }
  }, [user]);

  if (loading) {
    return <div className="p-12 text-center text-sm font-medium">Loading acceptance confirmation...</div>;
  }

  const conn = latestConnection;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-elevated text-center">
        <div className="flex justify-center mb-6">
          <Success3D size={84} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight uppercase">
          YOU HAVE SUCCESSFULLY ACCEPTED THE BLOOD DONATION REQUEST.
        </h1>

        <p className="text-sm text-slate-600 mt-3 max-w-lg mx-auto">
          Thank you for stepping forward. Your response has been securely transmitted to the attendant in real-time. Please coordinate with them directly.
        </p>

        {conn && (
          <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border mt-8 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Request Code</div>
              <div className="text-sm font-bold text-brand-primary">{conn.request_code || "DL-REQ-CONFIRMED"}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Attendant Name</div>
              <div className="text-sm font-bold text-brand-navy">{conn.attendant_name || "Authorized Attendant"}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Attendant Contact</div>
              <div className="text-sm font-bold text-brand-navy">{conn.attendant_phone || "Phone Shared"}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Acceptance Time</div>
              <div className="text-sm font-semibold text-slate-700">
                {new Date(conn.created_at).toLocaleString()}
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-200">
              <div className="text-[11px] font-semibold uppercase text-slate-400">Hospital & Destination</div>
              <div className="text-sm font-bold text-brand-navy">{conn.hospital_name}</div>
              <div className="text-xs text-slate-600 mt-0.5">{conn.hospital_address}</div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          {conn?.attendant_phone && (
            <a
              href={`tel:${conn.attendant_phone}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold shadow-sm hover:bg-emerald-700 transition-all text-sm"
            >
              <Call3D size={24} />
              <span>CALL ATTENDANT ({conn.attendant_phone})</span>
            </a>
          )}

          <button
            onClick={() => setShowMap(!showMap)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-light text-brand-primary font-semibold border border-blue-200 hover:bg-blue-100 transition-all text-sm"
          >
            {showMap ? "HIDE HOSPITAL LOCATION" : "VIEW HOSPITAL LOCATION"}
          </button>

          <button
            onClick={() => router.push("/donor/dashboard")}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-brand-border text-slate-700 font-semibold hover:bg-slate-50 transition-all text-sm"
          >
            GO TO DASHBOARD
          </button>
        </div>

        {/* Dynamic Leaflet Hospital Location Modal/Drawer */}
        {showMap && conn && conn.hospital_latitude && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-left">
            <h3 className="text-sm font-bold text-brand-navy mb-3">Hospital Location (OpenStreetMap)</h3>
            <InteractiveMap
              center={[conn.hospital_latitude, conn.hospital_longitude]}
              zoom={15}
              hospitalName={conn.hospital_name}
              height="300px"
            />
          </div>
        )}
      </div>
    </div>
  );
}
