"use client";

import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-card space-y-6 text-sm text-slate-600">
        <h1 className="text-2xl font-bold text-brand-navy">Privacy Policy - DONOR LEAGUE</h1>
        <p className="text-xs text-slate-400">Effective: November 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">1. Location Data Protection</h2>
          <p>
            We take donor privacy with utmost gravity. While donors register their locality coordinates via OpenStreetMap geocoding or GPS, <b>exact residential addresses and precise coordinates are never shared with attendants or displayed publicly.</b>
          </p>
          <p>
            Attendants only see approximate distance (e.g. "~2.4 km away") and general neighborhood names on discovery maps.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">2. Contact Information Sharing</h2>
          <p>
            Donor mobile numbers and direct communication details are ONLY authorized and revealed after the donor explicitly reviews and accepts a blood donation request. Attendants cannot access donor phone numbers prior to mutual acceptance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">3. Availability Status Control</h2>
          <p>
            Donors maintain complete control over their matching eligibility via the Availability Toggle on their dashboard. Setting availability to "Not Available" instantly excludes the profile from all new automated discovery searches.
          </p>
        </section>
      </div>
    </div>
  );
}
