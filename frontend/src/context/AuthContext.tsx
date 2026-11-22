"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: "pending" | "donor" | "attendant";
  account_status: string;
  profile_completed: boolean;
  donor_profile?: any;
  attendant_profile?: any;
  identifier?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (tokenData: any) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  selectRole: (role: "donor" | "attendant") => Promise<{ status: string; role: string; access_token?: string }>;
  getPostAuthRedirect: (customUser?: AuthUser | null) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (): Promise<AuthUser | null> => {
    try {
      const data = await apiRequest("/auth/me");
      const identifier = data.role === "donor"
        ? data.donor_profile?.donor_id
        : data.role === "attendant" ? data.attendant_profile?.attendant_id : "";

      const updatedUser: AuthUser = {
        ...data,
        identifier: identifier || "",
        profile_completed: Boolean(data.profile_completed),
      };
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error("Failed to load authenticated profile", err);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      void fetchProfile();
    } else {
      setLoading(false);
    }
    // Run once when the provider mounts to restore the persisted session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (tokenData: any): Promise<AuthUser> => {
    if (!tokenData?.access_token) {
      throw new Error("Authentication succeeded without an access token. Please try again.");
    }

    localStorage.setItem("token", tokenData.access_token);
    setToken(tokenData.access_token);
    const updated = await fetchProfile();
    if (!updated) {
      throw new Error("Your account was created, but we could not load your profile. Please sign in again.");
    }
    return updated;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async (): Promise<AuthUser | null> => fetchProfile();

  const selectRole = async (role: "donor" | "attendant") => {
    const res = await apiRequest("/auth/select-role", {
      method: "POST",
      body: JSON.stringify({ role }),
    });

    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      setToken(res.access_token);
    }
    await fetchProfile();
    return res;
  };

  const getPostAuthRedirect = (customUser?: AuthUser | null): string => {
    const targetUser = customUser !== undefined ? customUser : user;
    if (!targetUser) return "/login";
    if (targetUser.role === "pending") return "/select-role";
    if (targetUser.role === "donor") {
      return targetUser.profile_completed ? "/donor/dashboard" : "/register/donor";
    }
    if (targetUser.role === "attendant") {
      return targetUser.profile_completed ? "/attendant/dashboard" : "/register/attendant";
    }
    return "/";
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
      selectRole,
      getPostAuthRedirect,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
