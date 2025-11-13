import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaskedTextInput } from 'react-native-mask-text';
import { registerUser } from './authService';
import { colors, spacing, fonts } from './styles';

export default function CreateAccountScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  const [form, setForm] = useState({
    accountType: 'pf',
    documentNumber: '',
    legalName: '',
    displayName: '',
    email: '',
    phone: '',
    addressState: '',
    addressCity: '',
    password: '',
    confirmPassword: '',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Carregar estados do IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(res => res.json())
      .then(data => setStates(data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(console.error);
  }, []);

  // Carregar cidades quando o estado mudar
  useEffect(() => {
    if (!form.addressState) return;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.addressState}/municipios`)
      .then(res => res.json())
      .then(data => setCities(data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch(console.error);
  }, [form.addressState]);

  const handleRegister = async () => {
    if (!form.legalName || !form.email || !form.password || !form.confirmPassword)
      return Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
    if (form.password !== form.confirmPassword)
      return Alert.alert('Erro', 'As senhas não conferem');
    if (!acceptedPolicies)
      return Alert.alert('Atenção', 'Você precisa aceitar as Políticas de Segurança e Privacidade para criar sua conta');

    try {
      setLoading(true);
      const payload = {
        AccountType: form.accountType,
        DocumentType: form.accountType === 'pf' ? 'CPF' : 'CNPJ',
        DocumentNumber: form.documentNumber,
        LegalName: form.legalName,
        DisplayName: form.displayName || form.legalName,
        BirthDate: null,
        Email: form.email,
        Phone: form.phone,
        AddressStreet: null,
        AddressNumber: null,
        AddressComplement: null,
        AddressNeighborhood: null,
        AddressCity: form.addressCity,
        AddressState: form.addressState,
        AddressZip: null,
        password: form.password,
      };


      const res = await registerUser(payload);

      if (res && res.success) {
        Alert.alert('Sucesso', 'Conta criada com sucesso!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Erro', res?.message || 'Falha ao criar conta.');
      }
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao se conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={[colors.primary, colors.backgroundGradientEnd || '#fff']} style={styles.bg}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.title}>Crie sua conta</Text>

              {/* Tipo de conta */}
              <Text style={styles.label}>Tipo de Conta</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => update('accountType', 'pf')}
                  style={[styles.chip, form.accountType === 'pf' && styles.chipActive]}>
                  <Text style={[styles.chipText, form.accountType === 'pf' && styles.chipTextActive]}>
                    Pessoa Física
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => update('accountType', 'pj')}
                  style={[styles.chip, form.accountType === 'pj' && styles.chipActive]}>
                  <Text style={[styles.chipText, form.accountType === 'pj' && styles.chipTextActive]}>
                    Pessoa Jurídica
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Documento */}
              <Text style={styles.label}>{form.accountType === 'pf' ? 'CPF' : 'CNPJ'}</Text>
              <MaskedTextInput
                mask={form.accountType === 'pf' ? '999.999.999-99' : '99.999.999/9999-99'}
                style={styles.input}
                value={form.documentNumber}
                onChangeText={(t) => update('documentNumber', t)}
                keyboardType="numeric"
                placeholder={form.accountType === 'pf' ? 'Digite seu CPF' : 'Digite seu CNPJ'}
              />

              {/* Dados básicos */}
              <Text style={styles.label}>Nome Completo / Razão Social</Text>
              <TextInput style={styles.input} value={form.legalName} onChangeText={(t) => update('legalName', t)} />

              <Text style={styles.label}>Nome de Exibição</Text>
              <TextInput style={styles.input} value={form.displayName} onChangeText={(t) => update('displayName', t)} />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(t) => update('email', t)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="exemplo@email.com"
              />

              <Text style={styles.label}>Telefone</Text>
              <MaskedTextInput
                mask="(99) 99999-9999"
                style={styles.input}
                value={form.phone}
                onChangeText={(t) => update('phone', t)}
                keyboardType="phone-pad"
                placeholder="(00) 00000-0000"
              />

              {/* Estado */}
              <Text style={styles.label}>Estado</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowStatePicker(true)}>
                <Text style={{ color: form.addressState ? colors.text : colors.placeholder }}>
                  {form.addressState || 'Selecionar Estado'}
                </Text>
              </TouchableOpacity>

              {/* Cidade */}
              <Text style={styles.label}>Cidade</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() =>
                  form.addressState
                    ? setShowCityPicker(true)
                    : Alert.alert('Atenção', 'Selecione o estado primeiro')
                }>
                <Text style={{ color: form.addressCity ? colors.text : colors.placeholder }}>
                  {form.addressCity || 'Selecionar Cidade'}
                </Text>
              </TouchableOpacity>

              {/* Senha */}
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={form.password}
                onChangeText={(t) => update('password', t)}
                placeholder="Mínimo 6 caracteres"
              />

              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={form.confirmPassword}
                onChangeText={(t) => update('confirmPassword', t)}
                placeholder="Digite novamente"
              />

              {/* Checkbox de Políticas */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => setAcceptedPolicies(!acceptedPolicies)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, acceptedPolicies && styles.checkboxActive]}>
                    {acceptedPolicies && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Li e aceito as </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPoliciesModal(true)}>
                  <Text style={styles.policyLink}>
                    Políticas de Segurança e Privacidade
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.primaryDark} />
                ) : (
                  <Text style={styles.primaryBtnText}>Cadastrar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Já tem conta? Entrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* MODAIS */}
      <Modal visible={showStatePicker} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecione o Estado</Text>
          <FlatList
            data={states}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  update('addressState', item.sigla);
                  setShowStatePicker(false);
                }}>
                <Text style={styles.modalText}>{item.nome} ({item.sigla})</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowStatePicker(false)}>
            <Text style={styles.modalCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showCityPicker} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecione a Cidade</Text>
          <FlatList
            data={cities}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  update('addressCity', item.nome);
                  setShowCityPicker(false);
                }}>
                <Text style={styles.modalText}>{item.nome}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowCityPicker(false)}>
            <Text style={styles.modalCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* MODAL DE POLÍTICAS */}
      <Modal visible={showPoliciesModal} animationType="slide">
        <SafeAreaView style={styles.policyModal}>
          <View style={styles.policyHeader}>
            <Text style={styles.policyTitle}>Políticas de Segurança e Privacidade</Text>
            <TouchableOpacity onPress={() => setShowPoliciesModal(false)}>
              <Text style={styles.policyClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.policyContent}>
            <Text style={styles.policySection}>1. SEGURANÇA DA INFORMAÇÃO</Text>
            <Text style={styles.policyText}>
              A segurança da informação no Trampay compreende práticas, processos e tecnologias destinados à proteção de dados e sistemas computacionais contra acessos não autorizados, uso indevido ou destruição acidental.
            </Text>
            <Text style={styles.policyText}>
              Nossa plataforma fundamenta-se nos princípios de confidencialidade, integridade e disponibilidade, em conformidade com a norma ISO/IEC 27001.
            </Text>

            <Text style={styles.policySection}>2. PROTEÇÃO DE DADOS PESSOAIS (LGPD)</Text>
            <Text style={styles.policyText}>
              O Trampay está em total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
            </Text>
            <Text style={styles.policyText}>
              • Criptografia: Senhas são armazenadas com algoritmo bcrypt. Transmissões via HTTPS/TLS 1.3.{'\n'}
              • Controle de Acesso: Modelo baseado em papéis (RBAC) com autenticação JWT.{'\n'}
              • Auditoria: Registro detalhado de todas as operações em logs imutáveis.{'\n'}
              • Backups: Automáticos e diários em servidores redundantes.
            </Text>

            <Text style={styles.policySection}>3. SEUS DIREITOS</Text>
            <Text style={styles.policyText}>
              Você tem direito a:{'\n'}
              • Acessar, corrigir ou excluir seus dados pessoais{'\n'}
              • Revogar consentimento a qualquer momento{'\n'}
              • Solicitar portabilidade dos seus dados{'\n'}
              • Ser informado sobre o uso e compartilhamento de dados
            </Text>

            <Text style={styles.policySection}>4. COLETA E USO DE DADOS</Text>
            <Text style={styles.policyText}>
              Coletamos apenas dados essenciais para funcionamento do sistema: nome, e-mail, telefone, CPF/CNPJ, endereço e informações financeiras relacionadas às suas transações.
            </Text>
            <Text style={styles.policyText}>
              Seus dados NÃO serão compartilhados com terceiros sem seu consentimento expresso, exceto quando exigido por lei.
            </Text>

            <Text style={styles.policySection}>5. SEGURANÇA TÉCNICA</Text>
            <Text style={styles.policyText}>
              • Banco de dados MySQL hospedado em AlwaysData com isolamento de instâncias{'\n'}
              • Backend .NET 8 com autenticação JWT Bearer{'\n'}
              • Prepared statements para prevenção de SQL Injection{'\n'}
              • Limitação de tentativas de login contra força bruta{'\n'}
              • Monitoramento contínuo e detecção de anomalias
            </Text>

            <Text style={styles.policySection}>6. COMPROMISSO ÉTICO</Text>
            <Text style={styles.policyText}>
              O Trampay garante transparência, respeito à privacidade e proteção integral dos direitos dos usuários, alinhado às melhores práticas de segurança digital.
            </Text>
          </ScrollView>
          <View style={styles.policyFooter}>
            <TouchableOpacity 
              style={styles.policyAcceptBtn}
              onPress={() => {
                setAcceptedPolicies(true);
                setShowPoliciesModal(false);
              }}
            >
              <Text style={styles.policyAcceptText}>Aceitar e Continuar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: spacing.lg, alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.primaryDark, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, color: colors.primaryDark, marginBottom: 6, fontFamily: fonts.semibold },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  selectBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  chip: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: colors.primaryDark, fontFamily: fonts.bold },
  primaryBtn: { marginTop: spacing.md, backgroundColor: colors.primary, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 16 },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.md, fontFamily: fonts.semibold },
  modalContainer: { flex: 1, backgroundColor: '#fff', padding: 20 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.primaryDark, marginBottom: 20 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalText: { fontSize: 16, color: colors.text },
  modalClose: { marginTop: 16, alignSelf: 'center' },
  modalCloseText: { color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 16 },
  
  // Checkbox de Políticas
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.primaryDark,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  policyLink: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    textDecorationLine: 'underline',
  },
  
  // Modal de Políticas
  policyModal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  policyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    flex: 1,
  },
  policyClose: {
    fontSize: 28,
    color: colors.textLight,
    marginLeft: 10,
  },
  policyContent: {
    flex: 1,
    padding: 20,
  },
  policySection: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginTop: 16,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  policyFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  policyAcceptBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyAcceptText: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
