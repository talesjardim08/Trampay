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
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaskedTextInput } from 'react-native-mask-text';
import { Picker } from '@react-native-picker/picker';
import { registerUser } from './api';
import { colors, spacing, fonts } from './styles';

export default function CreateAccountScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

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

    try {
      setLoading(true);
      const payload = {
        AccountType: form.accountType,
        DocumentType: form.accountType === 'pf' ? 'CPF' : 'CNPJ',
        DocumentNumber: form.documentNumber,
        LegalName: form.legalName,
        DisplayName: form.displayName,
        Email: form.email,
        Phone: form.phone,
        AddressState: form.addressState,
        AddressCity: form.addressCity,
        Password: form.password,
      };
      const res = await registerUser(payload);
      if (res && res.id) {
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Erro', res?.message || 'Falha ao criar conta.');
      }
    } catch (e) {
      Alert.alert('Erro', e.message);
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
                  <Text style={[styles.chipText, form.accountType === 'pf' && styles.chipTextActive]}>Pessoa Física</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => update('accountType', 'pj')}
                  style={[styles.chip, form.accountType === 'pj' && styles.chipActive]}>
                  <Text style={[styles.chipText, form.accountType === 'pj' && styles.chipTextActive]}>Pessoa Jurídica</Text>
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
                onPress={() => form.addressState ? setShowCityPicker(true) : Alert.alert('Atenção', 'Selecione o estado primeiro')}>
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

      {/* MODAL DE ESTADOS */}
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

      {/* MODAL DE CIDADES */}
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

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff', padding: 20 },
  modalTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.primaryDark, marginBottom: 20 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalText: { fontSize: 16, color: colors.text },
  modalClose: { marginTop: 16, alignSelf: 'center' },
  modalCloseText: { color: colors.primaryDark, fontFamily: fonts.bold, fontSize: 16 },
});
