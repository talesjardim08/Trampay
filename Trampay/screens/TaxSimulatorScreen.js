// Tela Simulador de Taxas e Impostos - Trampay
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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const TaxSimulatorScreen = ({ navigation }) => {
  // Estados para MEI
  const [meiIncome, setMeiIncome] = useState('');
  const [meiType, setMeiType] = useState('comercio'); // comercio, servico
  
  // Estados para Simples Nacional
  const [simplesRevenue, setSimplesRevenue] = useState('');
  const [simplesAnnex, setSimplesAnnex] = useState('I'); // I, II, III, IV, V
  
  // Estados para Autônomos
  const [autonomoIncome, setAutonomoIncome] = useState('');
  const [autonomoCity, setAutonomoCity] = useState('5'); // Taxa ISS padrão
  const [inssType, setInssType] = useState('full'); // full (20%) ou simplified (11%)
  
  // Estados para outros impostos
  const [otherIncomeType, setOtherIncomeType] = useState('pisConfins');
  const [otherIncome, setOtherIncome] = useState('');
  
  const [activeCalculator, setActiveCalculator] = useState('mei');
  const [results, setResults] = useState({});

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

  // Função para calcular MEI
  const calculateMEI = () => {
    const income = parseFloat(meiIncome.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(income) || income <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor de faturamento válido.');
      return;
    }

    const meiLimit = 81000; // Limite MEI 2025
    if (income > meiLimit) {
      Alert.alert('Atenção', `O faturamento informado (R$ ${income.toFixed(2)}) excede o limite anual do MEI (R$ ${meiLimit.toLocaleString('pt-BR')}).`);
      return;
    }

    // Valores fixos MEI 2025
    const inss = 70.60; // 5% do salário mínimo
    const iss = meiType === 'servico' ? 5.00 : 0;
    const icms = meiType === 'comercio' ? 1.00 : 0;
    
    const monthlyTax = inss + iss + icms;
    const annualTax = monthlyTax * 12;
    const effectiveRate = (annualTax / income) * 100;

    setResults(prev => ({
      ...prev,
      mei: {
        inss,
        iss,
        icms,
        monthlyTax,
        annualTax,
        effectiveRate,
        income
      }
    }));

    showDisclaimer();
  };

  // Função para calcular Simples Nacional
  const calculateSimples = () => {
    const revenue = parseFloat(simplesRevenue.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(revenue) || revenue <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor de faturamento válido.');
      return;
    }

    const simplesLimit = 4800000; // Limite Simples Nacional
    if (revenue > simplesLimit) {
      Alert.alert('Atenção', `O faturamento excede o limite do Simples Nacional (R$ ${simplesLimit.toLocaleString('pt-BR')}).`);
      return;
    }

    // Taxas por anexo (aproximação das faixas iniciais do Simples Nacional)
    // Nota: Esta é uma simulação baseada nas faixas iniciais. Para cálculo preciso, 
    // seria necessário considerar RBT12, tabelas completas e deduções por anexo.
    const annexRates = {
      'I': { rate: 4.0, name: 'Comércio', description: 'Taxa inicial - varia conforme faturamento' },
      'II': { rate: 4.5, name: 'Indústria', description: 'Taxa inicial - varia conforme faturamento' },
      'III': { rate: 6.0, name: 'Serviços Gerais', description: 'Taxa inicial - varia conforme faturamento' },
      'IV': { rate: 15.5, name: 'Serviços Específicos (Advocacia, etc)', description: 'Taxa inicial' },
      'V': { rate: 15.5, name: 'Serviços Específicos (Consultorias, etc)', description: 'Taxa inicial' }
    };

    const selectedAnnex = annexRates[simplesAnnex];
    
    // Simulação simplificada - em casos reais, deve-se usar a tabela completa do Simples
    let effectiveRate = selectedAnnex.rate;
    
    // Ajuste básico por faixa de faturamento (aproximação)
    if (revenue > 180000) effectiveRate += 0.5;
    if (revenue > 360000) effectiveRate += 0.5;
    if (revenue > 720000) effectiveRate += 1.0;
    if (revenue > 1800000) effectiveRate += 1.5;
    if (revenue > 3600000) effectiveRate += 2.0;
    
    const monthlyTax = (revenue / 12) * (effectiveRate / 100);
    const annualTax = revenue * (effectiveRate / 100);

    setResults(prev => ({
      ...prev,
      simples: {
        annexName: selectedAnnex.name,
        description: selectedAnnex.description,
        baseRate: selectedAnnex.rate,
        effectiveRate,
        monthlyTax,
        annualTax,
        revenue
      }
    }));

    showDisclaimer();
  };

  // Função para calcular Autônomos
  const calculateAutonomo = () => {
    const income = parseFloat(autonomoIncome.replace(/\./g, '').replace(',', '.'));
    const issRate = parseFloat(autonomoCity);
    
    if (isNaN(income) || income <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor de renda válido.');
      return;
    }

    // INSS
    const inssRate = inssType === 'full' ? 20 : 11;
    const inssValue = income * (inssRate / 100);
    
    // ISS
    const issValue = income * (issRate / 100);
    
    // Carnê-Leão (IRPF progressivo corrigido)
    // Base de cálculo para IRPF: renda bruta menos INSS
    const irpfBase = income - inssValue;
    let irpfValue = 0;
    
    // Tabela IRPF 2025 com cálculo progressivo correto
    if (irpfBase > 2259.20) {
      if (irpfBase <= 2826.65) {
        irpfValue = (irpfBase - 2259.20) * 0.075;
      } else if (irpfBase <= 3751.05) {
        irpfValue = (2826.65 - 2259.20) * 0.075 + (irpfBase - 2826.65) * 0.15;
      } else if (irpfBase <= 4664.68) {
        irpfValue = (2826.65 - 2259.20) * 0.075 + (3751.05 - 2826.65) * 0.15 + (irpfBase - 3751.05) * 0.225;
      } else {
        irpfValue = (2826.65 - 2259.20) * 0.075 + (3751.05 - 2826.65) * 0.15 + (4664.68 - 3751.05) * 0.225 + (irpfBase - 4664.68) * 0.275;
      }
    }

    const totalTaxes = inssValue + issValue + irpfValue;
    const netIncome = income - totalTaxes;
    const effectiveRate = (totalTaxes / income) * 100;

    setResults(prev => ({
      ...prev,
      autonomo: {
        income,
        inssValue,
        inssRate,
        issValue,
        issRate,
        irpfValue,
        totalTaxes,
        netIncome,
        effectiveRate
      }
    }));

    showDisclaimer();
  };

  // Função para calcular outros impostos
  const calculateOtherTaxes = () => {
    const income = parseFloat(otherIncome.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(income) || income <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor de faturamento válido.');
      return;
    }

    let taxValue = 0;
    let taxName = '';
    let taxRate = 0;

    switch (otherIncomeType) {
      case 'pisConfins':
        taxRate = 3.65; // Cumulativo
        taxValue = income * (taxRate / 100);
        taxName = 'PIS/COFINS (Cumulativo)';
        break;
      case 'pisConfinsNC':
        taxRate = 9.25; // Não cumulativo
        taxValue = income * (taxRate / 100);
        taxName = 'PIS/COFINS (Não Cumulativo)';
        break;
      case 'icms':
        taxRate = 12; // Taxa média ICMS
        taxValue = income * (taxRate / 100);
        taxName = 'ICMS (Média Nacional)';
        break;
      case 'ipi':
        taxRate = 7.5; // Taxa média IPI
        taxValue = income * (taxRate / 100);
        taxName = 'IPI (Média)';
        break;
      case 'iss':
        taxRate = 3.5; // Taxa média ISS
        taxValue = income * (taxRate / 100);
        taxName = 'ISS (Média Municipal)';
        break;
    }

    setResults(prev => ({
      ...prev,
      others: {
        income,
        taxValue,
        taxRate,
        taxName
      }
    }));

    showDisclaimer();
  };

  // Mostrar disclaimer
  const showDisclaimer = () => {
    setTimeout(() => {
      Alert.alert(
        'Importante - Disclaimer',
        'Este simulador é apenas uma ferramenta de estimativa básica. O Trampay não é um profissional contábil ou tributário. As informações podem conter erros e não substituem a consulta a um contador ou especialista em tributos. Recomendamos sempre consultar um profissional qualificado para decisões fiscais e tributárias.',
        [{ text: 'Entendi', style: 'default' }]
      );
    }, 500);
  };

  const resetCalculation = () => {
    setMeiIncome('');
    setSimplesRevenue('');
    setAutonomoIncome('');
    setOtherIncome('');
    setResults({});
  };

  // Renderizar calculadora MEI
  const renderMEICalculator = () => (
    <View style={styles.calculatorSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Faturamento Anual (MEI)</Text>
        <Text style={styles.inputDescription}>
          Limite máximo: R$ 81.000,00 por ano
        </Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.textInput}
            value={meiIncome}
            onChangeText={(text) => setMeiIncome(formatCurrency(text))}
            placeholder="0,00"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tipo de Atividade</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => setMeiType('comercio')}
          >
            <View style={[styles.radioCircle, meiType === 'comercio' && styles.radioSelected]} />
            <Text style={styles.radioText}>Comércio/Indústria (ICMS: R$ 1,00)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => setMeiType('servico')}
          >
            <View style={[styles.radioCircle, meiType === 'servico' && styles.radioSelected]} />
            <Text style={styles.radioText}>Serviços (ISS: R$ 5,00)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {results.mei && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Resultado MEI</Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>INSS (5% salário mínimo):</Text>
            <Text style={styles.resultValue}>R$ {results.mei.inss.toFixed(2)}/mês</Text>
          </View>
          {results.mei.iss > 0 && (
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>ISS (Serviços):</Text>
              <Text style={styles.resultValue}>R$ {results.mei.iss.toFixed(2)}/mês</Text>
            </View>
          )}
          {results.mei.icms > 0 && (
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>ICMS (Comércio/Indústria):</Text>
              <Text style={styles.resultValue}>R$ {results.mei.icms.toFixed(2)}/mês</Text>
            </View>
          )}
          <View style={[styles.resultItem, styles.highlightedResult]}>
            <Text style={styles.resultLabelBold}>Total Mensal:</Text>
            <Text style={styles.resultValueBold}>R$ {results.mei.monthlyTax.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Total Anual:</Text>
            <Text style={styles.resultValue}>R$ {results.mei.annualTax.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Taxa Efetiva:</Text>
            <Text style={styles.resultValue}>{results.mei.effectiveRate.toFixed(2)}%</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.calculateButton} onPress={calculateMEI}>
        <Text style={styles.calculateButtonText}>Calcular MEI</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar calculadora Simples Nacional
  const renderSimplesCalculator = () => (
    <View style={styles.calculatorSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Faturamento Anual (Simples Nacional)</Text>
        <Text style={styles.inputDescription}>
          Limite máximo: R$ 4.800.000,00 por ano
        </Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.textInput}
            value={simplesRevenue}
            onChangeText={(text) => setSimplesRevenue(formatCurrency(text))}
            placeholder="0,00"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Anexo (Tipo de Atividade)</Text>
        <View style={styles.pickerContainer}>
          {['I', 'II', 'III', 'IV', 'V'].map(annex => (
            <TouchableOpacity 
              key={annex}
              style={[styles.pickerOption, simplesAnnex === annex && styles.pickerSelected]}
              onPress={() => setSimplesAnnex(annex)}
            >
              <Text style={[styles.pickerText, simplesAnnex === annex && styles.pickerTextSelected]}>
                Anexo {annex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.inputDescription}>
          I: Comércio (4%) • II: Indústria (4,5%) • III: Serviços Gerais (6%) • IV/V: Serviços Específicos (15,5%)
        </Text>
      </View>

      {results.simples && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Resultado Simples Nacional</Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Anexo selecionado:</Text>
            <Text style={styles.resultValue}>{results.simples.annexName}</Text>
          </View>
          <Text style={[styles.inputDescription, { marginBottom: spacing.md }]}>
            {results.simples.description}
          </Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Taxa base:</Text>
            <Text style={styles.resultValue}>{results.simples.baseRate}%</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Taxa efetiva (ajustada):</Text>
            <Text style={styles.resultValue}>{results.simples.effectiveRate.toFixed(2)}%</Text>
          </View>
          <View style={[styles.resultItem, styles.highlightedResult]}>
            <Text style={styles.resultLabelBold}>Imposto Mensal:</Text>
            <Text style={styles.resultValueBold}>R$ {results.simples.monthlyTax.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Imposto Anual:</Text>
            <Text style={styles.resultValue}>R$ {results.simples.annualTax.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.calculateButton} onPress={calculateSimples}>
        <Text style={styles.calculateButtonText}>Calcular Simples</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar calculadora Autônomos
  const renderAutonomoCalculator = () => (
    <View style={styles.calculatorSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Renda Mensal (Pessoa Física)</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.textInput}
            value={autonomoIncome}
            onChangeText={(text) => setAutonomoIncome(formatCurrency(text))}
            placeholder="0,00"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tipo de Contribuição INSS</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => setInssType('full')}
          >
            <View style={[styles.radioCircle, inssType === 'full' && styles.radioSelected]} />
            <Text style={styles.radioText}>Contribuinte Individual (20%)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.radioOption}
            onPress={() => setInssType('simplified')}
          >
            <View style={[styles.radioCircle, inssType === 'simplified' && styles.radioSelected]} />
            <Text style={styles.radioText}>Plano Simplificado (11%)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Taxa ISS Municipal (%)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={autonomoCity}
            onChangeText={setAutonomoCity}
            placeholder="5"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
          <Text style={styles.percentSymbol}>%</Text>
        </View>
      </View>

      {results.autonomo && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Resultado Autônomo</Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>INSS ({results.autonomo.inssRate}%):</Text>
            <Text style={styles.resultValue}>R$ {results.autonomo.inssValue.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>ISS Municipal ({results.autonomo.issRate}%):</Text>
            <Text style={styles.resultValue}>R$ {results.autonomo.issValue.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>IRPF (Carnê-Leão):</Text>
            <Text style={styles.resultValue}>R$ {results.autonomo.irpfValue.toFixed(2)}</Text>
          </View>
          <View style={[styles.resultItem, styles.highlightedResult]}>
            <Text style={styles.resultLabelBold}>Total de Impostos:</Text>
            <Text style={styles.resultValueBold}>R$ {results.autonomo.totalTaxes.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Renda Líquida:</Text>
            <Text style={[styles.resultValue, { color: colors.success }]}>
              R$ {results.autonomo.netIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Taxa Efetiva:</Text>
            <Text style={styles.resultValue}>{results.autonomo.effectiveRate.toFixed(2)}%</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.calculateButton} onPress={calculateAutonomo}>
        <Text style={styles.calculateButtonText}>Calcular Autônomo</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar outros impostos
  const renderOtherTaxes = () => (
    <View style={styles.calculatorSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tipo de Imposto</Text>
        <View style={styles.pickerContainer}>
          <TouchableOpacity 
            style={[styles.pickerOption, otherIncomeType === 'pisConfins' && styles.pickerSelected]}
            onPress={() => setOtherIncomeType('pisConfins')}
          >
            <Text style={[styles.pickerText, otherIncomeType === 'pisConfins' && styles.pickerTextSelected]}>
              PIS/COFINS (3,65%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pickerOption, otherIncomeType === 'pisConfinsNC' && styles.pickerSelected]}
            onPress={() => setOtherIncomeType('pisConfinsNC')}
          >
            <Text style={[styles.pickerText, otherIncomeType === 'pisConfinsNC' && styles.pickerTextSelected]}>
              PIS/COFINS NC (9,25%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pickerOption, otherIncomeType === 'icms' && styles.pickerSelected]}
            onPress={() => setOtherIncomeType('icms')}
          >
            <Text style={[styles.pickerText, otherIncomeType === 'icms' && styles.pickerTextSelected]}>
              ICMS (~12%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pickerOption, otherIncomeType === 'ipi' && styles.pickerSelected]}
            onPress={() => setOtherIncomeType('ipi')}
          >
            <Text style={[styles.pickerText, otherIncomeType === 'ipi' && styles.pickerTextSelected]}>
              IPI (~7,5%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pickerOption, otherIncomeType === 'iss' && styles.pickerSelected]}
            onPress={() => setOtherIncomeType('iss')}
          >
            <Text style={[styles.pickerText, otherIncomeType === 'iss' && styles.pickerTextSelected]}>
              ISS (~3,5%)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Faturamento/Receita</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.textInput}
            value={otherIncome}
            onChangeText={(text) => setOtherIncome(formatCurrency(text))}
            placeholder="0,00"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
        </View>
      </View>

      {results.others && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Resultado - {results.others.taxName}</Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Base de Cálculo:</Text>
            <Text style={styles.resultValue}>R$ {results.others.income.toFixed(2)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Taxa Aplicada:</Text>
            <Text style={styles.resultValue}>{results.others.taxRate}%</Text>
          </View>
          <View style={[styles.resultItem, styles.highlightedResult]}>
            <Text style={styles.resultLabelBold}>Valor do Imposto:</Text>
            <Text style={styles.resultValueBold}>R$ {results.others.taxValue.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.calculateButton} onPress={calculateOtherTaxes}>
        <Text style={styles.calculateButtonText}>Calcular Imposto</Text>
      </TouchableOpacity>
    </View>
  );

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
          
          <Text style={styles.headerTitle}>Simulador de Impostos</Text>
          
          <TouchableOpacity style={styles.resetIcon} onPress={resetCalculation}>
            <MaterialIcons name="refresh" size={24} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {/* Calculator Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeCalculator === 'mei' && styles.activeTab]}
              onPress={() => setActiveCalculator('mei')}
            >
              <Text style={[styles.tabText, activeCalculator === 'mei' && styles.activeTabText]}>
                MEI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeCalculator === 'simples' && styles.activeTab]}
              onPress={() => setActiveCalculator('simples')}
            >
              <Text style={[styles.tabText, activeCalculator === 'simples' && styles.activeTabText]}>
                Simples Nacional
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeCalculator === 'autonomo' && styles.activeTab]}
              onPress={() => setActiveCalculator('autonomo')}
            >
              <Text style={[styles.tabText, activeCalculator === 'autonomo' && styles.activeTabText]}>
                Autônomos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeCalculator === 'outros' && styles.activeTab]}
              onPress={() => setActiveCalculator('outros')}
            >
              <Text style={[styles.tabText, activeCalculator === 'outros' && styles.activeTabText]}>
                Outros
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.disclaimerText}>
              Este simulador é apenas uma estimativa. O Trampay não é um profissional contábil. 
              As informações podem conter erros. Consulte sempre um contador qualificado.
            </Text>
          </View>

          {/* Render Active Calculator */}
          {activeCalculator === 'mei' && renderMEICalculator()}
          {activeCalculator === 'simples' && renderSimplesCalculator()}
          {activeCalculator === 'autonomo' && renderAutonomoCalculator()}
          {activeCalculator === 'outros' && renderOtherTaxes()}

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Informações Importantes:</Text>
            <Text style={styles.tipText}>
              • MEI: Limite de R$ 81.000 anuais, valores fixos mensais
            </Text>
            <Text style={styles.tipText}>
              • Simples: Taxas variam conforme faturamento e anexo
            </Text>
            <Text style={styles.tipText}>
              • Autônomos: INSS + ISS + IRPF progressivo
            </Text>
            <Text style={styles.tipText}>
              • Consulte sempre um contador para orientações precisas
            </Text>
          </View>
        </ScrollView>
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
    borderBottomColor: colors.border,
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

  resetIcon: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  tabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: colors.primary,
  },

  tabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
  },

  activeTabText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 16,
  },

  calculatorSection: {
    marginBottom: spacing.xl,
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

  radioContainer: {
    marginTop: spacing.sm,
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    marginRight: spacing.sm,
  },

  radioSelected: {
    backgroundColor: colors.primaryDark,
  },

  radioText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  pickerOption: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pickerSelected: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },

  pickerText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  pickerTextSelected: {
    color: colors.white,
  },

  calculateButton: {
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

export default TaxSimulatorScreen;