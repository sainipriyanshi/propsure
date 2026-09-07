import { mockCases } from "../data/mockCases";

export function fetchCases() {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockCases), 300);
  });
}