"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AvailabilityToggle } from "@/components/AvailabilityToggle";
import { BloodDrop3D, Hospital3D, Emergency3D, WhatsApp3D, Success3D } from "@/components/Icons3D";
import { useRouter } from "next/navigation";

export default function DonorDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incoming" | "accepted" | "history" | "notifications" | "profile">("incoming");

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incoming, accepted, donationHist] = await Promise.all([
        apiRequest("/donors/requests/incoming"),
        apiRequest("/donors/requests/accepted"),
        apiRequest("/donors/history"),
      ]);
      setIncomingRequests(incoming || []);
      setAcceptedRequests(accepted || []);
      setHistory(donationHist || []);

      if (user?.user_id) {
        const notifs = await apiRequest(`/notifications/user/${user.user_id}`);
        setNotifications(notifs || []);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
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
      } else if (user.role === "attendant") {
        router.push("/attendant/dashboard");
      } else if (user.role === "donor") {
        if (!user.profile_completed) {
          router.push("/register/donor");
        } else {
          fetchData();
        }
      }
    }
  }, [user, authLoading, router]);

  const handleRespond = async (requestId: number, action: "ACCEPTED" | "DECLINED") => {
    try {
      const res = await apiRequest(`/donors/requests/${requestId}/respond`, {
        method: "POST",
        body: JSON.stringify({ response: action }),
      });
      setActionFeedback(res.message);
      if (action === "ACCEPTED") {
        router.push("/donor/accepted");
      } else {
        fetchData();
      }
    } catch (err: any) {
      setActionFeedback(err.message || "Failed to submit response.");
    } finally {
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  if (authLoading || (!user && loading)) {
    return <div className="p-12 text-center text-sm font-medium text-slate-500">Loading Donor Dashboard...</div>;
  }

  const dp = user?.donor_profile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome & Top Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <BloodDrop3D size={56} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full">
                  Verified Donor
                </span>
                <span className="text-xs font-semibold text-slate-500">{dp?.donor_id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight mt-1">
                Welcome back, {user?.full_name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {dp?.area || dp?.city}, {dp?.state} &bull; Registered Blood Group: <b className="text-red-600">{dp?.blood_group}</b>
              </p>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="bg-brand-bg rounded-2xl p-4 border border-brand-border flex flex-col gap-1 sm:self-center">
            <span className="text-xs font-semibold text-slate-500">Your Availability Status</span>
            <AvailabilityToggle initialAvailable={dp?.is_available ?? true} onToggleSuccess={() => fetchData()} />
            <span className="text-[11px] text-slate-400">
              Only available donors receive matching blood requests.
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-brand-navy">{incomingRequests.length}</div>
            <div className="text-xs text-slate-500 font-medium">Incoming Matches</div>
          </div>
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-brand-primary">{acceptedRequests.length}</div>
            <div className="text-xs text-slate-500 font-medium">Accepted Requests</div>
          </div>
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-emerald-600">{history.length}</div>
            <div className="text-xs text-slate-500 font-medium">Completed Donations</div>
          </div>
          <div className="bg-brand-bg rounded-xl p-3 border border-brand-border">
            <div className="text-xl font-bold text-brand-navy">{notifications.length}</div>
            <div className="text-xs text-slate-500 font-medium">Alert Notifications</div>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-brand-primary flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-brand-border mb-6 gap-2 sm:gap-6 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`pb-3 px-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "incoming" ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Incoming Blood Requests ({incomingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab("accepted")}
          className={`pb-3 px-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "accepted" ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Accepted Connections ({acceptedRequests.length})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "history" ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Donation History ({history.length})
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 px-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "notifications" ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Notification Log ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-2 whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "profile" ? "border-brand-primary text-brand-primary" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Profile & Preferences
        </button>
      </div>

      {/* Tab 1: Incoming Blood Requests */}
      {activeTab === "incoming" && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-brand-border shadow-sm">
              <Hospital3D size={48} className="mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-brand-navy text-base">No pending requests right now</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When an attendant submits a blood requirement near your location matching your blood group, it will appear here instantly.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.request_id}
                className="bg-white rounded-2xl p-6 border border-brand-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      Blood Group: {req.required_blood_group}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      req.urgency === "URGENT" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-800"
                    }`}>
                      {req.urgency}
                    </span>
                    <span className="text-xs text-slate-500">ID: {req.request_code}</span>
                  </div>

                  <h3 className="text-lg font-bold text-brand-navy">{req.hospital_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{req.hospital_address}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span>Units Required: <b>{req.units_required}</b></span>
                    <span>Approx Distance: <b className="text-brand-primary">{req.distance_km} km</b></span>
                    <span>Required Date: <b>{req.required_date} at {req.required_time}</b></span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2.5 sm:w-48 shrink-0">
                  <button
                    onClick={() => handleRespond(req.request_id, "ACCEPTED")}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-3d hover:bg-brand-secondary transition-all"
                  >
                    ACCEPT REQUEST
                  </button>
                  <button
                    onClick={() => handleRespond(req.request_id, "DECLINED")}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-all"
                  >
                    DECLINE
                  </button>
                  <a
                    href={`/donor/requests/${req.request_id}`}
                    className="text-center py-2 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    View Details & Map
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Accepted Connections */}
      {activeTab === "accepted" && (
        <div className="space-y-4">
          {acceptedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-brand-border">
              <p className="text-sm text-slate-500">You have not accepted any active blood requests yet.</p>
            </div>
          ) : (
            acceptedRequests.map((conn) => (
              <div key={conn.id} className="bg-white rounded-2xl p-6 border border-brand-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    CONNECTED & COORDINATING
                  </div>
                  <h3 className="text-base font-bold text-brand-navy">{conn.hospital_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{conn.hospital_address}</p>

                  <div className="mt-3 p-3 rounded-xl bg-brand-light/60 border border-blue-200 text-xs flex flex-wrap gap-4 text-brand-navy">
                    <span>Attendant: <b>{conn.attendant_name}</b></span>
                    <span>Phone: <b>{conn.attendant_phone}</b></span>
                    <span>Connection Code: <b>{conn.connection_id}</b></span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <a
                    href={`tel:${conn.attendant_phone}`}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 text-center transition-all"
                  >
                    CALL ATTENDANT ({conn.attendant_phone})
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Donation History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No completed donations on record yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((h) => (
                <div key={h.id} className="p-4 sm:p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-brand-navy">{h.hospital_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Donation Confirmed &bull; {new Date(h.confirmation_timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Fulfilled
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No notifications sent yet.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-4 sm:p-6 flex items-start gap-4">
                {n.channel === "WHATSAPP" ? <WhatsApp3D size={36} /> : <Emergency3D size={36} />}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brand-navy">{n.channel} Alert</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">{n.message_status}</span>
                    <span className="text-[11px] text-slate-400 ml-auto">{new Date(n.sent_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                    {n.message_text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Profile & Settings */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card space-y-4 max-w-xl">
          <h3 className="font-bold text-base text-brand-navy">Donor Profile Summary</h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div><b>Name:</b> {user?.full_name}</div>
            <div><b>Email:</b> {user?.email}</div>
            <div><b>Mobile:</b> {user?.phone}</div>
            <div><b>Blood Group:</b> {dp?.blood_group}</div>
            <div><b>Date of Birth:</b> {dp?.date_of_birth}</div>
            <div><b>Locality:</b> {dp?.area || dp?.city}, {dp?.state}</div>
            <div><b>WhatsApp Notifications:</b> {dp?.whatsapp_consent ? "Enabled" : "Disabled"}</div>
            <div><b>SMS Notifications:</b> {dp?.sms_consent ? "Enabled" : "Disabled"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
