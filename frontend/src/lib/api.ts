/// <reference types="vite/client" />

export const API_BASE =
  (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_BASE?.replace(/\/+$/,'')
  ?? '';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, { credentials: "include", ...init });
}
