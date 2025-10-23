// Tela de login do Trampay
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { colors, globalStyles, spacing, fonts } from './styles';

// Importando logo
import Logo from './assets/logo_trampay_2025_2.png';

const LoginScreen = ({ navigation, onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!emailRegex.test(formData.email))
      newErrors.email = 'Por favor, insira um email válido';

    if (!formData.password) newErrors.password = 'Senha é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const validEmail = 'demo@trampay.com';
      const validPassword = '123456';
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (formData.email === validEmail && formData.password === validPassword) {
        onLogin?.({ email: formData.email, isAuthenticated: true });
        navigation.navigate('Home', {
          user: {
            email: formData.email,
            name: formData.email.split('@')[0],
            isAuthenticated: true,
          },
        });
      } else {
        Alert.alert(
          'Erro',
          'Email ou senha incorretos.\n\nPara demonstração use:\nEmail: demo@trampay.com\nSenha: 123456'
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[globalStyles.container, { backgroundColor: colors.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modernContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoBackground}>
              <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
            <Text style={styles.subWelcomeText}>
              Entre na sua conta para continuar
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.modernLabel}>EMAIL</Text>
              <TextInput
                style={[styles.modernInput, errors.email && styles.inputError]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.placeholder}
                value={formData.email}
                onChangeText={value => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.modernLabel}>SENHA</Text>
              <TextInput
                style={[styles.modernInput, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={formData.password}
                onChangeText={value => updateFormData('password', value)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Botão Login */}
            <TouchableOpacity
              style={[styles.modernButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.modernButtonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {/* Links */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={styles.createAccountText}>
                Não tem uma conta?{' '}
                <Text style={styles.createAccountLink}>Criar conta</Text>
              </Text>
            </TouchableOpacity>

            {/* Contas de demonstração */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Contas de demonstração:</Text>
              <Text style={styles.demoText}>Email: demo@trampay.com</Text>
              <Text style={styles.demoText}>Senha: 123456</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modernContainer: {
    flex: 1,
  },
  logoSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBackground: {
    backgroundColor: colors.white,
    borderRadius: 120,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subWelcomeText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  formSection: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  modernLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  modernInput: {
    height: 52,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  modernButton: {
    height: 52,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modernButtonText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  linkText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  createAccountText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  createAccountLink: {
    color: colors.secondary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  demoContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  demoTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },
  demoText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
  },
});

export default LoginScreen;
