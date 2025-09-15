export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/,'')
  ?? '';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, { credentials: "include", ...init });
}
