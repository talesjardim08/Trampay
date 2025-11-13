import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './AuthContext';
import AppRoutes from './routes';
import SplashScreenComponent from './SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Erro ao carregar recursos:', error);
        setFontsLoaded(true);
      }
    };
    loadResources();
  }, []);

  const handleSplashFinish = () => {
    console.log('Splash screen finalizada');
    setShowSplash(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return (
      <>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <SplashScreenComponent onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <AppRoutes />
    </AuthProvider>
  );
}