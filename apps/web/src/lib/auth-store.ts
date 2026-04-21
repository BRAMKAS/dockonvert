import { create } from "zustand";
import { api } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
  email_verified: number;
}

interface AuthState {
  user: User | null;
  apiKey: string | null;
  loading: boolean;
  error: string | null;
  register: (name: string, email: string, password: string, acceptedTerms: boolean) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => void;
  forgotPassword: (email: string) => Promise<string>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  apiKey: null,
  loading: false,
  error: null,

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("dk_user");
    const apiKey = localStorage.getItem("dk_api_key");
    if (userStr) {
      try {
        set({ user: JSON.parse(userStr), apiKey });
      } catch {
        // corrupted storage
      }
    }
  },

  register: async (name, email, password, acceptedTerms) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/register", { name, email, password, accepted_terms: acceptedTerms });
      if (!res.ok) {
        const data = await res.json();
        set({ loading: false, error: data.detail || "Registration failed" });
        return false;
      }
      const data = await res.json();
      api.setToken(data.token);
      localStorage.setItem("dk_user", JSON.stringify(data.user));
      if (data.api_key) localStorage.setItem("dk_api_key", data.api_key);
      set({ user: data.user, apiKey: data.api_key, loading: false });
      return true;
    } catch {
      set({ loading: false, error: "Network error" });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      if (!res.ok) {
        const data = await res.json();
        set({ loading: false, error: data.detail || "Login failed" });
        return false;
      }
      const data = await res.json();
      api.setToken(data.token);
      localStorage.setItem("dk_user", JSON.stringify(data.user));
      set({ user: data.user, loading: false });
      return true;
    } catch {
      set({ loading: false, error: "Network error" });
      return false;
    }
  },

  logout: () => {
    api.clearToken();
    set({ user: null, apiKey: null });
  },

  forgotPassword: async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    const data = await res.json();
    return data.message;
  },
}));
