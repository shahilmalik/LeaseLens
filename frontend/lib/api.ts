import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL });

/**
 * Read the persisted Zustand state directly from localStorage.
 * Returns null if not available (SSR, parse error, etc.)
 */
function getPersistedAuth(): { access: string | null; language: string | null } {
  if (typeof window === "undefined") return { access: null, language: null };
  try {
    const raw = localStorage.getItem("leaselens-auth");
    const stored = raw ? JSON.parse(raw) : null;
    return {
      access: stored?.state?.access ?? null,
      language: stored?.state?.language ?? null,
    };
  } catch {
    return { access: null, language: null };
  }
}

// Attach token + language to every request automatically.
api.interceptors.request.use((config) => {
  const { access, language } = getPersistedAuth();
  if (access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  if (language && !config.headers["Accept-Language"]) {
    config.headers["Accept-Language"] = language;
  }
  return config;
});

// On 401, wipe stale auth and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem("leaselens-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("leaselens-auth");
  }
}
