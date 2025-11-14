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
    return response.data;
  } catch (error) {
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

  try {
    const res = await api.post("/auth/register", payload);
    return { success: true, data: res.data };
  } catch (err) {
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
      return null;
    }

    let resp;
    try {
      resp = await api.get("/users/me", { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      try {
        resp = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      } catch (err2) {
        resp = await api.get("/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
      }
    }

    const raw = resp?.data || {};
    const profile = {
      id: raw.id || raw.Id,
      displayName: raw.display_name || raw.displayName || raw.name || "",
      email: raw.email || "",
      phone: raw.phone || "",
      isPro: !!(raw.is_premium || raw.isPremium || raw.isPro),
      createdAt: raw.created_at || raw.createdAt || null,
    };

    return profile;
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
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
}

export default api;