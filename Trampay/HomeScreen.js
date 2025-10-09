// Tela Home do Trampay com Dashboard completo
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
  StyleSheet,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from './styles';
import TransactionModal from './components/TransactionModal';
import SideMenu from './components/SideMenu';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, user, route }) => {
  // Pega dados do usuário dos parâmetros da rota ou props
  const currentUser = route?.params?.user || user;
  // Estados para filtros e dados
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [transactionFilter, setTransactionFilter] = useState('Entrada');
  const [timeFilter, setTimeFilter] = useState('Hoje');
  const [searchText, setSearchText] = useState('');
  const [chartPeriod, setChartPeriod] = useState('Hoje');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [filterValues, setFilterValues] = useState({
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });
  const [userTransactions, setUserTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [balance, setBalance] = useState(0);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'meeting', // meeting, payment, deadline, appointment, reminder
    client: '',
    amount: '',
    priority: 'medium', // low, medium, high
    location: '',
    reminder: '15', // minutes before
    recurring: false,
    frequency: 'none' // none, daily, weekly, monthly
  });

  // Chaves de armazenamento compartilhadas com CashFlowScreen
  const TRANSACTIONS_STORAGE_KEY = 'trampay_transactions';
  const BALANCE_STORAGE_KEY = 'trampay_balance';
  
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Usuário';

  // Usar apenas transações reais do SecureStore (integração completa com CashFlowScreen)
  const allTransactions = userTransactions;

  const filteredTransactions = allTransactions.filter(t => {
    // Filtro por tipo (Entrada/Saída)
    if (transactionFilter === 'Entrada' && t.type !== 'income') return false;
    if (transactionFilter === 'Saída' && t.type !== 'expense') return false;

    // Filtrar apenas moeda base (BRL) e transações concluídas (alinhado com saldo e gráficos)
    const isBaseCurrency = (t.currency || 'BRL') === 'BRL';
    const isConcluded = t.status === 'concluído';
    if (!isBaseCurrency || !isConcluded) return false;

    // Filtro por texto de busca (adaptado para a nova estrutura de dados)
    const searchableText = (t.description || t.name || '').toLowerCase();
    if (searchText && !searchableText.includes(searchText.toLowerCase())) return false;

    // Filtro por valor (usando filterValues)
    if (filterValues.minAmount && Math.abs(t.amount) < parseFloat(filterValues.minAmount)) return false;
    if (filterValues.maxAmount && Math.abs(t.amount) > parseFloat(filterValues.maxAmount)) return false;

    // Filtro temporal baseado em datas reais das transações
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
    const dayAfterTomorrow = new Date(tomorrow.getTime() + (24 * 60 * 60 * 1000));
    
    // Use transactionDate se disponível, senão use createdAt (alinhado com CashFlowScreen)
    const transactionDateStr = t.transactionDate || t.createdAt;
    const transactionDate = new Date(transactionDateStr);
    
    // Exclui transações com datas inválidas (não força exibição)
    if (isNaN(transactionDate.getTime())) {
      return false;
    }
    
    const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
    
    if (timeFilter === 'Hoje') {
      return transactionDay.getTime() === today.getTime();
    } else if (timeFilter === 'Amanhã') {
      return transactionDay.getTime() === tomorrow.getTime();
    } else if (timeFilter === 'Futuros') {
      return transactionDay.getTime() >= dayAfterTomorrow.getTime();
    }

    return true;
  });


  // Carrega dados salvos ao iniciar
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      // Carrega transações do SecureStore (mesmo sistema do fluxo de caixa)
      const savedTransactions = await SecureStore.getItemAsync(TRANSACTIONS_STORAGE_KEY);
      if (savedTransactions) {
        setUserTransactions(JSON.parse(savedTransactions));
      }

      // Carrega saldo do SecureStore (mesmo sistema do fluxo de caixa)
      const savedBalance = await SecureStore.getItemAsync(BALANCE_STORAGE_KEY);
      if (savedBalance) {
        setBalance(parseFloat(savedBalance));
      }

      // Carrega eventos do AsyncStorage (funcionalidade específica da HomeScreen)
      const savedEvents = await AsyncStorage.getItem('userEvents');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
      console.log('Dados carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const saveDataToStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`${key} salvo com sucesso`);
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
    }
  };

  // Função para salvar dados no SecureStore (compartilhado com CashFlowScreen)
  const saveSecureData = async (key, data) => {
    try {
      await SecureStore.setItemAsync(key, JSON.stringify(data));
      console.log(`${key} salvo com sucesso no SecureStore`);
    } catch (error) {
      console.error(`Erro ao salvar ${key} no SecureStore:`, error);
    }
  };

  // Função para adicionar nova transação com persistência (integrada com fluxo de caixa)
  const handleAddTransaction = async (transactionData) => {
    const baseCurrency = 'BRL';
    
    const newTransaction = {
      ...transactionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: transactionData.isRecurring ? 'agendado' : 'concluído'
    };

    const updatedTransactions = [...userTransactions, newTransaction];
    setUserTransactions(updatedTransactions);
    await saveSecureData(TRANSACTIONS_STORAGE_KEY, updatedTransactions);

    // Atualizar saldo apenas se a transação não for recorrente E for da moeda base
    if (!transactionData.isRecurring && (transactionData.currency || 'BRL') === baseCurrency) {
      const newBalance = transactionData.type === 'income' 
        ? balance + transactionData.amount 
        : balance - transactionData.amount;
      setBalance(newBalance);
      await SecureStore.setItemAsync(BALANCE_STORAGE_KEY, newBalance.toString());
    }

    Alert.alert('Sucesso!', 'Transação adicionada e salva!');
  };

  // Função para adicionar novo evento com persistência
  const handleAddEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      Alert.alert('Erro', 'Preencha pelo menos título, data e horário.');
      return;
    }

    const newEvent = {
      ...eventForm,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveDataToStorage('userEvents', updatedEvents);
    
    // Reset form
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      type: 'meeting',
      client: '',
      amount: '',
      priority: 'medium',
      location: '',
      reminder: '15',
      recurring: false,
      frequency: 'none'
    });
    
    setShowEventModal(false);
    Alert.alert('Sucesso!', 'Evento criado e salvo!');
  };

  const updateEventForm = (field, value) => {
    setEventForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcula valores para o gráfico considerando período baseado em datas reais
  const calculateChartData = () => {
    const now = new Date();
    let startDate = now;
    
    // Define período baseado no filtro selecionado
    if (chartPeriod === 'Hoje') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (chartPeriod === 'Esta semana') {
      // Últimos 7 dias (alinhado com CashFlowScreen)
      startDate = new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000));
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    } else if (chartPeriod === 'Este Mês') {
      // Primeiro dia do mês atual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Filtra transações pelo período selecionado (apenas BRL e concluídas)
    const transactionsToChart = allTransactions.filter(transaction => {
      const transactionDateStr = transaction.transactionDate || transaction.createdAt;
      const transactionDate = new Date(transactionDateStr);
      
      if (isNaN(transactionDate.getTime())) {
        return false; // Ignora transações com datas inválidas
      }
      
      // Filtrar apenas moeda base (BRL) e transações concluídas para alinhar com saldo
      const isBaseCurrency = (transaction.currency || 'BRL') === 'BRL';
      const isConcluded = transaction.status === 'concluído';
      
      return transactionDate >= startDate && transactionDate <= now &&
             isBaseCurrency && isConcluded;
    });
    
    const income = transactionsToChart
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactionsToChart
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses };
  };

  const { income, expenses } = calculateChartData();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileIcon}>
              <View style={styles.profileIconInner}>
                <Text style={styles.profileInitial}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.greeting}>
              Olá, {'\n'}<Text style={styles.userName}>{userName}</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.notificationIcon}>
                <Ionicons name="notifications" size={24} color={colors.white} />
                <View style={styles.notificationBadge} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSideMenu(true)}
            >
              <MaterialIcons name="menu" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Dashboard' && styles.activeTab]}
            onPress={() => setActiveTab('Dashboard')}
          >
            <Text style={[styles.tabText, activeTab === 'Dashboard' && styles.activeTabText]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Agenda' && styles.activeTab]}
            onPress={() => setActiveTab('Agenda')}
          >
            <Text style={[styles.tabText, activeTab === 'Agenda' && styles.activeTabText]}>
              Agenda
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Dashboard' && (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceAmount}>R${balance.toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.balanceLabel}>Saldo em mãos</Text>
            </View>

            {/* Function Buttons Grid */}
            <View style={styles.functionsGrid}>
              <TouchableOpacity style={styles.functionButton} onPress={() => navigation.navigate('FluxoCaixa')}>
                <View style={styles.functionIconContainer}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={colors.primaryDark} />
                </View>
                <Text style={styles.functionText}>Fluxo Caixa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.functionButton} onPress={() => navigation.navigate('Precificacao')}>
                <View style={styles.functionIconContainer}>
                  <MaterialIcons name="attach-money" size={20} color={colors.primaryDark} />
                </View>
                <Text style={styles.functionText}>Precificação</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.functionButton} onPress={() => navigation.navigate('CambioTrading')}>
                <View style={styles.functionIconContainer}>
                  <MaterialIcons name="swap-horiz" size={20} color={colors.primaryDark} />
                </View>
                <Text style={styles.functionText}>Câmbio e Trading</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.functionButton} onPress={() => navigation.navigate('MeuNegocio')}>
                <View style={styles.functionIconContainer}>
                  <MaterialIcons name="business-center" size={20} color={colors.primaryDark} />
                </View>
                <Text style={styles.functionText}>Meu Negócio</Text>
              </TouchableOpacity>
            </View>

            {/* Transactions History */}
            <Text style={styles.sectionTitle}>Histórico de movimentações:</Text>

            {/* Transaction Filters */}
            <View style={styles.transactionFilters}>
              <TouchableOpacity
                style={[styles.filterButton, transactionFilter === 'Entrada' && styles.activeFilter]}
                onPress={() => setTransactionFilter('Entrada')}
              >
                <Text style={[styles.filterText, transactionFilter === 'Entrada' && styles.activeFilterText]}>
                  Entrada
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, transactionFilter === 'Saída' && styles.activeFilter]}
                onPress={() => setTransactionFilter('Saída')}
              >
                <Text style={[styles.filterText, transactionFilter === 'Saída' && styles.activeFilterText]}>
                  Saída
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Filters */}
            <View style={styles.timeFilters}>
              {['Hoje', 'Amanhã', 'Futuros'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.timeFilter, timeFilter === period && styles.activeTimeFilter]}
                  onPress={() => setTimeFilter(period)}
                >
                  <Text style={[styles.timeFilterText, timeFilter === period && styles.activeTimeFilterText]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquise aqui"
                placeholderTextColor={colors.placeholder}
                value={searchText}
                onChangeText={setSearchText}
              />
              <TouchableOpacity style={styles.searchIcon}>
                <Ionicons name="search" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterIcon}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="options" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>

            {/* Transaction List */}
            <View style={styles.transactionsContainer}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionHeaderText}>Transações</Text>
                <TouchableOpacity>
                  <Text style={styles.filterByText}>Filtrar por nova</Text>
                </TouchableOpacity>
              </View>

              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <MaterialIcons 
                        name={transaction.type === 'income' ? 'arrow-downward' : 'arrow-upward'} 
                        size={20} 
                        color={colors.white} 
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{transaction.description || 'Transação'}</Text>
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
                      <Text style={styles.transactionCategory}>{transaction.category || 'Variável'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTransactions}>
                  <MaterialIcons name="receipt" size={48} color={colors.textLight} />
                  <Text style={styles.emptyTransactionsText}>
                    {searchText || timeFilter !== 'Hoje' ? 'Nenhuma transação encontrada' : 'Nenhuma transação registrada ainda'}
                  </Text>
                  <Text style={styles.emptyTransactionsSubtext}>
                    Use o botão abaixo ou acesse "Fluxo Caixa" para adicionar movimentações
                  </Text>
                </View>
              )}

              {/* Add New Transaction Button */}
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => setShowTransactionModal(true)}
              >
                <MaterialIcons name="add" size={20} color={colors.white} />
                <Text style={styles.addButtonText}>Adicionar nova</Text>
              </TouchableOpacity>
            </View>

            {/* Chart Section */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Gráfico de despesas x receita</Text>

              {/* Chart Period Filters */}
              <View style={styles.chartFilters}>
                {['Hoje', 'Esta semana', 'Este Mês'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.chartFilter, chartPeriod === period && styles.activeChartFilter]}
                    onPress={() => setChartPeriod(period)}
                  >
                    <Text style={[styles.chartFilterText, chartPeriod === period && styles.activeChartFilterText]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chart Values */}
              <View style={styles.chartValues}>
                <View style={styles.chartValueItem}>
                  <Text style={styles.chartValueLabel}>Despesas</Text>
                  <Text style={styles.expenseValue}>R${expenses.toFixed(2)}</Text>
                </View>
                <View style={styles.chartValueItem}>
                  <Text style={styles.chartValueLabel}>Receitas</Text>
                  <Text style={styles.incomeValue}>R${income.toFixed(2)}</Text>
                </View>
              </View>

              {/* Interactive Chart */}
              <View style={styles.chartContainer}>
                <View style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarIncome,
                      { height: income > 0 ? Math.max((income / (income + expenses)) * 100, 10) : 10 }
                    ]}
                  />
                  <View 
                    style={[
                      styles.chartBarExpense,
                      { height: expenses > 0 ? Math.max((expenses / (income + expenses)) * 100, 10) : 10 }
                    ]}
                  />
                </View>
                
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Receitas</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
                    <Text style={styles.legendText}>Despesas</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'Agenda' && (
          <View style={styles.agendaContainer}>
            {/* Agenda Header */}
            <View style={styles.agendaHeader}>
              <Text style={styles.agendaTitle}>Minha Agenda</Text>
              <TouchableOpacity 
                style={styles.addEventButton}
                onPress={() => setShowEventModal(true)}
              >
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Calendar View */}
            <View style={styles.calendarContainer}>
              <Text style={styles.calendarTitle}>Setembro 2025</Text>
              
              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <Text key={index} style={styles.dayHeader}>{day}</Text>
                ))}
                
                {Array.from({ length: 30 }, (_, i) => (
                  <TouchableOpacity key={i} style={styles.calendarDay}>
                    <Text style={styles.dayText}>{i + 1}</Text>
                    {events.filter(event => new Date(event.date).getDate() === i + 1).length > 0 && (
                      <View style={styles.eventDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Events List */}
            <View style={styles.eventsContainer}>
              <Text style={styles.eventsTitle}>Próximos eventos</Text>
              {events.length === 0 ? (
                <Text style={styles.noEventsText}>Nenhum evento agendado</Text>
              ) : (
                events.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventIcon}>
                      <Ionicons name="calendar" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>{event.date}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Side Menu Modal */}
      <Modal
        visible={showSideMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSideMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => setShowSideMenu(false)}
          />
          <View style={styles.sideMenuContainer}>
            <SideMenu 
              navigation={navigation} 
              user={currentUser}
              onClose={() => setShowSideMenu(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtrar Transações</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filtrar por Valor</Text>
              <View style={styles.valueFilterContainer}>
                <TextInput
                  style={styles.valueInput}
                  placeholder="Valor mínimo"
                  keyboardType="numeric"
                  value={filterValues.minAmount}
                  onChangeText={(value) => setFilterValues(prev => ({...prev, minAmount: value}))}
                />
                <TextInput
                  style={styles.valueInput}
                  placeholder="Valor máximo"
                  keyboardType="numeric"
                  value={filterValues.maxAmount}
                  onChangeText={(value) => setFilterValues(prev => ({...prev, maxAmount: value}))}
                />
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filtrar por Data</Text>
              <View style={styles.dateFilterContainer}>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Data inicial</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Data final</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => {
                  setFilterValues({
                    minAmount: '',
                    maxAmount: '',
                    startDate: '',
                    endDate: ''
                  });
                }}
              >
                <Text style={styles.clearFilterText}>Limpar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFilterButton}
                onPress={() => {
                  // Aplicar filtros será feito na lógica de filteredTransactions
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyFilterText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Novo Evento</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.eventFormContainer}>
              {/* Título do Evento */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Título do Evento *</Text>
                <TextInput
                  style={styles.valueInput}
                  placeholder="Ex: Reunião com cliente"
                  value={eventForm.title}
                  onChangeText={(value) => updateEventForm('title', value)}
                />
              </View>
              
              {/* Tipo de Evento */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Tipo de Evento</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.eventTypeContainer}>
                    {[
                      { id: 'meeting', label: 'Reunião', icon: 'people' },
                      { id: 'payment', label: 'Pagamento', icon: 'card' },
                      { id: 'deadline', label: 'Prazo', icon: 'alarm' },
                      { id: 'appointment', label: 'Consulta', icon: 'calendar' },
                      { id: 'reminder', label: 'Lembrete', icon: 'notifications' }
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.eventTypeButton,
                          eventForm.type === type.id && styles.eventTypeButtonActive
                        ]}
                        onPress={() => updateEventForm('type', type.id)}
                      >
                        <Ionicons 
                          name={type.icon} 
                          size={16} 
                          color={eventForm.type === type.id ? colors.white : colors.primaryDark} 
                        />
                        <Text style={[
                          styles.eventTypeText,
                          eventForm.type === type.id && styles.eventTypeTextActive
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Data e Horário */}
              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.filterSectionTitle}>Data *</Text>
                  <TextInput
                    style={styles.valueInput}
                    placeholder="DD/MM/AAAA"
                    value={eventForm.date}
                    onChangeText={(value) => updateEventForm('date', value)}
                  />
                </View>
                
                <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.filterSectionTitle}>Horário *</Text>
                  <TextInput
                    style={styles.valueInput}
                    placeholder="HH:MM"
                    value={eventForm.time}
                    onChangeText={(value) => updateEventForm('time', value)}
                  />
                </View>
              </View>

              {/* Cliente/Participante */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Cliente/Participante</Text>
                <TextInput
                  style={styles.valueInput}
                  placeholder="Nome do cliente ou participante"
                  value={eventForm.client}
                  onChangeText={(value) => updateEventForm('client', value)}
                />
              </View>

              {/* Valor (para eventos de pagamento) */}
              {eventForm.type === 'payment' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.filterSectionTitle}>Valor</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>R$</Text>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0,00"
                      value={eventForm.amount}
                      onChangeText={(value) => updateEventForm('amount', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {/* Local */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Local</Text>
                <TextInput
                  style={styles.valueInput}
                  placeholder="Endereço ou link da reunião"
                  value={eventForm.location}
                  onChangeText={(value) => updateEventForm('location', value)}
                />
              </View>

              {/* Descrição */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Descrição</Text>
                <TextInput
                  style={[styles.valueInput, styles.textAreaInput]}
                  placeholder="Detalhes do evento..."
                  value={eventForm.description}
                  onChangeText={(value) => updateEventForm('description', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Prioridade */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Prioridade</Text>
                <View style={styles.priorityContainer}>
                  {[
                    { id: 'low', label: 'Baixa', color: '#4CAF50' },
                    { id: 'medium', label: 'Média', color: '#FF9800' },
                    { id: 'high', label: 'Alta', color: '#F44336' }
                  ].map((priority) => (
                    <TouchableOpacity
                      key={priority.id}
                      style={[
                        styles.priorityButton,
                        { borderColor: priority.color },
                        eventForm.priority === priority.id && { backgroundColor: priority.color }
                      ]}
                      onPress={() => updateEventForm('priority', priority.id)}
                    >
                      <Text style={[
                        styles.priorityText,
                        eventForm.priority === priority.id && { color: colors.white }
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Lembrete */}
              <View style={styles.inputContainer}>
                <Text style={styles.filterSectionTitle}>Lembrete</Text>
                <View style={styles.reminderContainer}>
                  {[
                    { id: '0', label: 'Sem lembrete' },
                    { id: '15', label: '15 min antes' },
                    { id: '30', label: '30 min antes' },
                    { id: '60', label: '1 hora antes' },
                    { id: '1440', label: '1 dia antes' }
                  ].map((reminder) => (
                    <TouchableOpacity
                      key={reminder.id}
                      style={[
                        styles.reminderButton,
                        eventForm.reminder === reminder.id && styles.reminderButtonActive
                      ]}
                      onPress={() => updateEventForm('reminder', reminder.id)}
                    >
                      <Text style={[
                        styles.reminderText,
                        eventForm.reminder === reminder.id && styles.reminderTextActive
                      ]}>
                        {reminder.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.clearFilterText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyFilterButton}
                onPress={handleAddEvent}
              >
                <Text style={styles.applyFilterText}>Criar Evento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Modal */}
      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSave={handleAddTransaction}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  // Header Styles
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileIcon: {
    width: 50,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  profileIconInner: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitial: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
  },

  notificationIcon: {
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.white,
  },

  greeting: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.regular,
  },

  userName: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },

  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconText: {
    color: colors.white,
    fontSize: 20,
  },

  // Tabs Styles
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
  },

  activeTab: {
    backgroundColor: colors.primaryDark,
  },

  tabText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 14,
  },

  activeTabText: {
    color: colors.white,
  },

  // Balance Card Styles
  balanceCard: {
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },

  balanceAmount: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  balanceLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontFamily: fonts.regular,
  },

  // Functions Grid Styles
  functionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },

  functionButton: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  functionIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  functionIcon: {
    fontSize: 20,
  },

  functionText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  // Transaction Filters
  transactionFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
  },

  activeFilter: {
    backgroundColor: colors.primaryDark,
  },

  filterText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 14,
  },

  activeFilterText: {
    color: colors.white,
  },

  // Time Filters
  timeFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  timeFilter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },

  activeTimeFilter: {
    backgroundColor: colors.primary,
  },

  timeFilterText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  activeTimeFilterText: {
    color: colors.white,
  },

  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },

  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },

  searchIcon: {
    padding: spacing.sm,
  },

  filterIcon: {
    padding: spacing.sm,
  },

  // Transactions Styles
  transactionsContainer: {
    paddingHorizontal: spacing.lg,
  },

  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  transactionHeaderText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  filterByText: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: fonts.regular,
  },

  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  transactionIconText: {
    color: colors.white,
    fontSize: 16,
  },

  transactionInfo: {
    flex: 1,
  },

  transactionName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  transactionDate: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: fonts.regular,
  },

  transactionDetails: {
    alignItems: 'flex-end',
  },

  transactionType: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  transactionCategory: {
    fontSize: 11,
    color: colors.textLight,
    fontFamily: fonts.regular,
  },

  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.md,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },

  addButtonText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 14,
  },

  // Chart Styles
  chartSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },

  chartTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  chartFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  chartFilter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },

  activeChartFilter: {
    backgroundColor: colors.primary,
  },

  chartFilterText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  activeChartFilterText: {
    color: colors.white,
  },

  chartValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  expenseValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.error,
  },

  incomeValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.success,
  },

  chartPlaceholder: {
    height: 200,
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  chartLine: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    alignItems: 'center',
  },

  chartPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  chartNote: {
    position: 'absolute',
    bottom: spacing.md,
    fontSize: 12,
    color: colors.textLight,
    fontFamily: fonts.regular,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  sideMenuContainer: {
    width: '80%',
    backgroundColor: colors.white,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Agenda Styles
  agendaContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  agendaTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  addEventButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  calendarContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  calendarTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },

  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    position: 'relative',
  },

  dayText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  eventsContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  eventsTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  noEventsText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },

  eventIcon: {
    marginRight: spacing.md,
  },

  eventInfo: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  eventDate: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },

  // Enhanced Chart Styles
  chartValueItem: {
    alignItems: 'center',
  },

  chartValueLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },

  chartContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  chartBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  chartBarIncome: {
    width: 40,
    backgroundColor: colors.success,
    borderRadius: 4,
    minHeight: 10,
  },

  chartBarExpense: {
    width: 40,
    backgroundColor: colors.error,
    borderRadius: 4,
    minHeight: 10,
  },

  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  legendText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  filterModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '70%',
  },

  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacing.md,
  },

  filterModalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  filterSection: {
    marginBottom: spacing.lg,
  },

  filterSectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },

  valueFilterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  valueInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  dateFilterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  dateButton: {
    flex: 1,
    height: 48,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  applyFilterButton: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventFormContainer: {
    paddingVertical: spacing.md,
  },

  inputContainer: {
    marginBottom: spacing.md,
  },

  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  eventTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  eventTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    gap: spacing.xs,
  },

  eventTypeButtonActive: {
    backgroundColor: colors.primaryDark,
  },

  eventTypeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
  },

  eventTypeTextActive: {
    color: colors.white,
  },

  amountInputContainer: {
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

  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },

  priorityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  priorityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },

  priorityText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primaryDark,
  },

  reminderContainer: {
    flexDirection: 'column',
    gap: spacing.xs,
  },

  reminderButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },

  reminderButtonActive: {
    backgroundColor: colors.primary,
  },

  reminderText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  reminderTextActive: {
    color: colors.white,
  },

  applyFilterText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },

  filterButtonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  clearFilterButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearFilterText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  
  // Novos estilos para transações atualizadas
  transactionAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginTop: spacing.md,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default HomeScreen;