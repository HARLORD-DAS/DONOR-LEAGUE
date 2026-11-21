"use client";

import React from "react";

interface Icon3DProps {
  className?: string;
  size?: number;
}

// 1. 3D Blood Drop / Blood Donation Icon
export function BloodDrop3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="bloodDropFront" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="45%" stopColor="#EE1C24" />
          <stop offset="100%" stopColor="#990000" />
        </radialGradient>
        <filter id="shadow3d" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#B91C1C" floodOpacity="0.4" />
        </filter>
        <linearGradient id="dropHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M32 6C32 6 12 30 12 42C12 53.0457 20.9543 60 32 60C43.0457 60 52 53.0457 52 42C52 30 32 6 32 6Z"
        fill="url(#bloodDropFront)"
        filter="url(#shadow3d)"
      />
      <ellipse cx="26" cy="30" rx="6" ry="12" transform="rotate(-30 26 30)" fill="url(#dropHighlight)" />
      <path d="M28 48C30 52 34 52 36 48" stroke="#FFE4E6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 2. 3D Hospital Icon
export function Hospital3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="hospitalRoof" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id="hospitalWall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <filter id="hospShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#1E3A8A" floodOpacity="0.3" />
        </filter>
      </defs>
      <rect x="10" y="20" width="44" height="38" rx="6" fill="url(#hospitalWall)" filter="url(#hospShadow)" stroke="#BFDBFE" strokeWidth="2" />
      <path d="M6 22L32 8L58 22H6Z" fill="url(#hospitalRoof)" />
      <rect x="26" y="28" width="12" height="4" rx="2" fill="#EF4444" />
      <rect x="30" y="24" width="4" height="12" rx="2" fill="#EF4444" />
      <rect x="25" y="44" width="14" height="14" rx="3" fill="#1E3A8A" />
      <line x1="32" y1="44" x2="32" y2="58" stroke="#93C5FD" strokeWidth="1.5" />
    </svg>
  );
}

// 3. 3D Geographical Search & Map Pin
export function MapPin3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="pinBody" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#172554" />
        </radialGradient>
        <filter id="pinShadow">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#1D4ED8" floodOpacity="0.35" />
        </filter>
      </defs>
      <ellipse cx="32" cy="58" rx="14" ry="4" fill="#94A3B8" opacity="0.4" />
      <path
        d="M32 6C20.9543 6 12 14.9543 12 26C12 39 32 58 32 58C32 58 52 39 52 26C52 14.9543 43.0457 6 32 6Z"
        fill="url(#pinBody)"
        filter="url(#pinShadow)"
      />
      <circle cx="32" cy="24" r="8" fill="#FFFFFF" />
      <circle cx="32" cy="24" r="4" fill="#DC2626" />
    </svg>
  );
}

// 4. 3D Donor Registration Badge
export function DonorBadge3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="donorShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <filter id="badgeShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#1E40AF" floodOpacity="0.3" />
        </filter>
      </defs>
      <path
        d="M32 4L54 12V32C54 45.2 44.6 57.4 32 60C19.4 57.4 10 45.2 10 32V12L32 4Z"
        fill="url(#donorShield)"
        filter="url(#badgeShadow)"
      />
      <path d="M32 10L50 16.5V32C50 42.8 42.4 52.8 32 55.2C21.6 52.8 14 42.8 14 32V16.5L32 10Z" stroke="#93C5FD" strokeWidth="1.5" />
      <circle cx="32" cy="26" r="7" fill="#FFFFFF" />
      <path d="M22 46C22 39 26 36 32 36C38 36 42 39 42 46" fill="#FFFFFF" />
      <circle cx="44" cy="20" r="5" fill="#EF4444" />
      <path d="M44 18V22M42 20H46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 5. 3D Attendant / Requester Badge
export function AttendantBadge3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="attendantBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#attendantBg)" />
      <circle cx="32" cy="25" r="8" fill="#FFFFFF" />
      <path d="M20 47C20 40 25 37 32 37C39 37 44 40 44 47" fill="#FFFFFF" />
      <rect x="18" y="16" width="6" height="6" rx="2" fill="#F87171" />
    </svg>
  );
}

// 6. 3D WhatsApp Icon
export function WhatsApp3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="waBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25D366" />
          <stop offset="100%" stopColor="#128C7E" />
        </linearGradient>
        <filter id="waShadow">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#128C7E" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#waBg)" filter="url(#waShadow)" />
      <path
        d="M20 44L22.5 35C20.5 31.5 21 27 24 24C28 20 34 20 38 24C42 28 42 34 38 38C34.5 41.5 29.5 41.5 26 40L20 44Z"
        fill="#FFFFFF"
      />
      <path
        d="M27 28C26.5 27 25.5 27 25 27C24.5 27 24 27.5 24 28C24 30 26 33.5 28.5 35.5C31 37.5 34.5 38.5 36.5 38C37.5 37.5 38 36.5 38 36C38 35.5 37.5 35 36.5 34.5L34 33.5C33.5 33.5 33 33.5 32.5 34L31.5 35C31 35 30.5 34.5 29.5 34C28.5 33 27.5 32 27 31L28 30C28.5 29.5 28.5 29 28.5 28.5L27 28Z"
        fill="#128C7E"
      />
    </svg>
  );
}

// 7. 3D Emergency Siren / Alert
export function Emergency3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="emergencyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>
      <path d="M32 8L56 50H8L32 8Z" fill="url(#emergencyGlow)" rx="6" />
      <path d="M32 20V34" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="42" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

// 8. 3D Success Checked Badge
export function Success3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="succGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>
        <filter id="succShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#059669" floodOpacity="0.4" />
        </filter>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#succGrad)" filter="url(#succShadow)" />
      <path d="M20 33L28 41L44 23" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 9. 3D Connected Phone / Call
export function Call3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="callGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#callGrad)" />
      <path
        d="M22 24C22 36 28 42 40 42L43 37L37 33L34 35C30 33 29 31 29 27L31 24L27 18L22 24Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 10. 3D Compass / OpenStreetMap Exploration
export function Compass3D({ className = "", size = 48 }: Icon3DProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="compassBg" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#compassBg)" stroke="#38BDF8" strokeWidth="2" />
      <polygon points="32,14 37,32 32,30 27,32" fill="#EF4444" />
      <polygon points="32,50 37,32 32,30 27,32" fill="#CBD5E1" />
      <circle cx="32" cy="31" r="3" fill="#FFFFFF" />
    </svg>
  );
}
