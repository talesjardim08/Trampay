// Modal para adicionar novo cliente - Trampay
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const AddClientModal = ({ visible, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    age: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

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

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    // Validação do nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validação do CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    // Validação da idade
    if (!formData.age.trim()) {
      newErrors.age = 'Idade é obrigatória';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 120) {
        newErrors.age = 'Idade deve ser entre 1 e 120 anos';
      }
    }

    // Validação do telefone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor, insira um email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para adicionar cliente
  const handleAdd = () => {
    if (!validateForm()) return;

    onAdd(formData);
    
    // Reset form
    setFormData({
      name: '',
      cpf: '',
      age: '',
      phone: '',
      email: ''
    });
    setErrors({});
  };

  // Função para cancelar
  const handleCancel = () => {
    setFormData({
      name: '',
      cpf: '',
      age: '',
      phone: '',
      email: ''
    });
    setErrors({});
    onClose();
  };

  // Função para formatar CPF
  const formatCPF = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return text;
  };

  // Função para formatar telefone
  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }
    return text;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Adicionar novo cliente</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Nome completo"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* CPF */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF:</Text>
            <TextInput
              style={[styles.input, errors.cpf && styles.inputError]}
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChangeText={(text) => updateFormData('cpf', formatCPF(text))}
              keyboardType="numeric"
              maxLength={14}
              returnKeyType="next"
            />
            {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
          </View>

          {/* Idade */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Idade:</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              placeholder="25"
              value={formData.age}
              onChangeText={(text) => updateFormData('age', text.replace(/\D/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="next"
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          {/* Telefone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone:</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', formatPhone(text))}
              keyboardType="phone-pad"
              maxLength={15}
              returnKeyType="next"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="cliente@email.com"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Botão Adicionar */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  backButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  inputContainer: {
    marginBottom: spacing.lg,
  },

  label: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  input: {
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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

  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  bottomSpacer: {
    height: spacing.xl,
  },
});

export default AddClientModal;