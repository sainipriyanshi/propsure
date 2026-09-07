// src/api/cases.js
import { request } from "./client";

export function createCase(payload) {
  return request("/api/cases/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}