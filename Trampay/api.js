import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://trampay.onrender.com";


const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: insere token automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Erro lendo token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (opcional): detecta 401 para logout centralizado (se desejar)
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    // você pode tratar globalmente 401 aqui se quiser
    return Promise.reject(error);
  }
);

export default api;