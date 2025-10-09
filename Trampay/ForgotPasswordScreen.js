// Tela de redefinição de senha do Trampay
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { colors, globalStyles, spacing } from './styles';

const ForgotPasswordScreen = ({ navigation }) => {
  // Estados para o formulário
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Validação do email
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      setError('Email é obrigatório');
      return false;
    } else if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return false;
    }
    
    setError('');
    return true;
  };

  // Função para enviar email de redefinição
  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    
    try {
      // Simula envio de email (será integrado com Firebase depois)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      
      Alert.alert(
        'Email Enviado!',
        `Um link para redefinir sua senha foi enviado para ${email}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao enviar email. Tente novamente.');
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
        <View style={globalStyles.formContainer}>
          {/* Título da tela */}
          <Text style={globalStyles.title}>Esqueci a{'\n'}Senha</Text>
          <Text style={[globalStyles.subtitle, { marginBottom: spacing.lg }]}>
            Digite seu email para receber{'\n'}instruções de redefinição
          </Text>

          {!emailSent ? (
            <>
              {/* Campo Email */}
              <View style={{ width: '100%' }}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={[
                    globalStyles.input,
                    error && styles.inputError
                  ]}
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                {error && (
                  <Text style={globalStyles.errorText}>{error}</Text>
                )}
              </View>

              {/* Botão Enviar */}
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  { marginTop: spacing.md },
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text style={globalStyles.buttonText}>
                  {isLoading ? 'Enviando...' : 'Enviar Link'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Tela de confirmação
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Email Enviado!</Text>
              <Text style={styles.successMessage}>
                Verifique sua caixa de entrada e{'\n'}
                clique no link para redefinir{'\n'}
                sua senha
              </Text>
              
              <TouchableOpacity
                style={[globalStyles.button, { marginTop: spacing.xl }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={globalStyles.buttonText}>
                  Voltar ao Login
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Link para voltar ao Login */}
          {!emailSent && (
            <TouchableOpacity
              style={{ marginTop: spacing.lg }}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={globalStyles.linkText}>
                Lembrei da senha? Fazer login
              </Text>
            </TouchableOpacity>
          )}

          {/* Opção de verificação em duas etapas */}
          {!emailSent && (
            <TouchableOpacity
              style={{ marginTop: spacing.md }}
              onPress={() => navigation.navigate('TwoFactorAuth')}
            >
              <Text style={globalStyles.linkText}>
                Prefere verificação por SMS?
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = {
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: 0.5
  },
  
  inputError: {
    borderWidth: 1,
    borderColor: colors.error
  },
  
  buttonDisabled: {
    opacity: 0.6
  },

  successContainer: {
    alignItems: 'center',
    width: '100%'
  },

  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg
  },

  successIconText: {
    fontSize: 40,
    color: colors.white,
    fontFamily: 'Poppins-Bold'
  },

  successTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center'
  },

  successMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.placeholder,
    textAlign: 'center',
    lineHeight: 24
  }
};

export default ForgotPasswordScreen;