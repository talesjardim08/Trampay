// Trampay/services/TransactionsService.js
import api from "./api";

export async function listTransactions(query = {}) {
  const q = new URLSearchParams(query).toString();
  const resp = await api.get(`/transactions${q ? `?${q}` : ""}`);
  return resp.data;
}

export async function createTransaction(payload) {
  const resp = await api.post("/transactions", payload);
  return resp.data;
}
