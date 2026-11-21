"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";

interface AvailabilityToggleProps {
  initialAvailable: boolean;
  onToggleSuccess?: (newStatus: boolean) => void;
}

export function AvailabilityToggle({ initialAvailable, onToggleSuccess }: AvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggle = async () => {
    const nextStatus = !isAvailable;
    setIsAvailable(nextStatus); // Optimistic UI update
    setLoading(true);
    setFeedback(null);

    try {
      const res = await apiRequest("/donors/availability", {
        method: "PATCH",
        body: JSON.stringify({ is_available: nextStatus }),
      });
      setFeedback(res.message);
      if (onToggleSuccess) onToggleSuccess(nextStatus);
    } catch (err: any) {
      setIsAvailable(!nextStatus); // Revert on error
      setFeedback(err.message || "Failed to update availability status.");
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
            isAvailable ? "bg-emerald-500" : "bg-slate-300"
          } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isAvailable ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
        <span className={`text-sm font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
          isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}>
          {isAvailable ? "Available" : "Not Available"}
        </span>
      </div>
      {feedback && (
        <p className="text-xs font-medium text-brand-primary animate-fade-in">
          {feedback}
        </p>
      )}
    </div>
  );
}
