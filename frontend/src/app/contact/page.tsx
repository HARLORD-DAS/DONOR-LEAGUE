"use client";

import React from "react";
import { Hospital3D, Call3D, WhatsApp3D } from "@/components/Icons3D";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-card space-y-6">
        <h1 className="text-2xl font-bold text-brand-navy">Support & Coordination Center</h1>
        <p className="text-xs text-slate-500">
          Need assistance with blood request coordination, hospital pin verification, or account settings?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border flex flex-col items-center text-center">
            <Call3D size={42} className="mb-2" />
            <div className="text-xs font-bold text-brand-navy">Emergency Helpline</div>
            <div className="text-xs text-brand-primary font-bold mt-1">1800-DONOR-LG</div>
            <div className="text-[10px] text-slate-400 mt-0.5">24/7 Response Desk</div>
          </div>

          <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border flex flex-col items-center text-center">
            <WhatsApp3D size={42} className="mb-2" />
            <div className="text-xs font-bold text-brand-navy">WhatsApp Support</div>
            <div className="text-xs text-brand-primary font-bold mt-1">+91 80 4000 5000</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Direct Coordination Bot</div>
          </div>

          <div className="p-5 rounded-2xl bg-brand-bg border border-brand-border flex flex-col items-center text-center">
            <Hospital3D size={42} className="mb-2" />
            <div className="text-xs font-bold text-brand-navy">Hospital Relations</div>
            <div className="text-xs text-brand-primary font-bold mt-1">hospital@donorleague.org</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Verification Support</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-brand-navy mt-6">
          <b>Medical Emergency Advice:</b> If a patient is experiencing an immediate medical crisis, always contact local emergency medical services or the hospital blood bank blood transfusion officer directly.
        </div>
      </div>
    </div>
  );
}
