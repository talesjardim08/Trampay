// src/screens/authService.js
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------------------------------------
// 🔧 Configuração da API
// ---------------------------------------------
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------
// 🔒 Armazena token com segurança
// ---------------------------------------------
async function saveToken(token) {
  try {
    await SecureStore.setItemAsync("token", token);
    console.log("[Auth] Token salvo com sucesso.");
  } catch (err) {
    console.error("Erro ao salvar token:", err);
  }
}

// ---------------------------------------------
// 🧹 Limpa todo cache local após novo login
// ---------------------------------------------
export async function clearLocalCache() {
  try {
    await AsyncStorage.multiRemove([
      "transactions",
      "balance",
      "lastSync",
      "outbox",
    ]);
    console.log("[Auth] Cache local limpo após novo login.");
  } catch (err) {
    console.error("[Auth] Falha ao limpar cache:", err);
  }
}

// ---------------------------------------------
// 🔑 LOGIN
// ---------------------------------------------
export async function login(email, senha) {
  try {
    const response = await api.post("/auth/login", {
      email: email,
      senha: senha,
    });

    if (!response.data || !response.data.token) {
      throw new Error("Token inválido retornado pelo servidor.");
    }

    await saveToken(response.data.token);

    // 🧹 limpa cache antes de continuar
    await clearLocalCache();

    console.log("[Auth] Login realizado com sucesso. Cache limpo.");
    return response.data;
  } catch (error) {
    console.error("❌ Erro no login:", error.response?.data || error.message);
    throw error;
  }
}

// ---------------------------------------------
// 🧾 REGISTRO
// ---------------------------------------------
export async function registerUser(userData) {
  const payload = {
    accountType: userData.AccountType,
    documentType: userData.DocumentType,
    documentNumber: userData.DocumentNumber,
    legalName: userData.LegalName,
    displayName: userData.DisplayName,
    birthDate: userData.BirthDate,
    email: userData.Email,
    phone: userData.Phone,
    addressStreet: userData.AddressStreet,
    addressNumber: userData.AddressNumber,
    addressComplement: userData.AddressComplement,
    addressNeighborhood: userData.AddressNeighborhood,
    addressCity: userData.AddressCity,
    addressState: userData.AddressState,
    addressZip: userData.AddressZip,
    senha: userData.Senha || userData.password,
  };

  console.log("📦 Enviando payload:", payload);

  try {
    const res = await api.post("/auth/register", payload);
    console.log("✅ Registro concluído com sucesso:", res.data);
    return { success: true, data: res.data };
  } catch (err) {
    console.error("❌ Erro no registro:", err.response?.data || err.message);
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Falha ao criar conta.";
    return { success: false, message: msg };
  }
}

// ---------------------------------------------
// 🔄 ESQUECI SENHA
// ---------------------------------------------
export async function forgotPassword(payload) {
  try {
    const response = await api.post("/auth/forgot-password", payload);
    return {
      success: true,
      message:
        response.data?.message || "E-mail de redefinição enviado com sucesso.",
    };
  } catch (error) {
    console.error("Erro no esqueci senha:", error.response?.data || error.message);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Não foi possível enviar o e-mail de recuperação.",
    };
  }
}

// ---------------------------------------------
// 👤 PERFIL (verifica token e busca dados do usuário)
// ---------------------------------------------
export async function getUserProfile() {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      console.warn("[Auth] Nenhum token encontrado. Usuário não autenticado.");
      return null;
    }

    const response = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("[Auth] Perfil obtido do servidor:", response.data?.email);
    return response.data;
  } catch (error) {
    console.error("Erro ao obter perfil:", error.response?.data || error.message);
    return null;
  }
}

// ---------------------------------------------
// 🚪 LOGOUT
// ---------------------------------------------
export async function logout() {
  try {
    await SecureStore.deleteItemAsync("token");
    // Limpa AsyncStorage chave a chave (remover userProfile também)
    await AsyncStorage.multiRemove([
      "transactions",
      "balance",
      "lastSync",
      "outbox",
      "userProfile",
      "someOtherKeyIfExists" // adicione outras chaves usadas pelo app
    ]);
    console.log("[Auth] Logout completo e cache limpo.");
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
}

// ---------------------------------------------
// Exporta API para uso geral
// ---------------------------------------------
export default api;
