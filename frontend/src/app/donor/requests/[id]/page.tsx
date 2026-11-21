"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Hospital3D, BloodDrop3D, Call3D } from "@/components/Icons3D";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function DonorRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const requestId = params.id as string;

  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    async function loadRequest() {
      try {
        setLoading(true);
        const data = await apiRequest(`/donors/requests/${requestId}`);
        setRequestData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load request details.");
      } finally {
        setLoading(false);
      }
    }
    if (requestId && user && user.role === "donor" && user.profile_completed) {
      loadRequest();
    }
  }, [requestId, user]);

  const handleRespond = async (action: "ACCEPTED" | "DECLINED") => {
    try {
      setSubmitting(true);
      await apiRequest(`/donors/requests/${requestId}/respond`, {
        method: "POST",
        body: JSON.stringify({ response: action }),
      });
      if (action === "ACCEPTED") {
        router.push("/donor/accepted");
      } else {
        router.push("/donor/dashboard");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm font-medium">Loading request information...</div>;
  }

  if (error || !requestData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-brand-border">
          <h2 className="text-lg font-bold text-red-600">Unable to load request</h2>
          <p className="text-xs text-slate-500 mt-2">{error || "Request not found."}</p>
          <button
            onClick={() => router.push("/donor/dashboard")}
            className="mt-6 px-6 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                Blood Group: {requestData.required_blood_group}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                requestData.urgency === "URGENT" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-800"
              }`}>
                {requestData.urgency}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
              Blood Donation Request: {requestData.request_code}
            </h1>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Proximity to you</div>
            <div className="text-xl font-extrabold text-brand-primary">~{requestData.distance_km} km</div>
          </div>
        </div>

        {/* Hospital & Medical Requirement Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 items-start">
          <div className="space-y-4">
            <div className="bg-brand-bg rounded-2xl p-5 border border-brand-border">
              <div className="flex items-center gap-3 mb-2">
                <Hospital3D size={36} />
                <div>
                  <h3 className="font-bold text-sm text-brand-navy">{requestData.hospital_name}</h3>
                  <p className="text-xs text-slate-500">{requestData.hospital_address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-brand-border space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Required Units:</span>
                <span className="font-bold text-brand-navy">{requestData.units_required} unit(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Required By:</span>
                <span className="font-bold text-brand-navy">{requestData.required_date} at {requestData.required_time}</span>
              </div>
              {requestData.instructions && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Medical Coordination Notes:</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700 italic">
                    "{requestData.instructions}"
                  </p>
                </div>
              )}
            </div>

            {requestData.attendant && (
              <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">
                  Authorized Attendant Contact
                </h4>
                <p className="text-xs text-slate-700">
                  Name: <b>{requestData.attendant.name}</b> &bull; Phone: <b>{requestData.attendant.phone}</b>
                </p>
              </div>
            )}
          </div>

          {/* OpenStreetMap Hospital Visualizer */}
          <div>
            <InteractiveMap
              center={[requestData.hospital_latitude, requestData.hospital_longitude]}
              zoom={14}
              hospitalName={requestData.hospital_name}
              height="300px"
            />
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Hospital coordinates confirmed via OpenStreetMap Nominatim
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {requestData.my_response ? (
          <div className="p-4 rounded-xl bg-slate-100 text-center text-xs font-semibold text-slate-700">
            You have already <b>{requestData.my_response}</b> this request.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
            <button
              onClick={() => handleRespond("ACCEPTED")}
              disabled={submitting}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-brand-primary text-white font-bold shadow-3d hover:bg-brand-secondary transition-all disabled:opacity-60 text-sm"
            >
              {submitting ? "Processing..." : "ACCEPT REQUEST"}
            </button>
            <button
              onClick={() => handleRespond("DECLINED")}
              disabled={submitting}
              className="w-full sm:w-48 py-4 px-6 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition-all disabled:opacity-60 text-sm"
            >
              DECLINE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
