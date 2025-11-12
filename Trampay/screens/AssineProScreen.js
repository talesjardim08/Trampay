// src/screens/AssineProScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import api from '../services/api';

const AssineProScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleActivatePro = async () => {
  try {
    const res = await api.post("/subscription/activate");
    if (res.status === 200) {
      Alert.alert("Sucesso!", "Você agora é um usuário Premium!");
      const user = await api.get("/users/me");
      await AsyncStorage.setItem("userProfile", JSON.stringify(user.data));
    }
  } catch (err) {
    console.error("Erro ao ativar Pro:", err);
    Alert.alert("Erro", "Não foi possível ativar sua assinatura agora.");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assine Trampay PRO</Text>
      <Text style={styles.subtitle}>Desbloqueie IA, Precificação, Câmbio e Trading.</Text>
      <View style={{ marginTop: 20 }}>
        <Button title={loading ? 'Aguarde...' : 'Quero ser Premium'} onPress={handleActivatePro} disabled={loading} />
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
