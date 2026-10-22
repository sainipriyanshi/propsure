// src/api/cases.js
import { request } from "./client";

export function getCases() {
  return request("/api/cases/");
}

export function createCase(payload) {
  return request("/api/cases/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}