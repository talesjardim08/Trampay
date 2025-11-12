// Trampay/services/ServicesService.js
import api from "./services/api";

export async function listServices(params = {}) {
  // params: { ownerId, page, perPage }
  const q = new URLSearchParams(params).toString();
  const resp = await api.get(`/services${q ? `?${q}` : ""}`);
  return resp.data;
}

export async function getService(id) {
  const resp = await api.get(`/services/${id}`);
  return resp.data;
}

export async function createService(payload) {
  const resp = await api.post("/services", payload);
  return resp.data;
}
