// Trampay/UsersService.js
import api from "./api";

export async function getProfile() {
  const resp = await api.get("/auth/me");
  return resp.data;
}

export async function updateProfile(payload) {
  const resp = await api.put("/auth/profile", payload);
  return resp.data;
}
