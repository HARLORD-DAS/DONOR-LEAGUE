"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Hospital3D, BloodDrop3D, MapPin3D } from "@/components/Icons3D";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/Map"), { ssr: false });

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = ["URGENT", "HIGH PRIORITY", "NORMAL"];

export default function CreateBloodRequestPage() {
  const router = useRouter();

  // Patient Info
  const [patientRef, setPatientRef] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [units, setUnits] = useState(1);
  const [urgency, setUrgency] = useState("URGENT");
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split("T")[0]);
  const [requiredTime, setRequiredTime] = useState("14:00");
  const [instructions, setInstructions] = useState("");

  // Hospital Info & OSM Coordinates (Default Bangalore Bowring Hospital)
  const [hospitalName, setHospitalName] = useState("Bowring & Lady Curzon Hospital");
  const [hospitalAddress, setHospitalAddress] = useState("Lady Curzon Rd, Shivaji Nagar, Bengaluru, Karnataka 560001");
  const [city, setCity] = useState("Bengaluru");
  const [district, setDistrict] = useState("Bengaluru Urban");
  const [state, setState] = useState("Karnataka");
  const [latitude, setLatitude] = useState(12.9780);
  const [longitude, setLongitude] = useState(12.9830);
  const [initialRadius, setInitialRadius] = useState(5.0);

  // OSM Search
  const [osmQuery, setOsmQuery] = useState("");
  const [osmResults, setOsmResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOsmSearch = async () => {
    if (!osmQuery.trim()) return;
    setSearching(true);
    try {
      const results = await apiRequest(`/geo/search?query=${encodeURIComponent(osmQuery)}`);
      setOsmResults(results);
    } catch (err: any) {
      console.error("OSM search error", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectHospital = (place: any) => {
    setHospitalName(place.display_name.split(",")[0]);
    setHospitalAddress(place.display_name);
    setLatitude(place.lat);
    setLongitude(place.lon);
    if (place.city) setCity(place.city);
    if (place.district) setDistrict(place.district);
    if (place.state) setState(place.state);
    setOsmResults([]);
    setOsmQuery("");
  };

  const handleMapPin = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        patient_reference: patientRef,
        required_blood_group: bloodGroup,
        units_required: Number(units),
        urgency,
        hospital_name: hospitalName,
        hospital_address: hospitalAddress,
        hospital_city: city,
        hospital_district: district,
        hospital_state: state,
        hospital_latitude: latitude,
        hospital_longitude: longitude,
        required_date: requiredDate,
        required_time: requiredTime,
        instructions,
        initial_search_radius_km: initialRadius,
      };

      const res = await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Redirect immediately to the Geographical Matching screen
      router.push(`/attendant/request/${res.id}/matching`);
    } catch (err: any) {
      setError(err.message || "Failed to submit blood request. Please check your fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border shadow-elevated">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <Hospital3D size={52} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
              Create Blood Request
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submit patient requirements and identify hospital coordinates to automatically discover nearby matching donors.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Patient & Medical Requirement */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-4">
              1. Patient & Medical Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name / Reference *</label>
                <input
                  type="text"
                  required
                  value={patientRef}
                  onChange={(e) => setPatientRef(e.target.value)}
                  placeholder="e.g. Patient Kumar / ICU-4B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required Blood Group *</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary font-bold text-red-600"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Units (1-10) *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level *</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary font-semibold"
                >
                  {URGENCY_LEVELS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required Date *</label>
                <input
                  type="date"
                  required
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required Time *</label>
                <input
                  type="time"
                  required
                  value={requiredTime}
                  onChange={(e) => setRequiredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Medical / Coordination Notes</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Specific ward, doctor in charge, or coordination instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Section 2: Hospital Location & OpenStreetMap */}
          <div className="pt-6 border-t border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-primary mb-1">
              2. Hospital Identification via OpenStreetMap
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              The confirmed hospital coordinates serve as the center point for automatic geographical donor discovery.
            </p>

            {/* Hospital Search */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search Hospital / Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={osmQuery}
                  onChange={(e) => setOsmQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleOsmSearch(); } }}
                  placeholder="e.g. Manipal Hospital HAL Airport Road, or Bowring Hospital"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-brand-border text-sm outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={handleOsmSearch}
                  disabled={searching}
                  className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-secondary disabled:opacity-60"
                >
                  {searching ? "Searching OSM..." : "Find Hospital"}
                </button>
              </div>

              {osmResults.length > 0 && (
                <div className="mt-2 bg-white border border-brand-border rounded-xl shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto z-20 relative">
                  {osmResults.map((r) => (
                    <div
                      key={r.place_id}
                      onClick={() => handleSelectHospital(r)}
                      className="p-3 hover:bg-brand-light cursor-pointer text-xs text-brand-navy"
                    >
                      <div className="font-bold">{r.display_name}</div>
                      <div className="text-[11px] text-slate-500">Coordinates: {r.lat}, {r.lon}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map for Hospital Marker */}
            <div className="mb-4">
              <InteractiveMap
                center={[latitude, longitude]}
                zoom={14}
                hospitalName={hospitalName}
                radiusKm={initialRadius}
                isSelectable={true}
                onLocationSelect={handleMapPin}
                height="320px"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
                <span>Confirmed Hospital Coordinates: <b>{latitude.toFixed(5)}, {longitude.toFixed(5)}</b></span>
                <span>Click map to fine-tune exact gate or entrance</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Address *</label>
                <input
                  type="text"
                  required
                  value={hospitalAddress}
                  onChange={(e) => setHospitalAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Search Radius (km)</label>
                <select
                  value={initialRadius}
                  onChange={(e) => setInitialRadius(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm font-bold text-brand-primary"
                >
                  <option value={5}>5 km (Standard Proximity)</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km (Expanded City)</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-brand-primary text-white font-bold shadow-3d hover:bg-brand-secondary transition-all disabled:opacity-60 text-base"
          >
            {loading ? "Registering Request & Initiating Matching..." : "Submit Blood Request & Discover Donors"}
          </button>
        </form>
      </div>
    </div>
  );
}
