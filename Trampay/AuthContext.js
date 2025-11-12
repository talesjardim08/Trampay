// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { getUserProfile, login, logout, registerUser } from "./authService";
import { Alert } from "react-native";

// ---------------------------------------------
// 🧭 Contexto de Autenticação
// ---------------------------------------------
export const AuthContext = createContext();

// ---------------------------------------------
// ⚙️ Provedor de Autenticação
// ---------------------------------------------
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------
  // 🔁 Verifica login automático ao iniciar o app
  // ---------------------------------------------
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          console.log("[AuthContext] Token encontrado, obtendo perfil...");
          const profile = await getUserProfile();
          if (profile) {
            setUser(profile);
            setIsPro(profile.isPro || false);
          }
        } else {
          console.log("[AuthContext] Nenhum token encontrado.");
        }
      } catch (error) {
        console.error("[AuthContext] Erro ao verificar login:", error);
      } finally {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // ---------------------------------------------
  // 🔑 Função de Login
  // ---------------------------------------------
  const handleLogin = async (email, senha) => {
    try {
      setLoading(true);
      const data = await login(email, senha);
      if (data) {
        const profile = await getUserProfile();
        if (profile) {
          setUser(profile);
          setIsPro(profile.isPro || false);
          Alert.alert("✅ Login realizado com sucesso!");
        }
      }
    } catch (err) {
      console.error("Erro ao logar:", err);
      Alert.alert("❌ Erro ao entrar", "Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // 🧾 Registro
  // ---------------------------------------------
  const handleRegister = async (userData) => {
    try {
      setLoading(true);
      const result = await registerUser(userData);
      if (result.success) {
        Alert.alert("✅ Conta criada com sucesso!");
      } else {
        Alert.alert("❌ Falha no registro", result.message);
      }
    } catch (error) {
      console.error("Erro no registro:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // 🚪 Logout
  // ---------------------------------------------
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      setIsPro(false);
      Alert.alert("👋 Você saiu da sua conta.");
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // 💎 Atualiza status PRO (assinatura)
  // ---------------------------------------------
  const activatePro = () => {
    setIsPro(true);
    if (user) {
      setUser({ ...user, isPro: true });
    }
    Alert.alert("💎 Parabéns!", "Sua conta PRO foi ativada com sucesso!");
  };

  // ---------------------------------------------
  // 🧩 Valor global do contexto
  // ---------------------------------------------
  const value = {
    user,
    isPro,
    loading,
    handleLogin,
    handleLogout,
    handleRegister,
    activatePro,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
