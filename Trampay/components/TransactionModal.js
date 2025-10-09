// Modal para adicionar nova transação
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
import { colors, fonts, spacing } from '../styles';

const TransactionModal = ({ visible, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'Entrada', // Entrada ou Saída
    description: '',
    amount: '',
    category: '',
    isRecurring: false,
    frequency: 'Único' // Único, Semanal, Mensal
  });

  const categories = {
    Entrada: ['Salário', 'Freelance', 'Venda', 'Investimento', 'Outros'],
    Saída: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros']
  };

  const frequencies = ['Único', 'Semanal', 'Mensal', 'Anual'];

  const handleSave = () => {
    if (!formData.description || !formData.amount) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const transaction = {
      id: Date.now(),
      type: formData.type,
      name: formData.description, // Usando 'name' para compatibilidade com HomeScreen
      description: formData.description,
      amount: parseFloat(formData.amount) * (formData.type === 'Saída' ? -1 : 1),
      category: formData.category,
      date: new Date().toISOString(),
      isRecurring: formData.isRecurring,
      frequency: formData.frequency
    };

    onSave(transaction);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      type: 'Entrada',
      description: '',
      amount: '',
      category: '',
      isRecurring: false,
      frequency: 'Único'
    });
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Nova Transação</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Tipo da Transação */}
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'Entrada' && styles.typeButtonActive
                ]}
                onPress={() => updateFormData('type', 'Entrada')}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'Entrada' && styles.typeButtonTextActive
                ]}>
                  Entrada
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'Saída' && styles.typeButtonActive
                ]}
                onPress={() => updateFormData('type', 'Saída')}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'Saída' && styles.typeButtonTextActive
                ]}>
                  Saída
                </Text>
              </TouchableOpacity>
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição *</Text>
              <TextInput
                style={styles.input}
                placeholder="Descreva a transação"
                placeholderTextColor={colors.placeholder}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
              />
            </View>

            {/* Valor */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Valor *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0,00"
                  placeholderTextColor={colors.placeholder}
                  value={formData.amount}
                  onChangeText={(value) => updateFormData('amount', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Categoria */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {categories[formData.type].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        formData.category === cat && styles.categoryButtonActive
                      ]}
                      onPress={() => updateFormData('category', cat)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        formData.category === cat && styles.categoryButtonTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Frequência */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Frequência</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {frequencies.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.categoryButton,
                        formData.frequency === freq && styles.categoryButtonActive
                      ]}
                      onPress={() => updateFormData('frequency', freq)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        formData.frequency === freq && styles.categoryButtonTextActive
                      ]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  cancelButton: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textLight,
  },

  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  saveButton: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
  },

  content: {
    padding: spacing.lg,
  },

  typeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },

  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
  },

  typeButtonActive: {
    backgroundColor: colors.primaryDark,
  },

  typeButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  typeButtonTextActive: {
    color: colors.white,
  },

  inputContainer: {
    marginBottom: spacing.lg,
  },

  label: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },

  input: {
    height: 48,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    height: 48,
  },

  currencySymbol: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    paddingLeft: spacing.md,
  },

  amountInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  categoryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
  },

  categoryButtonActive: {
    backgroundColor: colors.primary,
  },

  categoryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  categoryButtonTextActive: {
    color: colors.white,
  },
});

export default TransactionModal;