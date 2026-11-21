"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { BloodDrop3D } from "@/components/Icons3D";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/Map"), { ssr: false });

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorRegistrationPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "pending") {
        router.push("/select-role");
      } else if (user.role === "attendant") {
        router.push("/attendant/dashboard");
      } else if (user.role === "donor" && user.profile_completed) {
        router.push("/donor/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Donor-specific form state (account credentials retrieved automatically from user)
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [bloodGroup, setBloodGroup] = useState("O+");

  // Location State
  const [state, setState] = useState("Karnataka");
  const [district, setDistrict] = useState("Bengaluru Urban");
  const [city, setCity] = useState("Bengaluru");
  const [area, setArea] = useState("Indiranagar");
  const [residentialAddress, setResidentialAddress] = useState("100 Feet Rd, Indiranagar");
  const [latitude, setLatitude] = useState(12.9784);
  const [longitude, setLongitude] = useState(77.6408);
  const [locationSource, setLocationSource] = useState("osm_geocode");

  // OSM Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Consents
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [smsConsent, setSmsConsent] = useState(true);
  const [termsConsent, setTermsConsent] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nominatim Search
  const handleOsmSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await apiRequest(`/geo/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch (err: any) {
      console.error("OSM Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  const selectOsmPlace = (place: any) => {
    setLatitude(place.lat);
    setLongitude(place.lon);
    if (place.city) setCity(place.city);
    if (place.district) setDistrict(place.district);
    if (place.state) setState(place.state);
    if (place.suburb) setArea(place.suburb);
    setResidentialAddress(place.display_name);
    setLocationSource("osm_geocode");
    setSearchResults([]);
    setSearchQuery("");
  };

  // GPS Device Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationSource("gps");
      },
      () => {
        alert("GPS detection permission denied or unavailable.");
      }
    );
  };

  const handleMapPin = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationSource("map_pin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dob) {
      setError("Please provide your date of birth.");
      return;
    }

    if (!termsConsent) {
      setError("Please accept the terms and privacy consent to proceed.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        date_of_birth: dob,
        gender,
        blood_group: bloodGroup,
        state,
        district,
        city,
        area,
        residential_address: residentialAddress,
        latitude,
        longitude,
        location_source: locationSource,
        whatsapp_consent: whatsappConsent,
        sms_consent: smsConsent,
        terms_consent: termsConsent,
      };

      const res = await apiRequest("/auth/complete-profile/donor", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await refreshUser();

      // Redirect to confirmed Successful Registration screen
      router.push(
        `/register/donor/success?id=${encodeURIComponent(res.identifier)}&name=${encodeURIComponent(user?.full_name || "")}&blood=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city)}`
      );
    } catch (err: any) {
      setError(err.message || "Donor registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 font-medium text-sm">Loading donor registration...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <BloodDrop3D size={52} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
              Complete Donor Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Provide your medical and location details to receive urgent blood request notifications in your vicinity.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Authenticated Account Summary (No re-entering credentials) */}
          <div className="bg-brand-bg rounded-2xl p-5 border border-brand-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3">
              1. Verified Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Full Name</span>
                <span className="text-sm font-bold text-brand-navy">{user.full_name}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Mobile Number</span>
                <span className="text-sm font-bold text-brand-navy">{user.phone}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Email Address</span>
                <span className="text-sm font-bold text-brand-navy">{user.email}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200/60">
              Account credentials securely linked. You do not need to re-enter your password.
            </p>
          </div>

          {/* Section 2: Donor Specific Information */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-4">
              2. Blood Group & Medical Eligibility
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group *</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary font-bold text-red-600 bg-white"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender (Optional)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Location & OpenStreetMap */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand-primary">
                  3. Geographical Location &amp; Privacy
                </h2>
                <p className="text-xs text-slate-500">
                  Your coordinates are used strictly for proximity calculations. Exact residential addresses are never revealed to attendants.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-semibold text-brand-navy hover:bg-brand-light transition-colors self-start"
              >
                Use GPS Current Location
              </button>
            </div>

            {/* Nominatim Search Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search Locality via OpenStreetMap</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleOsmSearch(); } }}
                  placeholder="Search landmark, neighborhood, or city (e.g. Indiranagar, Bengaluru)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={handleOsmSearch}
                  disabled={searching}
                  className="px-4 py-2.5 bg-brand-navy text-white text-xs font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-60"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-brand-border rounded-xl shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto z-20 relative">
                  {searchResults.map((r) => (
                    <div
                      key={r.place_id}
                      onClick={() => selectOsmPlace(r)}
                      className="p-2.5 hover:bg-brand-light cursor-pointer text-xs text-brand-navy"
                    >
                      <div className="font-semibold">{r.display_name}</div>
                      <div className="text-[11px] text-slate-500">Lat: {r.lat}, Lon: {r.lon}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map Picker */}
            <div className="mb-4">
              <InteractiveMap
                center={[latitude, longitude]}
                zoom={14}
                isSelectable={true}
                onLocationSelect={handleMapPin}
                height="280px"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
                <span>Selected Coordinates: <b>{latitude.toFixed(5)}, {longitude.toFixed(5)}</b> (Source: {locationSource})</span>
                <span>Click map to fine-tune location</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address (Kept Confidential) *</label>
              <input
                type="text"
                required
                value={residentialAddress}
                onChange={(e) => setResidentialAddress(e.target.value)}
                placeholder="Door/Flat No, Apartment, Street"
                className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
              />
            </div>
          </div>

          {/* Section 4: Consents */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-2">
              4. Notifications &amp; Consent
            </h2>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-primary rounded border-slate-300"
              />
              <span className="text-xs text-slate-600">
                <b>WhatsApp Alert Consent:</b> I consent to receive urgent blood request notifications matching my blood group and location via Meta WhatsApp Business API.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-primary rounded border-slate-300"
              />
              <span className="text-xs text-slate-600">
                <b>SMS Alert Consent:</b> I consent to receive emergency SMS backup alerts when blood requests are issued in my vicinity.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-primary rounded border-slate-300"
              />
              <span className="text-xs text-slate-600">
                I agree to the <a href="/terms" target="_blank" className="text-brand-primary underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-brand-primary underline">Privacy Policy</a>. I understand that medical suitability is determined exclusively by certified healthcare professionals.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-brand-primary text-white font-bold shadow-3d hover:bg-brand-secondary transition-all disabled:opacity-60 text-base"
          >
            {loading ? "Registering & Persisting Donor Profile..." : "Complete Donor Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
