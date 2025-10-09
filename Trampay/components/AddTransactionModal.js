// Modal para adicionar transação - Trampay
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

const AddTransactionModal = ({ visible, onClose, onAdd }) => {
  const [transactionType, setTransactionType] = useState('income'); // 'income' ou 'expense'
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: '',
    isFixed: false,
    isVariable: false,
    isInvestment: false,
    category: 'Variável',
    currency: 'BRL'
  });
  const [errors, setErrors] = useState({});

  const currencies = [
    { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
    { code: 'USD', symbol: 'US$', name: 'Dólar Americano' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'Libra Esterlina' }
  ];

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

  // Função para formatar data (DD/MM/AAAA)
  const formatDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = '';
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    } else if (cleaned.length <= 8) {
      formatted = cleaned.substring(0, 2) + '/' + 
                  cleaned.substring(2, 4) + '/' + 
                  cleaned.substring(4, 8);
    }
    
    return formatted;
  };

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para lidar com mudança de valor
  const handleAmountChange = (text) => {
    const formatted = formatCurrency(text);
    updateFormData('amount', formatted);
  };

  // Função para selecionar categoria
  const handleCategoryToggle = (category) => {
    // Reset todas as categorias
    setFormData(prev => ({
      ...prev,
      isFixed: false,
      isVariable: false,
      isInvestment: false,
      category: 'Variável'
    }));

    // Ativar apenas a categoria selecionada
    switch (category) {
      case 'fixed':
        updateFormData('isFixed', true);
        updateFormData('category', 'Fixa');
        break;
      case 'variable':
        updateFormData('isVariable', true);
        updateFormData('category', 'Variável');
        break;
      case 'investment':
        updateFormData('isInvestment', true);
        updateFormData('category', 'Investimento');
        break;
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount === '0,00') {
      newErrors.amount = 'Valor é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Data é obrigatória';
    } else {
      // Validar formato da data
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = 'Data inválida (DD/MM/AAAA)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para selecionar moeda
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency.code);
    updateFormData('currency', currency.code);
    setShowCurrencyDropdown(false);
  };

  // Função para converter data DD/MM/AAAA para ISO
  const convertDateToISO = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day).toISOString();
  };

  // Função para adicionar transação
  const handleAdd = () => {
    if (!validateForm()) return;

    // Converter valor para número
    const numericAmount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'));

    const transactionData = {
      type: transactionType,
      amount: numericAmount,
      description: formData.description,
      date: formData.date, // Formato DD/MM/AAAA para exibição
      transactionDate: convertDateToISO(formData.date), // ISO para cálculos
      category: formData.category,
      currency: selectedCurrency,
      isRecurring: formData.isFixed,
      isInvestment: formData.isInvestment
    };

    onAdd(transactionData);
    
    // Reset form
    setFormData({
      amount: '',
      description: '',
      date: '',
      isFixed: false,
      isVariable: false,
      isInvestment: false,
      category: 'Variável',
      currency: 'BRL'
    });
    setSelectedCurrency('BRL');
    setErrors({});
    setTransactionType('income');
  };

  // Função para fechar modal
  const handleClose = () => {
    // Reset form ao fechar
    setFormData({
      amount: '',
      description: '',
      date: '',
      isFixed: false,
      isVariable: false,
      isInvestment: false,
      category: 'Variável',
      currency: 'BRL'
    });
    setSelectedCurrency('BRL');
    setShowCurrencyDropdown(false);
    setErrors({});
    setTransactionType('income');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
          >
            <MaterialIcons name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Adicionar transação</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Type Tabs */}
          <View style={styles.typeTabs}>
            <TouchableOpacity
              style={[styles.typeTab, transactionType === 'income' && styles.typeTabActive]}
              onPress={() => setTransactionType('income')}
            >
              <Text style={[styles.typeTabText, transactionType === 'income' && styles.typeTabActiveText]}>
                Entrada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeTab, transactionType === 'expense' && styles.typeTabActive]}
              onPress={() => setTransactionType('expense')}
            >
              <Text style={[styles.typeTabText, transactionType === 'expense' && styles.typeTabActiveText]}>
                Saída
              </Text>
            </TouchableOpacity>
          </View>

          {/* Valor */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor:</Text>
            <View style={styles.amountContainer}>
              <TouchableOpacity 
                style={styles.currencyDropdown}
                onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              >
                <Text style={styles.currencyText}>
                  {currencies.find(c => c.code === selectedCurrency)?.symbol || 'R$'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.white} />
              </TouchableOpacity>
              <TextInput
                style={[styles.amountInput, errors.amount && styles.inputError]}
                placeholder="0,00"
                value={formData.amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
              />
            </View>

            {/* Currency Dropdown */}
            {showCurrencyDropdown && (
              <View style={styles.currencyDropdownMenu}>
                {currencies.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      selectedCurrency === currency.code && styles.currencyOptionActive
                    ]}
                    onPress={() => handleCurrencySelect(currency)}
                  >
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                    {selectedCurrency === currency.code && (
                      <MaterialIcons name="check" size={20} color={colors.primaryDark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descrição:</Text>
            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              placeholder="Descreva a transação..."
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Data */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Data:</Text>
            <TextInput
              style={[styles.input, errors.date && styles.inputError]}
              placeholder="DD/MM/AAAA"
              value={formData.date}
              onChangeText={(text) => updateFormData('date', formatDate(text))}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Categorias */}
          <View style={styles.categoriesContainer}>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategoryToggle('fixed')}
            >
              <View style={[styles.checkbox, formData.isFixed && styles.checkboxActive]}>
                {formData.isFixed && (
                  <MaterialIcons name="check" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.categoryText}>Fixa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategoryToggle('variable')}
            >
              <View style={[styles.checkbox, formData.isVariable && styles.checkboxActive]}>
                {formData.isVariable && (
                  <MaterialIcons name="check" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.categoryText}>Variável</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => handleCategoryToggle('investment')}
            >
              <View style={[styles.checkbox, formData.isInvestment && styles.checkboxActive]}>
                {formData.isInvestment && (
                  <MaterialIcons name="check" size={16} color={colors.white} />
                )}
              </View>
              <Text style={styles.categoryText}>Investimento</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  typeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.xl,
  },
  typeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeTabActive: {
    backgroundColor: colors.primaryDark,
  },
  typeTabText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  typeTabActiveText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  currencyText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoriesContainer: {
    marginTop: spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  currencyDropdownMenu: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    maxHeight: 200,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyOptionActive: {
    backgroundColor: colors.backgroundLight,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginRight: spacing.sm,
    width: 30,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  currencyName: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
});

export default AddTransactionModal;