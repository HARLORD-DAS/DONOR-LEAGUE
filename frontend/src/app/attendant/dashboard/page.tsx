"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Hospital3D, BloodDrop3D, Call3D, Emergency3D, Compass3D } from "@/components/Icons3D";

export default function AttendantDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqs, conns, hist] = await Promise.all([
        apiRequest("/attendants/requests/active"),
        apiRequest("/attendants/connections"),
        apiRequest("/attendants/requests/history"),
      ]);
      setActiveRequests(reqs || []);
      setConnections(conns || []);
      setHistory(hist || []);
    } catch (err) {
      console.error("Attendant dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "pending") {
        router.push("/select-role");
      } else if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "attendant") {
        if (!user.profile_completed) {
          router.push("/register/attendant");
        } else {
          fetchData();
        }
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return <div className="p-12 text-center text-sm font-medium">Loading Attendant Dashboard...</div>;
  }

  const ap = user?.attendant_profile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full">
                Attendant / Requester Portal
              </span>
              <span className="text-xs font-semibold text-slate-500">{ap?.attendant_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight mt-1">
              Welcome, {user?.full_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Coordinating from {ap?.city || "City"}, {ap?.state || "State"}
            </p>
          </div>

          <a
            href="/attendant/request/create"
            className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-brand-primary text-white font-bold shadow-3d hover:bg-brand-secondary transition-all text-sm shrink-0"
          >
            <BloodDrop3D size={24} />
            <span>CREATE BLOOD REQUEST</span>
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-brand-primary">{activeRequests.length}</div>
            <div className="text-xs text-slate-500 font-medium">Active Requests</div>
          </div>
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-emerald-600">{connections.length}</div>
            <div className="text-xs text-slate-500 font-medium">Connected Donors</div>
          </div>
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-brand-navy">{history.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Requests</div>
          </div>
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-emerald-600">
              {history.filter((h) => h.status === "FULFILLED").length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Fulfilled Donations</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Requests & Connected Donors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Blood Requests */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-brand-navy">Active Blood Requests</h2>
            <a href="/attendant/request/create" className="text-xs font-semibold text-brand-primary hover:underline">
              + New Request
            </a>
          </div>

          {activeRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-brand-border shadow-sm">
              <Hospital3D size={48} className="mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-brand-navy text-sm">No Active Blood Requests</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Need blood urgently? Submit a request and OpenStreetMap will immediately match nearby donors.
              </p>
              <a
                href="/attendant/request/create"
                className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold"
              >
                Create Request Now
              </a>
            </div>
          ) : (
            activeRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-6 border border-brand-border shadow-card">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      Blood Group: {req.required_blood_group}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      req.urgency === "URGENT" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-800"
                    }`}>
                      {req.urgency}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                    {req.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-brand-navy">{req.hospital_name}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{req.hospital_address}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <span>Patient Ref: <b>{req.patient_reference}</b></span>
                  <span>Units: <b>{req.units_required}</b></span>
                  <span>Search Radius: <b>{req.current_search_radius_km} km</b></span>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                  <a
                    href={`/attendant/request/${req.id}/matching`}
                    className="flex-1 text-center py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm hover:bg-brand-secondary transition-all"
                  >
                    View Matching & Map
                  </a>
                  <a
                    href={`/attendant/tracking/${req.id}`}
                    className="py-2.5 px-4 rounded-xl bg-brand-light text-brand-primary font-semibold text-xs hover:bg-blue-100 transition-all"
                  >
                    Track Request
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Connected Donors */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-brand-navy">Connected Donors</h2>
            <a href="/attendant/connected" className="text-xs font-semibold text-brand-primary hover:underline">
              View All
            </a>
          </div>

          {connections.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-brand-border shadow-sm">
              <Call3D size={48} className="mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-brand-navy text-sm">No connected donors yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                As soon as a donor accepts your blood request, their authorized contact information will appear here with one-click calling.
              </p>
            </div>
          ) : (
            connections.slice(0, 4).map((conn) => (
              <div key={conn.id} className="bg-white rounded-2xl p-5 border border-brand-border shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Donor Accepted
                  </span>
                  <span className="text-xs font-bold text-red-600">Blood: {conn.donor_blood_group}</span>
                </div>

                <h4 className="text-sm font-bold text-brand-navy">{conn.donor_name}</h4>
                <p className="text-xs text-slate-500">{conn.donor_locality} &bull; For {conn.hospital_name}</p>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={`tel:${conn.donor_phone}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Call3D size={18} />
                    <span>Call ({conn.donor_phone})</span>
                  </a>
                  <a
                    href={`/attendant/connected`}
                    className="p-2 rounded-xl border border-brand-border text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Details
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
