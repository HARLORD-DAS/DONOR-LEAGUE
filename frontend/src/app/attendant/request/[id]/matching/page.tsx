"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Hospital3D, BloodDrop3D, WhatsApp3D, Compass3D } from "@/components/Icons3D";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function AutomaticDonorMatchingPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [matchingData, setMatchingData] = useState<any>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number>(5);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const [req, matches] = await Promise.all([
        apiRequest(`/requests/${requestId}`),
        apiRequest(`/matching/request/${requestId}`),
      ]);
      setRequestDetails(req);
      setMatchingData(matches);
      setSelectedRadius(matches.search_radius_km || 5);
    } catch (err) {
      console.error("Failed to load matching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) fetchMatches();
  }, [requestId]);

  const handleExpandRadius = async (newRadiusKm: number) => {
    try {
      setExpanding(true);
      await apiRequest(`/requests/${requestId}/expand-radius`, {
        method: "POST",
        body: JSON.stringify({ new_radius_km: newRadiusKm }),
      });
      await fetchMatches();
    } catch (err: any) {
      alert(err.message || "Failed to expand search radius.");
    } finally {
      setExpanding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center max-w-md mx-auto">
        <Compass3D size={64} className="mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold text-brand-navy">Discovering Matching Donors...</h2>
        <p className="text-xs text-slate-500 mt-2">
          Searching registered donors near hospital coordinates using OpenStreetMap proximity calculations.
        </p>
      </div>
    );
  }

  const donors = matchingData?.donors || [];
  const mapDonors = donors.map((d: any) => ({
    id: d.donor_id,
    lat: d.approx_latitude,
    lon: d.approx_longitude,
    label: d.display_name,
    bloodGroup: d.blood_group,
    distanceKm: d.distance_km,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
              Blood: {matchingData?.required_blood_group}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Radius: {selectedRadius} km
            </span>
            <span className="text-xs text-slate-500">ID: {requestDetails?.request_id}</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
            Geographical Donor Discovery: {matchingData?.hospital_name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic discovery origin: Hospital Coordinates ({matchingData?.hospital_latitude.toFixed(4)}, {matchingData?.hospital_longitude.toFixed(4)})
          </p>
        </div>

        {/* Action Link to Live Tracking */}
        <div className="flex items-center gap-3">
          <a
            href={`/attendant/tracking/${requestId}`}
            className="py-2.5 px-4 rounded-xl bg-brand-light text-brand-primary font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition-all"
          >
            Live Request Tracking
          </a>
          <a
            href="/attendant/dashboard"
            className="py-2.5 px-4 rounded-xl border border-brand-border text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
          >
            Dashboard
          </a>
        </div>
      </div>

      {/* Main Responsive Layout: Map + Donor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Top: Interactive Leaflet Map with Search Radius and Pins */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-brand-border shadow-card">
            <InteractiveMap
              center={[matchingData.hospital_latitude, matchingData.hospital_longitude]}
              zoom={13}
              radiusKm={selectedRadius}
              hospitalName={matchingData.hospital_name}
              donors={mapDonors}
              height="450px"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" /> Hospital Center
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 ml-2" /> Approximate Donor Pin
              </span>
              <span>Search Radius: <b>{selectedRadius} km</b></span>
            </div>
          </div>

          {/* Search Radius Expansion Controls */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-brand-navy">Expand Discovery Radius</div>
              <p className="text-[11px] text-slate-500">Need more donors? Broaden your geographical range.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 25, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => handleExpandRadius(r)}
                  disabled={expanding || selectedRadius === r}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedRadius === r
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  } disabled:opacity-60`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right / Bottom: Matching Donor Cards Ranked by Proximity */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-brand-navy">
              Discovered Matches ({donors.length})
            </h2>
            <span className="text-xs text-slate-500">Ranked by Proximity</span>
          </div>

          {donors.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-brand-border shadow-card space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center mx-auto text-xl">
                !
              </div>
              <h3 className="font-extrabold text-brand-navy text-sm">
                WE COULDN'T FIND A MATCH IN THE CURRENT SEARCH AREA.
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No active and available {matchingData?.required_blood_group} donors are currently registered within {selectedRadius} km of {matchingData?.hospital_name}.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleExpandRadius(selectedRadius === 5 ? 10 : selectedRadius === 10 ? 25 : 50)}
                  disabled={expanding}
                  className="py-3 px-4 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-3d hover:bg-brand-secondary transition-all"
                >
                  EXPAND SEARCH RADIUS
                </button>
                <button
                  onClick={fetchMatches}
                  className="py-2.5 px-4 rounded-xl border border-brand-border text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {donors.map((d: any) => (
                <div
                  key={d.donor_id}
                  className="bg-white rounded-2xl p-4 border border-brand-border shadow-card hover:border-brand-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-brand-navy">{d.display_name}</span>
                        <span className="text-[10px] text-slate-400">({d.donor_identifier})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{d.locality}, {d.city}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-brand-primary block">
                        {d.distance_km} km away
                      </span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        Blood: {d.blood_group}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <WhatsApp3D size={18} />
                      <span>Alert: {d.notification_status}</span>
                    </span>
                    <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                      Available & Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
