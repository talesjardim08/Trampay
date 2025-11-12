// Trampay/services/UsersService.js
import api from "./api";

export async function getProfile() {
  const resp = await api.get("/auth/profile");
  return resp.data;
}

export async function updateProfile(payload) {
  // ajusta rota se necessário (PUT /users ou /auth/profile)
  const resp = await api.put("/users", payload);
  return resp.data;
}
