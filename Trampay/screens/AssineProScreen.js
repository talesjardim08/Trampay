// src/screens/AssineProScreen.js
import React, { useContext, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const AssineProScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const activate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/subscription/activate');
      if (res.data && res.data.success) {
        // Atualiza info local do usuário
        const updated = { ...user, is_premium: 1, premium_until: res.data.premium_until };
        setUser(updated);
        await AsyncStorage?.setItem('@trampay_user', JSON.stringify(updated));
        Alert.alert('Sucesso', 'Sua conta agora é PRO!');
        navigation.goBack();
      } else {
        Alert.alert('Erro', 'Não foi possível ativar PRO.');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Erro', 'Falha ao ativar PRO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assine Trampay PRO</Text>
      <Text style={styles.subtitle}>Desbloqueie IA, Precificação, Câmbio e Trading.</Text>
      <View style={{ marginTop: 20 }}>
        <Button title={loading ? 'Aguarde...' : 'Quero ser Premium'} onPress={activate} disabled={loading} />
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
