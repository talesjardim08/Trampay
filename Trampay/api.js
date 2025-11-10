// Trampay/api.js
const API_URL = "https://trampay-backend.onrender.com"; 

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : null;
    if (!res.ok) {
      const message = data?.message || (data?.error) || `Status ${res.status}`;
      throw new Error(message);
    }
    return data;
  } catch (err) {
    console.error("api error", err);
    throw err;
  }
}

export async function registerUser(payload) {
  return safeFetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload) {
  return safeFetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

/**
 * Forgot password — backend must expose POST /api/auth/forgot-password
 * payload: { email: string }
 * expected: { success: true } or { message: '...' }
 */
export async function forgotPassword(payload) {
  return safeFetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
