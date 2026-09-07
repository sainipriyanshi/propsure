// src/api/documents.js
import { request } from "./client";

export function uploadDocument(formData) {
  return request("/api/documents/", {
    method: "POST",
    body: formData,
  });
}

export function analyzeDocument(formData) {
  return request("/api/analyze/", {
    method: "POST",
    body: formData,
  });
}