function getApiBase(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  // Local development uses the separately running FastAPI service.
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://127.0.0.1:8000/api/v1";
  }

  // Default to deployed Render backend API
  return "https://donor-league-api.onrender.com/api/v1";
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const base = getApiBase();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(`${base}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = "";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      try {
        const text = await res.text();
        errorDetail = text || `Request failed with status ${res.status}: ${res.statusText}`;
      } catch {
        errorDetail = `Request failed with status ${res.status}: ${res.statusText}`;
      }
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
