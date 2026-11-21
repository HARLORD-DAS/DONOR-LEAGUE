"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Success3D, Call3D, Hospital3D, BloodDrop3D } from "@/components/Icons3D";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function ConnectedDonorsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHospitalMap, setActiveHospitalMap] = useState<any | null>(null);

  useEffect(() => {
    async function loadConnections() {
      try {
        setLoading(true);
        const data = await apiRequest("/attendants/connections");
        setConnections(data || []);
      } catch (err) {
        console.error("Failed to load connections", err);
      } finally {
        setLoading(false);
      }
    }
    loadConnections();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-sm font-medium">Loading connected donors...</div>;
  }

  const latest = connections.length > 0 ? connections[0] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Top Good News Banner if recent acceptance exists */}
      {latest && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated mb-10 text-center">
          <div className="flex justify-center mb-4">
            <Success3D size={72} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight uppercase">
            GOOD NEWS! A DONOR HAS ACCEPTED YOUR BLOOD REQUEST.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            A matching donor has reviewed your hospital requirement and confirmed their willingness to donate.
          </p>

          <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border mt-6 text-left grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Donor Name</div>
              <div className="text-sm font-bold text-brand-navy">{latest.donor_name}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Donor Phone</div>
              <div className="text-sm font-bold text-brand-primary">{latest.donor_phone}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Blood Group</div>
              <div className="text-sm font-extrabold text-red-600 flex items-center gap-1">
                <BloodDrop3D size={18} />
                <span>{latest.donor_blood_group}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Acceptance Time</div>
              <div className="text-xs font-semibold text-slate-700">
                {new Date(latest.created_at).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Hospital Destination</div>
              <div className="text-xs font-bold text-brand-navy">{latest.hospital_name}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Contact Authorization</div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                ✓ Authorized & Shared
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <a
              href={`tel:${latest.donor_phone}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-all"
            >
              <Call3D size={20} />
              <span>CALL DONOR ({latest.donor_phone})</span>
            </a>

            {latest.hospital_latitude && (
              <button
                onClick={() => setActiveHospitalMap(activeHospitalMap ? null : latest)}
                className="px-6 py-3 rounded-xl bg-brand-light text-brand-primary font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition-all"
              >
                {activeHospitalMap ? "HIDE HOSPITAL LOCATION" : "VIEW HOSPITAL LOCATION"}
              </button>
            )}

            <button
              onClick={() => router.push("/attendant/dashboard")}
              className="px-6 py-3 rounded-xl border border-brand-border text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all"
            >
              DASHBOARD
            </button>
          </div>

          {activeHospitalMap && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-left">
              <h3 className="text-sm font-bold text-brand-navy mb-2">Hospital Map Destination</h3>
              <InteractiveMap
                center={[activeHospitalMap.hospital_latitude, activeHospitalMap.hospital_longitude]}
                zoom={14}
                hospitalName={activeHospitalMap.hospital_name}
                height="280px"
              />
            </div>
          )}
        </div>
      )}

      {/* Full Connection List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card">
        <h2 className="text-xl font-bold text-brand-navy mb-4">All Connected Donors</h2>

        {connections.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No donors have accepted active blood requests yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {connections.map((c) => (
              <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-brand-navy">{c.donor_name}</h3>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {c.donor_blood_group}
                    </span>
                    <span className="text-[11px] text-slate-400">ID: {c.connection_id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For <b>{c.hospital_name}</b> &bull; Accepted on {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${c.donor_phone}`}
                    className="py-2 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                  >
                    <Call3D size={18} />
                    <span>Call Donor</span>
                  </a>
                  <a
                    href={`/attendant/history`}
                    className="py-2 px-3 rounded-xl border border-brand-border text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Confirm Fulfillment
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
