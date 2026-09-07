// src/utils/auth.js
import { request } from "../api/client";

export async function login(credentials) {
  // credentials: { username, password }
  const data = await request("/api/token/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  // Expecting { access, refresh } from DRF SimpleJWT
  if (data.access) {
    localStorage.setItem("accessToken", data.access);
  }
  if (data.refresh) {
    localStorage.setItem("refreshToken", data.refresh);
  }

  return data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const data = await request("/api/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  });

  // Usually returns { access } or { access, refresh }
  if (data.access) {
    localStorage.setItem("accessToken", data.access);
  }
  if (data.refresh) {
    localStorage.setItem("refreshToken", data.refresh);
  }

  return data;
}

export async function logout(accessToken) {
  // Call backend logout if you have it
  await request("/api/logout/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => {
    // Ignore logout endpoint errors; still clear tokens locally
  });

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}