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
  StyleSheet
} from 'react-native';
import { colors, globalStyles, spacing, fonts } from './styles';

const LoginScreen = ({ navigation, onLogin }) => {
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Função para atualizar dados do formulário
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Remove erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validação dos campos
  const validateForm = () => {
    const newErrors = {};

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor, insira um email válido';
    }

    // Validação da senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para fazer login
  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simula login (será integrado com Firebase depois)
      // Credenciais de exemplo para demonstração
      const validEmail = 'demo@trampay.com';
      const validPassword = '123456';
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (formData.email === validEmail && formData.password === validPassword) {
        // Login bem-sucedido
        if (onLogin) {
          onLogin({
            email: formData.email,
            isAuthenticated: true
          });
        }
        
        // Navega para Home passando dados do usuário
        navigation.navigate('Home', { 
          user: {
            email: formData.email,
            name: formData.email.split('@')[0],
            isAuthenticated: true
          }
        });
      } else {
        // Credenciais inválidas
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
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={globalStyles.screenContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modernContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.appTitle}>Trampay</Text>
              <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
              <Text style={styles.subWelcomeText}>Entre na sua conta para continuar</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.modernLabel}>EMAIL</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  errors.email && styles.inputError
                ]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.placeholder}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
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
                  errors.password && styles.inputError
                ]}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
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
              style={[
                styles.modernButton,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.modernButtonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {/* Link para Esqueci a Senha */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.linkText}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>

            {/* Link para Criar Conta */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={styles.createAccountText}>
                Não tem uma conta? <Text style={styles.createAccountLink}>Criar conta</Text>
              </Text>
            </TouchableOpacity>

            {/* Credenciais de demonstração */}
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


  appTitle: {
    fontSize: 48,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
    letterSpacing: 3,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 194, 54, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  welcomeText: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '700',
  },

  subWelcomeText: {
    fontSize: 17,
    fontFamily: fonts.medium,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.85,
    fontWeight: '500',
  },

  formSection: {
    width: '100%',
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
    textTransform: 'uppercase',
    fontWeight: '700',
  },

  modernInput: {
    height: 58,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: spacing.lg + 4,
    fontSize: 17,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 2.5,
    borderColor: colors.lightGray,
    fontWeight: '500',
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
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
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg + 4,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  modernButtonText: {
    fontSize: 19,
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '800',
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
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },

  createAccountText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },

  createAccountLink: {
    fontFamily: fonts.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontSize: 17,
    fontWeight: '700',
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