// Trampay/services/SchedulesService.js
import api from "./services/api";

export async function listSchedules(params = {}) {
  const q = new URLSearchParams(params).toString();
  const resp = await api.get(`/scheduling${q ? `?${q}` : ""}`);
  return resp.data;
}

export async function createSchedule(payload) {
  const resp = await api.post("/scheduling", payload);
  return resp.data;
}
