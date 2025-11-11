import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function login(email, senha) {
  const res = await api.post('/auth/login', { Email: email, Senha: senha });
  const { token, user } = res.data;
  await AsyncStorage.setItem('userToken', token);
  await AsyncStorage.setItem('userData', JSON.stringify(user));
  return { token, user };
}

export async function register(payload) {
  const res = await api.post('/auth/register', payload);
  return res.data;
}

export async function forgotPassword(email) {
  return await api.post('/auth/forgot-password', { Email: email });
}

export async function resetPassword(email, token, newPassword) {
  return await api.post('/auth/reset-password', {
    Email: email,
    Token: token,
    NewPassword: newPassword,
  });
}

export async function logout() {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userData');
}
