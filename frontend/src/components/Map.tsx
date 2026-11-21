"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface MapDonorMarker {
  id: number;
  lat: number;
  lon: number;
  label: string;
  bloodGroup: string;
  distanceKm: number;
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  radiusKm?: number;
  hospitalName?: string;
  donors?: MapDonorMarker[];
  isSelectable?: boolean;
  onLocationSelect?: (lat: number, lon: number) => void;
  height?: string;
}

export default function InteractiveMap({
  center,
  zoom = 13,
  radiusKm,
  hospitalName,
  donors = [],
  isSelectable = false,
  onLocationSelect,
  height = "420px",
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const donorMarkersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      donorMarkersRef.current = L.layerGroup().addTo(map);

      if (isSelectable && onLocationSelect) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onLocationSelect(lat, lng);
        });
      }
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    const map = mapInstanceRef.current;

    // Custom Hospital Pin Icon
    const hospitalIcon = L.divIcon({
      className: "custom-hospital-icon",
      html: `
        <div style="background: linear-gradient(135deg, #1E40AF 0%, #155EEF 100%); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(21, 94, 239, 0.4); border: 3px solid #FFFFFF;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });

    // Update Hospital Marker
    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.setLatLng(center);
    } else {
      hospitalMarkerRef.current = L.marker(center, { icon: hospitalIcon, draggable: isSelectable })
        .addTo(map)
        .bindPopup(`<b>${hospitalName || "Hospital Location"}</b><br/>Lat: ${center[0].toFixed(4)}, Lon: ${center[1].toFixed(4)}`);

      if (isSelectable && onLocationSelect) {
        hospitalMarkerRef.current.on("dragend", (event) => {
          const marker = event.target;
          const pos = marker.getLatLng();
          onLocationSelect(pos.lat, pos.lng);
        });
      }
    }

    // Update Search Radius Circle
    if (radiusKm) {
      const radiusMeters = radiusKm * 1000;
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng(center);
        radiusCircleRef.current.setRadius(radiusMeters);
      } else {
        radiusCircleRef.current = L.circle(center, {
          radius: radiusMeters,
          color: "#155EEF",
          fillColor: "#3B82F6",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "6, 6",
        }).addTo(map);
      }
    } else if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    // Update Donor Pins
    if (donorMarkersRef.current) {
      donorMarkersRef.current.clearLayers();
      donors.forEach((d) => {
        const donorIcon = L.divIcon({
          className: "custom-donor-icon",
          html: `
            <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45); border: 2.5px solid #FFFFFF; color: #FFFFFF; font-weight: bold; font-size: 11px;">
              ${d.bloodGroup}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const m = L.marker([d.lat, d.lon], { icon: donorIcon }).bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <b style="color: #14213D;">${d.label}</b><br/>
            <span style="color: #DC2626; font-weight: 600;">Blood: ${d.bloodGroup}</span><br/>
            <span>Distance: <b>${d.distanceKm} km</b></span><br/>
            <small style="color: #64748B;">Approximate location for privacy</small>
          </div>
        `);
        donorMarkersRef.current?.addLayer(m);
      });
    }

    return () => {
      // Clean up on component unmount
    };
  }, [center, zoom, radiusKm, hospitalName, donors, isSelectable]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-brand-border shadow-card bg-slate-100">
      <div ref={mapContainerRef} style={{ height }} className="w-full" />
      {isSelectable && (
        <div className="absolute top-3 left-12 z-[400] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-brand-border text-xs font-medium text-brand-navy">
          Click map or drag pin to position hospital location
        </div>
      )}
    </div>
  );
}
