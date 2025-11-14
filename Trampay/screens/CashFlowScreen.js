// Tela do Fluxo de Caixa - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorage from '../utils/SecureStorage';
import { emit, on, Events } from '../utils/EventBus';
import { colors, fonts, spacing } from '../styles';
import { fetchBalance } from '../services/balanceService';
import api from '../services/api';
import AddTransactionModal from '../components/AddTransactionModal';
import PieChart from '../components/PieChart';
import LineChart from '../components/LineChart';

const { width } = Dimensions.get('window');

const CashFlowScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [addTransactionVisible, setAddTransactionVisible] = useState(false);
  const [periodTab, setPeriodTab] = useState('monthly'); // 'monthly' ou 'weekly'
  const [forecastTab, setForecastTab] = useState('today'); // 'today', 'tomorrow', 'future'
  const [searchQuery, setSearchQuery] = useState('');
  const [showMovements, setShowMovements] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetailsVisible, setTransactionDetailsVisible] = useState(false);
  const [cashflowData, setCashflowData] = useState([]);

  // Chaves de armazenamento
  const TRANSACTIONS_STORAGE_KEY = 'trampay_transactions';
  const BALANCE_STORAGE_KEY = 'trampay_balance';

  // Carregar dados iniciais
  useEffect(() => {
    loadTransactions();
    loadBalance();
    (async () => { try { await SecureStorage.migrateExistingData(TRANSACTIONS_STORAGE_KEY); } catch {} })();
    (async () => {
      try {
        const serverBalance = await fetchBalance('BRL');
        if (typeof serverBalance === 'number') {
          await saveBalance(serverBalance);
        }
        const resp = await api.get('/analytics/cashflow', { params: { period: periodTab === 'weekly' ? 'week' : 'month' } });
        if (resp?.data && Array.isArray(resp.data)) {
          setCashflowData(resp.data);
        }
      } catch (err) {}
    })();
  }, []);

  // Recarrega dados do gráfico ao trocar período
  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get('/analytics/cashflow', { params: { period: periodTab === 'weekly' ? 'week' : 'month' } });
        if (resp?.data && Array.isArray(resp.data)) {
          setCashflowData(resp.data);
        }
      } catch (err) {}
    })();
  }, [periodTab]);

  // Carregar transações
  const loadTransactions = async () => {
    try {
      const stored = await SecureStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (stored) {
        const transactionsList = Array.isArray(stored) ? stored : [];
        transactionsList.sort((a,b)=> new Date(b.transactionDate||b.createdAt) - new Date(a.transactionDate||a.createdAt));
        setTransactions(transactionsList);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  // Carregar saldo
  const loadBalance = async () => {
    try {
      const stored = await SecureStorage.getItem(BALANCE_STORAGE_KEY);
      if (stored !== null && stored !== undefined) {
        setBalance(parseFloat(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    }
  };

  // Salvar transações
  const saveTransactions = async (transactionsList) => {
    try {
      const sorted = [...transactionsList].sort((a,b)=> new Date(b.transactionDate||b.createdAt) - new Date(a.transactionDate||a.createdAt));
      await SecureStorage.setItem(TRANSACTIONS_STORAGE_KEY, sorted);
      setTransactions(sorted);
      emit(Events.TransactionsUpdated, sorted);
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      Alert.alert('Erro', 'Não foi possível salvar a transação');
    }
  };

  // Salvar saldo
  const saveBalance = async (newBalance) => {
    try {
      await SecureStorage.setItem(BALANCE_STORAGE_KEY, newBalance);
      setBalance(newBalance);
      emit(Events.BalanceUpdated, newBalance);
    } catch (error) {
      console.error('Erro ao salvar saldo:', error);
    }
  };

  // Adicionar nova transação
  const handleAddTransaction = async (transactionData) => {
    // Validar moeda base (apenas BRL para cálculo de saldo)
    const baseCurrency = 'BRL';
    
    const newTransaction = {
      ...transactionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: transactionData.isRecurring ? 'agendado' : 'concluído'
    };

    const updatedTransactions = [...transactions, newTransaction];
    await saveTransactions(updatedTransactions);

    // Atualizar saldo apenas se a transação não for recorrente E for da moeda base (tratando undefined como BRL)
    if (!transactionData.isRecurring && (transactionData.currency || 'BRL') === baseCurrency) {
      const newBalance = transactionData.type === 'income' 
        ? balance + transactionData.amount 
        : balance - transactionData.amount;
      await saveBalance(newBalance);
    } else if ((transactionData.currency || 'BRL') !== baseCurrency) {
      Alert.alert(
        'Informação', 
        'Transação salva! Nota: Apenas transações em BRL afetam o saldo principal.'
      );
    }

    setAddTransactionVisible(false);
  };

  useEffect(() => {
    const unsubBalance = on(Events.BalanceUpdated, (val) => {
      if (typeof val === 'number') setBalance(val);
    });
    const unsubTx = on(Events.TransactionsUpdated, (list) => {
      if (Array.isArray(list)) setTransactions(list);
    });
    return () => { unsubBalance(); unsubTx(); };
  }, []);

  // Calcular resumo financeiro
  const getFinancialSummary = () => {
    // Se houver dados do backend, usa eles para o resumo
    if (cashflowData && cashflowData.length > 0) {
      const income = cashflowData.reduce((sum, row) => sum + (Number(row.income) || 0), 0);
      const expenses = cashflowData.reduce((sum, row) => sum + (Number(row.expenses) || 0), 0);
      const total = income + expenses;
      const incomePercentage = total > 0 ? (income / total) * 100 : 50;
      const expensePercentage = total > 0 ? (expenses / total) * 100 : 50;
      return {
        income,
        expenses,
        incomePercentage: incomePercentage.toFixed(1),
        expensePercentage: expensePercentage.toFixed(1),
        total,
      };
    }

    // Fallback para dados locais
    const now = new Date();
    let startDate;
    if (periodTab === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000));
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    }
    const periodTransactions = transactions.filter(transaction => {
      const transactionDateStr = transaction.transactionDate || transaction.createdAt;
      const transactionDate = new Date(transactionDateStr);
      if (isNaN(transactionDate.getTime())) return false;
      const isBaseCurrency = (transaction.currency || 'BRL') === 'BRL';
      const isConcluded = transaction.status === 'concluído';
      return transactionDate >= startDate && transactionDate <= now && isBaseCurrency && isConcluded;
    });
    const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const total = income + expenses;
    const incomePercentage = total > 0 ? (income / total) * 100 : 50;
    const expensePercentage = total > 0 ? (expenses / total) * 100 : 50;
    return { income, expenses, incomePercentage: incomePercentage.toFixed(1), expensePercentage: expensePercentage.toFixed(1), total };
  };

  // Filtrar movimentações
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular previsão financeira (incluindo agendadas e recorrentes)
  const getFinancialForecast = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
    const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));

    const getForecastForPeriod = (startDate, endDate) => {
      const periodTransactions = transactions.filter(transaction => {
        // Use transactionDate (ISO) se disponível, senão use createdAt
        const dateToUse = transaction.transactionDate || transaction.createdAt;
        const transactionDate = new Date(dateToUse);
        transactionDate.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
        
        // Verificar se a data é válida
        if (isNaN(transactionDate.getTime())) {
          return false;
        }
        
        // Incluir transações agendadas (status !== 'concluído') e transações concluídas
        // Filtrar por período e moeda BRL
        return transactionDate >= startDate && transactionDate <= endDate && 
               (transaction.currency === 'BRL' || !transaction.currency);
      });

      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return { income, expenses };
    };

    // Para "future", incluir próximos 7 dias a partir de amanhã
    const futureEndDate = new Date(tomorrow.getTime() + (6 * 24 * 60 * 60 * 1000));

    return {
      today: getForecastForPeriod(today, today),
      tomorrow: getForecastForPeriod(tomorrow, tomorrow),
      future: getForecastForPeriod(tomorrow, futureEndDate)
    };
  };

  const summary = getFinancialSummary();
  const forecast = getFinancialForecast();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fluxo de Caixa</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Adicionar Entrada/Saída Button */}
        <TouchableOpacity
          style={styles.addTransactionButton}
          onPress={() => setAddTransactionVisible(true)}
        >
          <MaterialIcons name="add" size={24} color={colors.white} />
          <Text style={styles.addTransactionText}>Adicionar Entrada/Saída</Text>
        </TouchableOpacity>

        {/* Saldo em mãos */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceAmount}>R${balance.toFixed(2).replace('.', ',')}</Text>
          <Text style={styles.balanceLabel}>Saldo em mãos</Text>
        </View>

        {/* Resumo por período */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumo por período:</Text>
          
          {/* Period Tabs */}
          <View style={styles.periodTabs}>
            <TouchableOpacity
              style={[styles.periodTab, periodTab === 'monthly' && styles.periodTabActive]}
              onPress={() => setPeriodTab('monthly')}
            >
              <Text style={[styles.periodTabText, periodTab === 'monthly' && styles.periodTabActiveText]}>
                Mensal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodTab, periodTab === 'weekly' && styles.periodTabActive]}
              onPress={() => setPeriodTab('weekly')}
            >
              <Text style={[styles.periodTabText, periodTab === 'weekly' && styles.periodTabActiveText]}>
                Semanal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Lucro</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primaryDark }]} />
              <Text style={styles.legendText}>Despesa</Text>
            </View>
          </View>

          {/* Pie Chart */}
          <View style={styles.chartContainer}>
            <PieChart
              data={[
                { value: summary.income, color: colors.success, label: 'Lucro' },
                { value: summary.expenses, color: colors.primaryDark, label: 'Despesa' }
              ]}
              size={200}
            />
            <View style={styles.chartSummary}>
              <View style={styles.chartSummaryItem}>
                <Text style={styles.chartSummaryLabel}>Lucro</Text>
                <Text style={styles.chartSummaryValue}>R${summary.income.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.chartSummaryPercent}>{summary.incomePercentage}%</Text>
              </View>
              <View style={styles.chartSummaryItem}>
                <Text style={styles.chartSummaryLabel}>Despesa</Text>
                <Text style={styles.chartSummaryValue}>R${summary.expenses.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.chartSummaryPercent}>{summary.expensePercentage}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Histórico de Movimentações */}
        <View style={styles.movementsSection}>
          <View style={styles.movementsHeader}>
            <Text style={styles.sectionTitle}>Histórico de movimentações</Text>
            <TouchableOpacity
              onPress={() => setShowMovements(!showMovements)}
              style={styles.collapseButton}
            >
              <MaterialIcons 
                name={showMovements ? "expand-less" : "expand-more"} 
                size={24} 
                color={colors.primaryDark} 
              />
            </TouchableOpacity>
          </View>

          {showMovements && (
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Pesquisar movimentações..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <MaterialIcons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
              </View>

              {/* Transactions List */}
              <View style={styles.transactionsList}>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.slice(0, 10).map((transaction) => (
                    <TouchableOpacity 
                      key={transaction.id} 
                      style={styles.transactionItem}
                      onPress={() => {
                        setSelectedTransaction(transaction);
                        setTransactionDetailsVisible(true);
                      }}
                    >
                      <View style={styles.transactionAvatar}>
                        <MaterialIcons 
                          name={transaction.type === 'income' ? 'arrow-downward' : 'arrow-upward'} 
                          size={20} 
                          color={colors.white} 
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>
                          {transaction.description || 'Transação'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaction.type === 'income' ? colors.success : colors.danger }
                        ]}>
                          {transaction.type === 'income' ? '+' : '-'}R${transaction.amount.toFixed(2).replace('.', ',')}
                        </Text>
                        <Text style={styles.transactionCategory}>
                          {transaction.category || 'Variável'} • {transaction.currency || 'BRL'}
                        </Text>
                      </View>
                      <View style={styles.transactionStatus}>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textLight} />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="receipt" size={48} color={colors.textLight} />
                    <Text style={styles.emptyStateText}>
                      {searchQuery ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação registrada'}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Previsão Financeira */}
        <View style={styles.forecastSection}>
          <Text style={styles.sectionTitle}>Previsão financeira:</Text>
          <Text style={styles.forecastSubtitle}>com base em agendamentos e recorrências</Text>

          {/* Forecast Tabs */}
          <View style={styles.forecastTabs}>
            <TouchableOpacity
              style={[styles.forecastTab, forecastTab === 'today' && styles.forecastTabActive]}
              onPress={() => setForecastTab('today')}
            >
              <Text style={[styles.forecastTabText, forecastTab === 'today' && styles.forecastTabActiveText]}>
                Hoje
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.forecastTab, forecastTab === 'tomorrow' && styles.forecastTabActive]}
              onPress={() => setForecastTab('tomorrow')}
            >
              <Text style={[styles.forecastTabText, forecastTab === 'tomorrow' && styles.forecastTabActiveText]}>
                Amanhã
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.forecastTab, forecastTab === 'future' && styles.forecastTabActive]}
              onPress={() => setForecastTab('future')}
            >
              <Text style={[styles.forecastTabText, forecastTab === 'future' && styles.forecastTabActiveText]}>
                Futuras
              </Text>
            </TouchableOpacity>
          </View>

          {/* Forecast Values */}
          <View style={styles.forecastValues}>
            <Text style={styles.forecastAmount}>
              R${forecast[forecastTab].expenses.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.forecastAmountGreen}>
              R${forecast[forecastTab].income.toFixed(2).replace('.', ',')}
            </Text>
          </View>

          {/* Line Chart */}
          <View style={styles.lineChartContainer}>
            <View style={styles.chartLegendContainer}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: colors.success }]} />
                <Text style={styles.chartLegendText}>Entradas</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.chartLegendText}>Saídas</Text>
              </View>
            </View>
            <LineChart
              data={{
                income: forecast[forecastTab].income,
                expenses: forecast[forecastTab].expenses
              }}
              width={width - 40}
              height={150}
            />
          </View>
        </View>
      </ScrollView>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        visible={addTransactionVisible}
        onClose={() => setAddTransactionVisible(false)}
        onAdd={handleAddTransaction}
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={transactionDetailsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setTransactionDetailsVisible(false);
          setSelectedTransaction(null);
        }}
      >
        {selectedTransaction && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => {
                  setTransactionDetailsVisible(false);
                  setSelectedTransaction(null);
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalhes da Transação</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Informações Básicas</Text>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Descrição:</Text>
                  <Text style={styles.modalValue}>{selectedTransaction.description || 'Transação'}</Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Valor:</Text>
                  <Text style={[styles.modalValue, styles.modalAmount, {
                    color: selectedTransaction.type === 'income' ? colors.success : colors.danger
                  }]}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}R${selectedTransaction.amount.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Moeda:</Text>
                  <Text style={styles.modalValue}>{selectedTransaction.currency || 'BRL'}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Detalhes</Text>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Tipo:</Text>
                  <Text style={styles.modalValue}>
                    {selectedTransaction.type === 'income' ? 'Entrada' : 'Saída'}
                  </Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Categoria:</Text>
                  <Text style={styles.modalValue}>{selectedTransaction.category || 'Variável'}</Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <Text style={[styles.modalValue, {
                    color: selectedTransaction.status === 'concluído' ? colors.success : colors.warning
                  }]}>
                    {selectedTransaction.status}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Datas</Text>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Data da transação:</Text>
                  <Text style={styles.modalValue}>
                    {selectedTransaction.transactionDate ? 
                      new Date(selectedTransaction.transactionDate).toLocaleDateString('pt-BR') :
                      new Date(selectedTransaction.createdAt).toLocaleDateString('pt-BR')
                    }
                  </Text>
                </View>
                <View style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Criada em:</Text>
                  <Text style={styles.modalValue}>
                    {new Date(selectedTransaction.createdAt).toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>

              {selectedTransaction.isRecurring && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Recorrência</Text>
                  <View style={styles.modalItem}>
                    <Text style={styles.modalLabel}>Transação recorrente:</Text>
                    <Text style={styles.modalValue}>Sim</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
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
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  addTransactionText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  balanceCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceAmount: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  summarySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    borderRadius: 25,
    padding: 4,
    marginBottom: spacing.lg,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 21,
  },
  periodTabActive: {
    backgroundColor: colors.primaryDark,
  },
  periodTabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  periodTabActiveText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  chartContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  chartLabels: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  chartPercentage: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: 'center',
  },
  movementsSection: {
    marginBottom: spacing.xl,
  },
  movementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  collapseButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm + 2,
  },
  transactionsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 2,
  },
  transactionDetails: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  transactionCategory: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 2,
  },
  transactionStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  forecastSection: {
    marginBottom: spacing.xl,
  },
  forecastSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  forecastTabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.lg,
  },
  forecastTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  forecastTabActive: {
    backgroundColor: colors.primaryDark,
  },
  forecastTabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  forecastTabActiveText: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  forecastValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  forecastAmount: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  forecastAmountGreen: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.success,
  },
  lineChartContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  
  // Estilos para o gráfico de pizza atualizado
  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  chartSummaryItem: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  chartSummaryLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  chartSummaryValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  chartSummaryPercent: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  // Estilos para legendas do line chart
  chartLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  chartLegendText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },

  // Estilos para o modal de detalhes
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalBackButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    flex: 1,
    marginRight: 44,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
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
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacing.sm,
  },
  modalItem: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  modalValue: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 22,
  },
  modalAmount: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
});

export default CashFlowScreen;
