"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Hospital3D, Success3D } from "@/components/Icons3D";

export default function AttendantHistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/attendants/requests/history");
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleConfirmFulfillment = async (requestId: number, requestCode: string) => {
    const ok = window.confirm(`Confirm that blood donation for ${requestCode} has been successfully completed at the hospital?`);
    if (!ok) return;

    try {
      const res = await apiRequest(`/attendants/requests/${requestId}/confirm-fulfillment`, {
        method: "POST",
      });
      setFeedback(res.message);
      fetchHistory();
    } catch (err: any) {
      alert(err.message || "Failed to confirm fulfillment.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm font-medium">Loading request history...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Request History & Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and close fulfilled blood requests.</p>
        </div>
        <a
          href="/attendant/request/create"
          className="px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm hover:bg-brand-secondary transition-all"
        >
          + Create Blood Request
        </a>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-brand-border shadow-card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No blood requests found on record.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      Blood: {r.required_blood_group}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      r.status === "FULFILLED"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "CONNECTED"
                        ? "bg-blue-100 text-brand-primary"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      Status: {r.status}
                    </span>
                    <span className="text-xs text-slate-400">ID: {r.request_id}</span>
                  </div>

                  <h3 className="text-base font-bold text-brand-navy">{r.hospital_name}</h3>
                  <p className="text-xs text-slate-500">{r.hospital_address}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                    <span>Patient: <b>{r.patient_reference}</b></span>
                    <span>Units: <b>{r.units_required}</b></span>
                    <span>Date: <b>{r.required_date}</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {r.status === "CONNECTED" && (
                    <button
                      onClick={() => handleConfirmFulfillment(r.id, r.request_id)}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                    >
                      <Success3D size={18} />
                      <span>Confirm Fulfillment</span>
                    </button>
                  )}

                  <a
                    href={`/attendant/tracking/${r.id}`}
                    className="py-2.5 px-3.5 rounded-xl border border-brand-border text-xs text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Timeline
                  </a>

                  <a
                    href={`/attendant/request/${r.id}/matching`}
                    className="py-2.5 px-3.5 rounded-xl bg-brand-light text-brand-primary text-xs font-semibold hover:bg-blue-100"
                  >
                    Matching Map
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
