// Tela de login do TramPay
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { colors, globalStyles, spacing, fonts } from './styles';

const LoginScreen = ({ navigation, onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
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
        contentContainerStyle={globalStyles.screenContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.modernContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* LOGO */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('./')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
              <Text style={styles.subWelcomeText}>
                Entre na sua conta para continuar
              </Text>
            </View>
          </View>

          {/* FORMULÁRIO */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.modernLabel}>EMAIL</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  errors.email && styles.inputError,
                ]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.placeholder}
                value={formData.email}
                onChangeText={value => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.modernLabel}>SENHA</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  errors.password && styles.inputError,
                ]}
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

            {/* BOTÃO LOGIN */}
            <TouchableOpacity
              style={[styles.modernButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.modernButtonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {/* LINKS */}
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

            {/* CONTA DEMO */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Contas de demonstração:</Text>
              <Text style={styles.demoText}>Email: demo@trampay.com</Text>
              <Text style={styles.demoText}>Senha: 123456</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  logoImage: {
    width: 130,
    height: 130,
    marginBottom: spacing.md,
  },

  welcomeText: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '700',
  },

  subWelcomeText: {
    fontSize: 17,
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
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  inputContainer: {
    marginBottom: spacing.lg,
  },

  modernLabel: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },

  modernInput: {
    height: 58,
    backgroundColor: '#f8f9fb',
    borderRadius: 18,
    paddingHorizontal: spacing.lg + 4,
    fontSize: 17,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },

  inputError: {
    borderColor: colors.error,
    backgroundColor: '#fff5f5',
  },

  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },

  modernButton: {
    height: 58,
    backgroundColor: colors.secondary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg + 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  modernButtonText: {
    fontSize: 19,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  buttonDisabled: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },

  linkContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },

  linkText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    textDecorationLine: 'underline',
  },

  createAccountText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.white,
    textAlign: 'center',
  },

  createAccountLink: {
    fontFamily: fonts.bold,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },

  demoContainer: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  demoTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  demoText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    marginBottom: 4,
  },
});

export default LoginScreen;
