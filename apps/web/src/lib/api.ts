import { API_URL } from "./constants";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("dk_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("dk_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("dk_token");
    localStorage.removeItem("dk_user");
    localStorage.removeItem("dk_api_key");
  }

  getToken() {
    return this.token;
  }

  async fetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    // Only redirect on 401 for non-auth endpoints (auth endpoints show their own errors)
    if (res.status === 401 && !path.startsWith("/auth/")) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return res;
  }

  async post(path: string, body: unknown) {
    return this.fetch(path, { method: "POST", body: JSON.stringify(body) });
  }

  async get(path: string) {
    return this.fetch(path);
  }
}

export const api = new ApiClient();
