"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AvailabilityToggle } from "./AvailabilityToggle";

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Plain text branding without logo or slogan */}
          <div className="flex items-center gap-6">
            <a href="/" className="text-xl font-bold tracking-tight text-brand-navy hover:text-brand-primary transition-colors">
              DONOR LEAGUE
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
              <a href="/" className="hover:text-brand-primary transition-colors">Home</a>
              {user?.role === "donor" && (
                <>
                  <a href="/donor/dashboard" className="hover:text-brand-primary transition-colors">Dashboard</a>
                  <a href="/donor/accepted" className="hover:text-brand-primary transition-colors">Accepted Requests</a>
                  <a href="/donor/history" className="hover:text-brand-primary transition-colors">Donation History</a>
                </>
              )}
              {user?.role === "attendant" && (
                <>
                  <a href="/attendant/dashboard" className="hover:text-brand-primary transition-colors">Dashboard</a>
                  <a href="/attendant/request/create" className="text-brand-primary font-semibold hover:underline">
                    Create Request
                  </a>
                  <a href="/attendant/connected" className="hover:text-brand-primary transition-colors">Connected Donors</a>
                  <a href="/attendant/history" className="hover:text-brand-primary transition-colors">Request History</a>
                </>
              )}
            </nav>
          </div>

          {/* Right Action / Profile */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === "donor" && user.donor_profile && (
                  <AvailabilityToggle initialAvailable={user.donor_profile.is_available ?? true} />
                )}
                <div className="text-right">
                  <div className="text-xs font-semibold text-brand-navy">{user.full_name}</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider">{user.identifier || user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-brand-primary px-3 py-1.5 rounded-lg transition-colors"
                >
                  Login
                </a>
                <a
                  href="/register/donor"
                  className="text-sm font-semibold text-white bg-brand-primary hover:bg-brand-secondary px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  Register as Donor
                </a>
                <a
                  href="/register/attendant"
                  className="text-sm font-semibold text-brand-primary bg-brand-light hover:bg-blue-100 px-4 py-2 rounded-xl transition-all border border-blue-200"
                >
                  Need Blood
                </a>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white px-4 pt-3 pb-6 space-y-3">
          <a href="/" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Home</a>
          {user ? (
            <>
              {user.role === "donor" ? (
                <>
                  <a href="/donor/dashboard" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
                  <a href="/donor/accepted" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Accepted Requests</a>
                  <a href="/donor/history" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Donation History</a>
                  <div className="pt-2">
                    <AvailabilityToggle initialAvailable={user.donor_profile?.is_available ?? true} />
                  </div>
                </>
              ) : (
                <>
                  <a href="/attendant/dashboard" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
                  <a href="/attendant/request/create" className="block py-2 text-sm font-semibold text-brand-primary" onClick={() => setMobileMenuOpen(false)}>Create Blood Request</a>
                  <a href="/attendant/connected" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Connected Donors</a>
                  <a href="/attendant/history" className="block py-2 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Request History</a>
                </>
              )}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-brand-navy">{user.full_name}</div>
                  <div className="text-[11px] text-slate-500 uppercase">{user.identifier || user.role}</div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <a href="/login" className="block text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Login</a>
              <a href="/register/donor" className="block text-center py-2 text-sm font-semibold text-white bg-brand-primary rounded-xl" onClick={() => setMobileMenuOpen(false)}>Register as Donor</a>
              <a href="/register/attendant" className="block text-center py-2 text-sm font-semibold text-brand-primary bg-brand-light rounded-xl" onClick={() => setMobileMenuOpen(false)}>Need Blood (Attendant)</a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
