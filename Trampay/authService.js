// project/Trampay-main/Trampay/authService.js
// src/screens/authService.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://trampay.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

async function saveToken(token) {
  try {
    await AsyncStorage.setItem("token", token);
    console.log("[Auth] Token salvo com sucesso.");
  } catch (err) {
    console.error("Erro ao salvar token:", err);
  }
}

export async function clearLocalCache() {
  try {
    await AsyncStorage.multiRemove([
      "transactions",
      "balance",
      "lastSync",
      "outbox",
      "trampay_transactions",
      "trampay_balance",
      "trampay_transactions_outbox",
      "userEvents",
    ]);
    console.log("[Auth] Cache local limpo após novo login.");
  } catch (err) {
    console.error("[Auth] Falha ao limpar cache:", err);
  }
}

export async function login(email, senha) {
  try {
    const response = await api.post("/auth/login", {
      email: email,
      password: senha,
    });

    if (!response.data || !response.data.token) {
      throw new Error("Token inválido retornado pelo servidor.");
    }

    await saveToken(response.data.token);

    await clearLocalCache();

    console.log("[Auth] Login realizado com sucesso. Cache limpo.");
    return response.data;
  } catch (error) {
    console.error("❌ Erro no login:", error.response?.data || error.message);
    const err = new Error(
      error.response?.data?.error || error.response?.data?.message || error.message || "Falha ao entrar"
    );
    err.response = error.response;
    throw err;
  }
}

export async function registerUser(userData) {
  const payload = {
    name: userData.DisplayName || userData.LegalName || userData.Name || "",
    email: userData.Email,
    password: userData.Senha || userData.password,
    phone: userData.Phone || "",
    confirmPassword: userData.confirmPassword || userData.Senha || userData.password,
    accountType: userData.AccountType || 'pf',
    documentType: userData.DocumentType || (userData.AccountType === 'pj' ? 'CNPJ' : 'CPF'),
    documentNumber: userData.DocumentNumber || '',
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

export async function getUserProfile() {
  try {
    const token = await AsyncStorage.getItem("token");
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

export async function logout() {
  try {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.multiRemove([
      "transactions",
      "balance",
      "lastSync",
      "outbox",
      "userProfile",
      "someOtherKeyIfExists"
    ]);
    console.log("[Auth] Logout completo e cache limpo.");
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
}

export default api;