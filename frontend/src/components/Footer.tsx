"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-brand-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-lg font-bold text-brand-navy tracking-tight">
              DONOR LEAGUE
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Location-based blood donor identification and coordination platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <a href="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</a>
            <a href="/contact" className="hover:text-brand-primary transition-colors">Support & Contact</a>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">
              Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-brand-primary">OpenStreetMap</a> contributors
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
