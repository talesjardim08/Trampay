import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://trampay.onrender.com/api';
console.log('[API] BASE URL =', API_BASE);
const api = axios.create({ baseURL: API_BASE, timeout: 30000 });
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Erro ao ler token do AsyncStorage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
       console.warn('401 recebido do servidor');
    }
    return Promise.reject(error);
  }
);
api.upload = (path, formData) => {
  return api.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};
export default api;