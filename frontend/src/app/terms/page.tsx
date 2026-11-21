"use client";

import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-border shadow-card space-y-6 text-sm text-slate-600">
        <h1 className="text-2xl font-bold text-brand-navy">Terms of Service - DONOR LEAGUE</h1>
        <p className="text-xs text-slate-400">Last updated: November 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">1. Platform Nature and Medical Disclaimer</h2>
          <p>
            DONOR LEAGUE is a location-based communication and geographical coordination platform designed to assist attendants and voluntary blood donors. DONOR LEAGUE is NOT a blood bank, medical facility, or diagnostic laboratory. Blood group matching on this platform is strictly an initial communication filter and does NOT determine clinical compatibility.
          </p>
          <p>
            Actual transfusion suitability, donor medical fitness, crossmatching, screening for infectious diseases, and clinical determinations must be conducted exclusively by licensed medical personnel at authorized hospitals or blood banks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">2. User Roles and Conduct</h2>
          <p>
            There are exactly two user roles: Donor and Attendant. Users must register with authentic information. The sale or commercial trade of human blood or blood components is strictly illegal and prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">3. OpenStreetMap Data Usage</h2>
          <p>
            Geocoding, address identification, and map tiles are provided via OpenStreetMap and Nominatim under the Open Database License (ODbL). Coordinates are processed strictly for proximity calculations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand-navy">4. Notifications and Consent</h2>
          <p>
            By consenting during registration, donors agree to receive urgent notification alerts via Meta WhatsApp Business API and SMS when requests match their blood group within their geographical vicinity. Donors can update their availability toggle or opt out at any time.
          </p>
        </section>
      </div>
    </div>
  );
}
