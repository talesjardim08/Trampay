// src/screens/authService.js
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: "https://trampay.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// 🔒 Armazena token com segurança
async function saveToken(token) {
  try {
    await SecureStore.setItemAsync("token", token);
  } catch (err) {
    console.error("Erro ao salvar token:", err);
  }
}

// 🔑 LOGIN
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
    return response.data;
  } catch (error) {
    console.error("Erro no login:", error.response?.data || error.message);
    throw error;
  }
}

// 🧾 REGISTRO
export async function registerUser(userData) {
  // 🔥 Corrige campos para o formato esperado pelo backend
  const payload = {
    accountType: userData.AccountType,
    documentType: userData.DocumentType,
    documentNumber: userData.DocumentNumber,
    legalName: userData.LegalName,
    displayName: userData.DisplayName,
    birthDate: userData.BirthDate,
    email: userData.Email,        // <- minúsculo
    phone: userData.Phone,
    addressStreet: userData.AddressStreet,
    addressNumber: userData.AddressNumber,
    addressComplement: userData.AddressComplement,
    addressNeighborhood: userData.AddressNeighborhood,
    addressCity: userData.AddressCity,
    addressState: userData.AddressState,
    addressZip: userData.AddressZip,
    senha: userData.Senha || userData.password    // <- minúsculo e campo correto
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
  
  
  console.log("📦 Enviando payload:", payload);

  const res = await api.post("/auth/register", payload);
  return res.data;
}




// 🔄 ESQUECI SENHA
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

// 👤 PERFIL (verifica token)
export async function getUserProfile() {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) return null;

    const response = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao obter perfil:", error.response?.data || error.message);
    return null;
  }
}

// 🚪 LOGOUT
export async function logout() {
  try {
    await SecureStore.deleteItemAsync("token");
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
}
