// ForgotPasswordScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { forgotPassword } from './api';
import { colors, spacing, fonts } from './styles';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start(), []);

  const handleSend = async () => {
    if (!email) return Alert.alert('Atenção', 'Informe o e-mail cadastrado');
    try {
      setLoading(true);
      await forgotPassword({ email: email.trim() });
      Alert.alert('Enviado', 'Se o e-mail existir, você receberá instruções para redefinir a senha.');
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao solicitar recuperação de senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={[colors.backgroundGradientStart || colors.primary, colors.backgroundGradientEnd || '#fff']} style={styles.bg}>
        <Animated.View style={[styles.container, { opacity: fade }]}>
          <View style={styles.card}>
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>Informe o e-mail cadastrado para receber o link de redefinição.</Text>
            <Text style={styles.label}>E-mail</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={styles.primaryBtnText}>Enviar link</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }}>
              <Text style={styles.link}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  card: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 16, shadowColor: colors.primaryDark, shadowOpacity: 0.06, shadowRadius: 12, elevation: 6 },
  title: { fontSize: 22, fontFamily: fonts.bold, color: colors.primaryDark, marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.textLight, marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.primaryDark, marginBottom: 6, fontFamily: fonts.semibold },
  input: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginBottom: spacing.sm, backgroundColor: '#fff' },
  primaryBtn: { marginTop: spacing.md, backgroundColor: colors.primary, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.primaryDark, fontFamily: fonts.bold },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.sm, fontFamily: fonts.semibold }
});
