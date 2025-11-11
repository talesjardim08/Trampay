// src/screens/ForgotPasswordScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { forgotPassword } from '../api';
import { colors, spacing, fonts } from '../styles';
import { MaterialIcons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleSend = async () => {
    if (!email.trim()) return Alert.alert('Atenção', 'Informe o e-mail cadastrado.');

    try {
      setLoading(true);
      const res = await forgotPassword({ Email: email.trim() });

      if (res && res.success) {
        Alert.alert(
          'E-mail enviado!',
          'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Aviso', res?.message || 'E-mail não encontrado.');
      }
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao solicitar redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.primary, colors.backgroundGradientEnd || '#fff']}
        style={styles.bg}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View style={[styles.container, { opacity: fade }]}>
            
            {/* LOGO */}
            <Image
              source={require('../assets/logo_trampay_2025_2.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.card}>
              <Text style={styles.title}>Recuperar senha</Text>
              <Text style={styles.subtitle}>
                Informe o e-mail cadastrado para receber o link de redefinição.
              </Text>

              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="email" size={22} color={colors.primaryDark} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Digite seu e-mail"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSend}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.primaryDark} />
                ) : (
                  <Text style={styles.primaryBtnText}>Enviar link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginTop: spacing.md }}>
                <Text style={styles.link}>Voltar ao login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    color: colors.primaryDark,
    marginBottom: 6,
    fontFamily: fonts.semibold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: spacing.sm,
    height: 48,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    color: colors.text,
  },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  link: {
    color: colors.primary,
    textAlign: 'center',
    fontFamily: fonts.semibold,
  },
});
