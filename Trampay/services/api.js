// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Use produção do Render ou localhost (dev)
const API_BASE = process.env.REACT_APP_API_URL || 'https://trampay.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Interceptor de requisição: anexa token se existir
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Erro ao ler token do SecureStore', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: tratamento global simples
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
       console.warn('401 recebido do servidor');
      // não limpar automaticamente aqui para não "surpreender" a UI;
      // deixe o AuthContext lidar com logout se quiser.
    }
    return Promise.reject(error);
  }
);

// helper para upload (FormData)
api.upload = (path, formData) => {
  return api.post(path, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // tempo maior caso upload seja grande
    timeout: 60000,
  });
};

export default api;
