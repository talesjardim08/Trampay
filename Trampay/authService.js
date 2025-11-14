import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://trampay.onrender.com/api';
const api = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json" } });
async function saveToken(token) { try { await AsyncStorage.setItem("token", token); } catch (err) { } }
export async function clearLocalCache() {
  try { await AsyncStorage.multiRemove(["transactions","balance","lastSync","outbox"]); } catch (err) { }
}
export async function login(email, senha) {
  try {
    const response = await api.post("/auth/login", { email: email, senha: senha });
    if (!response.data || !response.data.token) { throw new Error("Token inválido retornado pelo servidor."); }
    await saveToken(response.data.token);
    await clearLocalCache();
    return response.data;
  } catch (error) { throw error; }
}
export async function registerUser(userData) {
  const payload = {
    accountType: userData.AccountType, documentType: userData.DocumentType, documentNumber: userData.DocumentNumber,
    legalName: userData.LegalName, displayName: userData.DisplayName, birthDate: userData.BirthDate, email: userData.Email,
    phone: userData.Phone, addressStreet: userData.AddressStreet, addressNumber: userData.AddressNumber,
    addressComplement: userData.AddressComplement, addressNeighborhood: userData.AddressNeighborhood,
    addressCity: userData.AddressCity, addressState: userData.AddressState, addressZip: userData.AddressZip,
    senha: userData.Senha || userData.password,
  };
  try { const res = await api.post("/auth/register", payload); return { success: true, data: res.data }; }
  catch (err) {
    const msg = err.response?.data?.error || err.response?.data?.message || "Falha ao criar conta.";
    return { success: false, message: msg };
  }
}
export async function forgotPassword(payload) {
  try { const response = await api.post("/auth/forgot-password", payload); return { success: true, message: response.data?.message || "E-mail de redefinição enviado com sucesso." }; }
  catch (error) { return { success: false, message: error.response?.data?.message || "Não foi possível enviar o e-mail de recuperação." }; }
}
export async function getUserProfile() {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) { return null; }
    const response = await api.get("/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (error) { return null; }
}
export async function logout() {
  try {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.multiRemove(["transactions","balance","lastSync","outbox","userProfile","someOtherKeyIfExists"]);
  } catch (error) { }
}
export default api;