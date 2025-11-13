// Tela de Precificação - Trampay
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';
import withPremiumProtection from './hocs/withPremiumProtection';

const PricingScreen = ({ navigation }) => {
  const [monthlyCost, setMonthlyCost] = useState('');
  const [profitMargin, setProfitMargin] = useState('15');
  const [dailyQuantity, setDailyQuantity] = useState('');
  const [result, setResult] = useState(null);

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    if (!value) return '';
    const numValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numValue) / 100);
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(formattedValue);
  };

  // Função para calcular precificação
  const calculatePricing = () => {
    const cost = parseFloat(monthlyCost.replace(/\./g, '').replace(',', '.'));
    const margin = parseFloat(profitMargin.replace(',', '.'));
    const quantity = parseInt(dailyQuantity);

    // Validações mais robustas
    if (isNaN(cost) || isNaN(margin) || isNaN(quantity)) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos com valores válidos.');
      return;
    }

    if (cost <= 0 || margin <= 0 || quantity <= 0 || !Number.isInteger(quantity)) {
      Alert.alert('Erro', 'Custo e margem devem ser maiores que zero, e quantidade deve ser um número inteiro positivo.');
      return;
    }

    // Cálculos de precificação
    const dailyCost = cost / 30; // Custo diário (assumindo 30 dias no mês)
    const costPerUnit = dailyCost / quantity; // Custo por unidade
    const profitValue = costPerUnit * (margin / 100); // Valor do lucro
    const suggestedPrice = costPerUnit + profitValue; // Preço sugerido
    const monthlyRevenue = suggestedPrice * quantity * 30; // Receita mensal estimada
    const monthlyProfit = monthlyRevenue - cost; // Lucro mensal estimado

    setResult({
      costPerUnit,
      profitValue,
      suggestedPrice,
      monthlyRevenue,
      monthlyProfit,
      margin
    });

    // Mostrar disclaimer
    setTimeout(() => {
      Alert.alert(
        'Importante - Disclaimer',
        'Esta ferramenta é apenas uma calculadora básica de precificação. O Trampay não é um profissional contábil ou financeiro. Recomendamos consultar um especialista para decisões importantes de precificação e análise financeira completa.',
        [{ text: 'Entendi', style: 'default' }]
      );
    }, 500);
  };

  const resetCalculation = () => {
    setMonthlyCost('');
    setProfitMargin('15');
    setDailyQuantity('');
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Precificação</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Texto explicativo */}
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationText}>
              Para determinar o valor adequado a ser cobrado pelo seu produto/serviço, considere os seguintes aspectos:
            </Text>
          </View>

          {/* Preço de custo mensal */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Preço de custo mensal</Text>
            <Text style={styles.inputDescription}>
              Inclui despesas com materiais, cursos de capacitação, bem como futuras manutenções.
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.textInput}
                value={monthlyCost}
                onChangeText={(text) => setMonthlyCost(formatCurrency(text))}
                placeholder="0.000,00"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Margem de lucro */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Margem de lucro</Text>
            <Text style={styles.inputDescription}>
              Percentual máximo a ser aplicado sobre o valor do serviço.
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.suggestionLabel}>Sugestão: 15%</Text>
              <TextInput
                style={styles.textInput}
                value={profitMargin}
                onChangeText={setProfitMargin}
                placeholder="15"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>
          </View>

          {/* Quantidade diária */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Quantidade diária</Text>
            <Text style={styles.inputDescription}>
              Média do volume diário de vendas ou atendimentos.
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={dailyQuantity}
                onChangeText={setDailyQuantity}
                placeholder="0"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Resultado */}
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Resultado da Precificação</Text>
              
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Custo por unidade:</Text>
                <Text style={styles.resultValue}>
                  R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.costPerUnit)}
                </Text>
              </View>
              
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Lucro por unidade ({result.margin}%):</Text>
                <Text style={styles.resultValue}>
                  R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.profitValue)}
                </Text>
              </View>
              
              <View style={[styles.resultItem, styles.highlightedResult]}>
                <Text style={styles.resultLabelBold}>Preço sugerido por unidade:</Text>
                <Text style={styles.resultValueBold}>
                  R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.suggestedPrice)}
                </Text>
              </View>
              
              <View style={styles.projectionContainer}>
                <Text style={styles.projectionTitle}>Projeção Mensal</Text>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Receita estimada:</Text>
                  <Text style={[styles.resultValue, { color: colors.success }]}>
                    R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.monthlyRevenue)}
                  </Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Lucro líquido estimado:</Text>
                  <Text style={[styles.resultValue, { color: colors.success }]}>
                    R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(result.monthlyProfit)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.resetButton} onPress={resetCalculation}>
                <MaterialIcons name="refresh" size={20} color={colors.primaryDark} />
                <Text style={styles.resetButtonText}>Novo Cálculo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Explicação adicional */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Dicas importantes:</Text>
            <Text style={styles.tipText}>
              • Considere todos os custos: materiais, tempo, energia, impostos, etc.
            </Text>
            <Text style={styles.tipText}>
              • Pesquise preços da concorrência para validar seus cálculos
            </Text>
            <Text style={styles.tipText}>
              • Ajuste a margem conforme o valor percebido pelo cliente
            </Text>
            <Text style={styles.tipText}>
              • Reavalie periodicamente seus custos e preços
            </Text>
          </View>
        </ScrollView>

        {/* Botão Calcular */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.calculateButton} 
            onPress={calculatePricing}
          >
            <Text style={styles.calculateButtonText}>Calcular</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
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
    fontSize: 20,
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
  },

  explanationContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },

  explanationText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'left',
  },

  inputContainer: {
    marginBottom: spacing.xl,
  },

  inputLabel: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },

  inputDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  inputWrapper: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },

  currencySymbol: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginRight: spacing.sm,
  },

  percentSymbol: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.white,
    paddingVertical: spacing.sm,
  },

  suggestionLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.white,
    marginRight: spacing.md,
  },

  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },

  calculateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  calculateButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  resultContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  resultTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  resultLabel: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },

  resultValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  highlightedResult: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
  },

  resultLabelBold: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    flex: 1,
  },

  resultValueBold: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  projectionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },

  projectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },

  resetButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginLeft: spacing.sm,
  },

  tipsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  tipsTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },

  tipText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});

export default withPremiumProtection(PricingScreen);