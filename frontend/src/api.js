const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("ph_token");
}
export function setSession(token, user) {
  localStorage.setItem("ph_token", token);
  localStorage.setItem("ph_user", JSON.stringify(user));
}
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("ph_user"));
  } catch {
    return null;
  }
}
export function logout() {
  localStorage.removeItem("ph_token");
  localStorage.removeItem("ph_user");
}

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}
