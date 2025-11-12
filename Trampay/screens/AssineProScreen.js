// src/screens/AssineProScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';

const AssineProScreen = ({ navigation }) => {
  const { activatePro, isPro, loading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleActivatePro = async () => {
    setLoading(true);
    try {
      await activatePro();
      // Navega de volta após ativação
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (err) {
      console.error("Erro ao ativar Pro:", err);
    } finally {
      setLoading(false);
    }
  };

  if (isPro) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>💎 Você já é PRO!</Text>
        <Text style={styles.subtitle}>Aproveite todos os recursos premium.</Text>
        <View style={{ marginTop: 20 }}>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assine Trampay PRO 💎</Text>
      <Text style={styles.subtitle}>Desbloqueie IA, Precificação, Câmbio e Trading.</Text>
      <View style={{ marginTop: 20 }}>
        {loading || authLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <Button title="Quero ser Premium" onPress={handleActivatePro} />
        )}
      </View>
    </View>
  );
};

export default AssineProScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
