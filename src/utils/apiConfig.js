const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export function apiUrl(path) {
  // path should start with /
  return `${API_BASE}${path}`;
}