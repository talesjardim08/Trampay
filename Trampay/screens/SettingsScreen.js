import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../AuthContext';
import { colors, fonts, spacing } from '../styles';

const SettingsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const toggleDarkMode = async (value) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(value));
      Alert.alert('Sucesso', `Modo ${value ? 'escuro' : 'claro'} ativado. Reinicie o app para aplicar.`);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
                <Text style={styles.settingLabel}>Nome</Text>
              </View>
              <Text style={styles.settingValue}>{user?.displayName || 'Não informado'}</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="email" size={24} color={colors.primary} />
                <Text style={styles.settingLabel}>Email</Text>
              </View>
              <Text style={styles.settingValue}>{user?.email || 'Não informado'}</Text>
            </View>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={styles.settingInfo}>
                <MaterialIcons name="edit" size={24} color={colors.primary} />
                <Text style={styles.settingLabel}>Editar Perfil</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="dark-mode" size={24} color={colors.primary} />
                <Text style={styles.settingLabel}>Modo Escuro</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#ccc', true: colors.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Políticas e Termos</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowTermsModal(true)}
            >
              <View style={styles.settingInfo}>
                <MaterialIcons name="description" size={24} color={colors.primary} />
                <Text style={styles.settingLabel}>Políticas de Privacidade (LGPD)</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowTermsModal(true)}
            >
              <View style={styles.settingInfo}>
                <MaterialIcons name="gavel" size={24} color={colors.primary} />
                <Text style={styles.settingLabel}>Termos de Uso</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLogout}
            >
              <View style={styles.settingInfo}>
                <MaterialIcons name="logout" size={24} color="#FF5722" />
                <Text style={[styles.settingLabel, { color: '#FF5722' }]}>Sair da Conta</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <MaterialIcons name="close" size={28} color={colors.primaryDark} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Políticas e Privacidade</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.policyTitle}>1. Segurança da Informação</Text>
            <Text style={styles.policyText}>
              O Trampay adota medidas de segurança baseadas na ISO/IEC 27001 para proteger seus dados contra acessos não autorizados.
            </Text>

            <Text style={styles.policyTitle}>2. Proteção de Dados Pessoais (LGPD)</Text>
            <Text style={styles.policyText}>
              Em conformidade com a Lei 13.709/2018, coletamos e processamos seus dados pessoais apenas para as finalidades informadas e com seu consentimento explícito.
            </Text>

            <Text style={styles.policyTitle}>3. Direitos do Usuário</Text>
            <Text style={styles.policyText}>
              Você tem direito a acessar, corrigir, excluir e portar seus dados pessoais. Entre em contato conosco para exercer esses direitos.
            </Text>

            <Text style={styles.policyTitle}>4. Coleta e Uso de Dados</Text>
            <Text style={styles.policyText}>
              Coletamos informações para operar nosso serviço, incluindo: nome, email, telefone, dados financeiros e de transações. Utilizamos esses dados exclusivamente para fornecer funcionalidades do app.
            </Text>

            <Text style={styles.policyTitle}>5. Segurança Técnica</Text>
            <Text style={styles.policyText}>
              • Senhas protegidas com bcrypt{'\n'}
              • Autenticação via JWT tokens{'\n'}
              • Comunicação criptografada (HTTPS/TLS 1.3){'\n'}
              • Prepared statements para prevenir SQL injection
            </Text>

            <Text style={styles.policyTitle}>6. Compromisso Ético</Text>
            <Text style={styles.policyText}>
              Nunca venderemos ou compartilharemos seus dados com terceiros sem seu consentimento. Sua privacidade é nossa prioridade.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark
  },
  content: {
    flex: 1
  },
  section: {
    marginTop: spacing.lg
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm
  },
  card: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textDark,
    marginLeft: spacing.md
  },
  settingValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    maxWidth: '50%',
    textAlign: 'right'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  policyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  policyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textDark,
    lineHeight: 22,
    marginBottom: spacing.md
  }
});

export default SettingsScreen;
