"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Hospital3D, Success3D, Compass3D } from "@/components/Icons3D";

const STAGES = [
  { id: 1, name: "Request Submitted", desc: "Blood request registered in database." },
  { id: 2, name: "Hospital Location Confirmed", desc: "Hospital coordinates verified via OpenStreetMap." },
  { id: 3, name: "Geographical Search Started", desc: "Radius proximity discovery engine running." },
  { id: 4, name: "Donors Identified", desc: "Available compatible donors found nearby." },
  { id: 5, name: "Notifications Initiated", desc: "WhatsApp and SMS payloads prepared." },
  { id: 6, name: "Notifications Dispatched", desc: "Secure review links sent to donors." },
  { id: 7, name: "Donor Responses Received", desc: "Incoming donor acceptances/declines processed." },
  { id: 8, name: "Donor Accepted", desc: "Registered donor agreed to donate." },
  { id: 9, name: "Attendant Notified", desc: "Real-time alert pushed to attendant dashboard." },
  { id: 10, name: "Contact Shared", desc: "Authorized contact information exchanged." },
  { id: 11, name: "Coordination in Progress", desc: "Attendant and donor coordinating hospital arrival." },
  { id: 12, name: "Fulfilment Confirmed", desc: "Blood donation confirmed completed at hospital." },
  { id: 13, name: "Request Closed", desc: "Completed transaction archived." },
];

export default function RequestTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const requestId = params.id as string;

  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [trackingSteps, setTrackingSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "pending") {
        router.push("/select-role");
      } else if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "attendant" && !user.profile_completed) {
        router.push("/register/attendant");
      }
    }
  }, [user, authLoading, router]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const [req, steps] = await Promise.all([
        apiRequest(`/requests/${requestId}`),
        apiRequest(`/requests/${requestId}/tracking`),
      ]);
      setRequestDetails(req);
      setTrackingSteps(steps || []);
    } catch (err) {
      console.error("Tracking load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && user && user.role === "attendant" && user.profile_completed) {
      fetchTracking();
      const interval = setInterval(fetchTracking, 6000); // Poll live updates every 6s
      return () => clearInterval(interval);
    }
  }, [requestId, user]);

  if (loading && !requestDetails) {
    return <div className="p-12 text-center text-sm font-medium">Loading tracking timeline...</div>;
  }

  const completedStages = new Set(trackingSteps.map((s) => s.stage));
  const maxCompletedStage = Math.max(0, ...Array.from(completedStages));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-light text-brand-primary">
                Live Timeline
              </span>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                {requestDetails?.required_blood_group}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
              Tracking Request: {requestDetails?.request_id}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Destination: {requestDetails?.hospital_name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/attendant/request/${requestId}/matching`}
              className="py-2.5 px-4 rounded-xl bg-brand-light text-brand-primary font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition-all"
            >
              Matching & Map
            </a>
            <a
              href="/attendant/dashboard"
              className="py-2.5 px-4 rounded-xl border border-brand-border text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
            >
              Dashboard
            </a>
          </div>
        </div>

        {/* 13-Stage Progression Timeline */}
        <div className="my-8 space-y-6">
          {STAGES.map((stage, idx) => {
            const isDone = completedStages.has(stage.id);
            const isCurrent = stage.id === maxCompletedStage + 1;
            const logEntry = trackingSteps.find((s) => s.stage === stage.id);

            return (
              <div key={stage.id} className="flex items-start gap-4 relative">
                {/* Connecting Line */}
                {idx < STAGES.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 w-0.5 h-12 -ml-px ${
                      isDone ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Stage Indicator Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isCurrent
                      ? "bg-brand-primary text-white animate-pulse"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : stage.id}
                </div>

                {/* Stage Description */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${isDone ? "text-brand-navy" : isCurrent ? "text-brand-primary" : "text-slate-400"}`}>
                      Stage {stage.id}: {stage.name}
                    </h3>
                    {logEntry && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(logEntry.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {logEntry ? logEntry.description : stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
