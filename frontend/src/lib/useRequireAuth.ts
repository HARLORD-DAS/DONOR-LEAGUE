"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useRequireAuth(allowedRole?: "donor" | "attendant" | "pending") {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      // If pending user tries to access role-specific page
      if (user.role === "pending") {
        if (allowedRole !== "pending") {
          router.push("/select-role");
        }
        return;
      }

      // If donor tries to access attendant-only page
      if (user.role === "donor" && allowedRole === "attendant") {
        router.push(user.profile_completed ? "/donor/dashboard" : "/register/donor");
        return;
      }

      // If attendant tries to access donor-only page
      if (user.role === "attendant" && allowedRole === "donor") {
        router.push(user.profile_completed ? "/attendant/dashboard" : "/register/attendant");
        return;
      }

      // If user profile is not completed
      if (allowedRole === "donor" && !user.profile_completed) {
        router.push("/register/donor");
        return;
      }
      if (allowedRole === "attendant" && !user.profile_completed) {
        router.push("/register/attendant");
        return;
      }
    }
  }, [user, loading, allowedRole, router]);

  return { user, loading };
}
