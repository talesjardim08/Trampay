// Arquivo principal do aplicativo Trampay
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import AppRoutes from './routes';
import SplashScreenComponent from './SplashScreen';

// Removido controle manual da splash screen nativa para evitar conflitos

export default function App() {
  // Estados para controlar carregamento e autenticação
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [user, setUser] = useState(null);

  // Simula carregamento de fontes
  useEffect(() => {
    const loadResources = async () => {
      try {
        // Por enquanto usaremos fontes do sistema
        // Mais tarde podemos adicionar fontes Poppins customizadas
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Erro ao carregar recursos:', error);
        setFontsLoaded(true);
      }
    };

    loadResources();
  }, []);

  // Removido controle manual da splash screen nativa

  // Função chamada quando splash screen customizada termina
  const handleSplashFinish = () => {
    console.log('Splash screen finalizada');
    setShowSplash(false);
  };

  // Função para fazer login
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log('Login realizado:', userData);
  };

  // Função para criar conta
  const handleCreateAccount = (userData) => {
    console.log('Conta criada:', userData);
    // Aqui você pode fazer login automático ou redirecionar para login
  };

  // Função para logout
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Aguarda carregamento das fontes
  if (!fontsLoaded) {
    return null;
  }

  // Mostra splash screen enquanto showSplash for true
  if (showSplash) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <SplashScreenComponent onFinish={handleSplashFinish} />
      </>
    );
  }

  // Mostra o sistema de navegação após splash
  return (
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <AppRoutes
        isLoading={false}
        isAuthenticated={isAuthenticated}
        onSplashFinish={handleSplashFinish}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onLogout={handleLogout}
        user={user}
      />
    </>
  );
}