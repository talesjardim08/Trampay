import api from "./services/api";
export async function getProfile() { const resp = await api.get("/auth/profile"); return resp.data; }
export async function updateProfile(payload) { const resp = await api.put("/auth/profile", payload); return resp.data; }