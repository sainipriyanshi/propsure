// src/api/client.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function doRefresh() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const url = `${API_BASE}/api/token/refresh/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (data.access) {
    localStorage.setItem("accessToken", data.access);
  }
  if (data.refresh) {
    localStorage.setItem("refreshToken", data.refresh);
  }

  return data;
}

let refreshPromise = null;

export async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  let accessToken = localStorage.getItem("accessToken");
  const headers = {
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh once
  if (res.status === 401 && accessToken && localStorage.getItem("refreshToken")) {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh()
          .then((data) => {
            refreshPromise = null;
            return data;
          })
          .catch((err) => {
            refreshPromise = null;
            throw err;
          });
      }

      await refreshPromise;
      accessToken = localStorage.getItem("accessToken");

      // Retry the original request with the new token
      const newHeaders = { ...headers };
      if (accessToken) {
        newHeaders["Authorization"] = `Bearer ${accessToken}`;
      }

      res = await fetch(url, {
        ...options,
        headers: newHeaders,
      });
    } catch (refreshError) {
      // Refresh failed: clear tokens and throw
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}