"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: "donor" | "attendant";
  account_status: string;
  donor_profile?: any;
  attendant_profile?: any;
  identifier?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (tokenData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const data = await apiRequest("/auth/me");
      const identifier = data.role === "donor" 
        ? data.donor_profile?.donor_id 
        : data.attendant_profile?.attendant_id;
      setUser({ ...data, identifier });
    } catch (err) {
      console.error("Failed to load profile", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (tokenData: any) => {
    localStorage.setItem("token", tokenData.access_token);
    setToken(tokenData.access_token);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
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
