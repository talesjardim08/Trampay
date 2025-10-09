  // Tela de verificação em duas etapas do Trampay
import React, { useState, useEffect, useRef } from 'react';
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

const TwoFactorAuthScreen = ({ navigation }) => {
  // Estados para o formulário
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' ou 'verification'
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const [errors, setErrors] = useState({});
  
  // Refs para inputs de código
  const codeInputs = useRef([]);

  // Timer para reenvio de código
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0 && step === 'verification') {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  // Validação do número de telefone
  const validatePhoneNumber = () => {
    const phoneRegex = /^(\+55\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    
    if (!phoneNumber.trim()) {
      setErrors({ phone: 'Número de telefone é obrigatório' });
      return false;
    } else if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setErrors({ phone: 'Por favor, insira um número válido' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  // Função para enviar código SMS
  const handleSendCode = async () => {
    if (!validatePhoneNumber()) return;

    setIsLoading(true);
    
    try {
      // Simula envio de SMS (será integrado com serviço real depois)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('verification');
      setTimer(60); // 60 segundos para reenvio
      setCanResend(false);
      
      Alert.alert(
        'Código Enviado!',
        `Um código de verificação foi enviado para ${phoneNumber}`
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar código
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Erro', 'Por favor, insira o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simula verificação do código (será integrado com serviço real depois)
      // Código de exemplo para demonstração: 123456
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (verificationCode === '123456') {
        Alert.alert(
          'Verificação Concluída!',
          'Número verificado com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Código Incorreto',
          'Código inválido. Para demonstração use: 123456'
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao verificar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reenviar código
  const handleResendCode = () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      Alert.alert('Código Reenviado', 'Novo código enviado por SMS');
    }
  };

  // Formatação do número de telefone
  const formatPhoneNumber = (text) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Aplica máscara (11) 99999-9999
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    }
    
    return phoneNumber; // Retorna o valor anterior se exceder 11 dígitos
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
          {step === 'phone' ? (
            // Primeira etapa: inserir número de telefone
            <>
              <Text style={globalStyles.title}>Verificação{'\n'}em Duas Etapas</Text>
              <Text style={globalStyles.subtitle}>
                Digite seu número de telefone{'\n'}para receber o código
              </Text>

              {/* Campo Telefone */}
              <View style={{ width: '100%' }}>
                <Text style={styles.fieldLabel}>NÚMERO DE TELEFONE</Text>
                <TextInput
                  style={[
                    globalStyles.input,
                    errors.phone && styles.inputError
                  ]}
                  placeholder="(11) 99999-9999"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setPhoneNumber(formatted);
                    if (errors.phone) setErrors({});
                  }}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}
                />
                {errors.phone && (
                  <Text style={globalStyles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Botão Enviar Código */}
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  { marginTop: spacing.md },
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                <Text style={globalStyles.buttonText}>
                  {isLoading ? 'Enviando...' : 'Enviar Código'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Segunda etapa: inserir código de verificação
            <>
              <Text style={globalStyles.title}>Digite o{'\n'}Código</Text>
              <Text style={globalStyles.subtitle}>
                Código enviado para{'\n'}{phoneNumber}
              </Text>

              {/* Campo Código de Verificação */}
              <View style={{ width: '100%' }}>
                <Text style={styles.fieldLabel}>CÓDIGO DE VERIFICAÇÃO</Text>
                <TextInput
                  style={[
                    globalStyles.input,
                    styles.codeInput
                  ]}
                  placeholder="123456"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyCode}
                />
              </View>

              {/* Timer de reenvio */}
              <View style={styles.timerContainer}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Reenviar código em {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendCode}>
                    <Text style={[globalStyles.linkText, styles.resendText]}>
                      Reenviar código
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Botão Verificar */}
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  { marginTop: spacing.md },
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleVerifyCode}
                disabled={isLoading}
              >
                <Text style={globalStyles.buttonText}>
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </Text>
              </TouchableOpacity>

              {/* Código de demonstração */}
              <View style={styles.demoContainer}>
                <Text style={styles.demoText}>
                  Para demonstração use o código: 123456
                </Text>
              </View>
            </>
          )}

          {/* Link para voltar */}
          <TouchableOpacity
            style={{ marginTop: spacing.lg }}
            onPress={() => {
              if (step === 'verification') {
                setStep('phone');
                setVerificationCode('');
                setTimer(0);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={globalStyles.linkText}>
              {step === 'verification' ? 'Alterar número' : 'Voltar'}
            </Text>
          </TouchableOpacity>
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

  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 8
  },

  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.md
  },

  timerText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: colors.placeholder
  },

  resendText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium'
  },

  demoContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    alignItems: 'center'
  },

  demoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: colors.primaryDark,
    textAlign: 'center'
  }
};

export default TwoFactorAuthScreen;