// Tela de criação de conta do Trampay
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

const CreateAccountScreen = ({ navigation, onCreateAccount }) => {
  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    name: '',
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

    // Validação do nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para criar conta
  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simula criação de conta (será integrado com Firebase depois)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Chama função de criação de conta passada como prop
      if (onCreateAccount) {
        onCreateAccount(formData);
      }
      
      Alert.alert(
        'Sucesso!',
        'Conta criada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.');
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
              <Text style={styles.welcomeText}>Crie sua conta</Text>
              <Text style={styles.subWelcomeText}>Junte-se à nossa comunidade financeira</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>

            {/* Campo Nome */}
            <View style={styles.inputContainer}>
              <Text style={styles.modernLabel}>NOME COMPLETO</Text>
              <TextInput
                style={[
                  styles.modernInput,
                  errors.name && styles.inputError
                ]}
                placeholder="Digite seu nome completo"
                placeholderTextColor={colors.placeholder}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Campo Email */}
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

            {/* Campo Senha */}
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
                onSubmitEditing={handleCreateAccount}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Botão Criar Conta */}
            <TouchableOpacity
              style={[
                styles.modernButton,
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleCreateAccount}
              disabled={isLoading}
            >
              <Text style={styles.modernButtonText}>
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </Text>
            </TouchableOpacity>

            {/* Link para Login */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.createAccountText}>
                Já tem uma conta? <Text style={styles.createAccountLink}>Entre aqui</Text>
              </Text>
            </TouchableOpacity>
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
});

export default CreateAccountScreen;