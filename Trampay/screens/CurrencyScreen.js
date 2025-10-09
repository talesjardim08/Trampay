// Tela de Cotações Internacionais - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts, spacing } from '../styles';

const { width } = Dimensions.get('window');

const CurrencyScreen = ({ navigation, route }) => {
  const [currencies, setCurrencies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('rates'); // 'rates', 'converter', 'favorites'
  const [converterFrom, setConverterFrom] = useState('USD');
  const [converterTo, setConverterTo] = useState('BRL');
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');

  const FAVORITES_STORAGE_KEY = 'currency_favorites';
  
  // Lista de moedas principais (incluindo BRL)
  const mainCurrencies = [
    { code: 'BRL', name: 'Real Brasileiro', flag: '🇧🇷' },
    { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
    { code: 'JPY', name: 'Iene Japonês', flag: '🇯🇵' },
    { code: 'CAD', name: 'Dólar Canadense', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dólar Australiano', flag: '🇦🇺' },
    { code: 'CHF', name: 'Franco Suíço', flag: '🇨🇭' },
    { code: 'CNY', name: 'Yuan Chinês', flag: '🇨🇳' },
    { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷' },
    { code: 'CLP', name: 'Peso Chileno', flag: '🇨🇱' }
  ];

  // Carregar cotações
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      
      // Buscar principais moedas (excluir BRL para evitar par inválido BRL-BRL)
      const currencyPairs = mainCurrencies
        .filter(curr => curr.code !== 'BRL')
        .map(curr => `${curr.code}-BRL`)
        .join(',');
      
      const response = await fetch(
        `https://economia.awesomeapi.com.br/json/last/${currencyPairs}`
      );
      
      const data = await response.json();
      
      const currencyData = mainCurrencies.map(curr => {
        // BRL é a moeda base, então tem rate = 1
        if (curr.code === 'BRL') {
          return {
            ...curr,
            rate: 1.00,
            change: 0,
            high: 1.00,
            low: 1.00,
            timestamp: new Date().toISOString()
          };
        }
        
        const key = `${curr.code}BRL`;
        const apiData = data[key];
        
        if (apiData) {
          return {
            ...curr,
            rate: parseFloat(apiData.bid),
            change: parseFloat(apiData.pctChange || 0),
            high: parseFloat(apiData.high || 0),
            low: parseFloat(apiData.low || 0),
            timestamp: apiData.create_date
          };
        }
        return {
          ...curr,
          rate: 0,
          change: 0,
          high: 0,
          low: 0,
          timestamp: new Date().toISOString()
        };
      });

      setCurrencies(currencyData);
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as cotações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar favoritos
  const loadFavorites = async () => {
    try {
      const stored = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  // Salvar favoritos
  const saveFavorites = async (newFavorites) => {
    try {
      await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  };

  // Toggle favorito
  const toggleFavorite = (currencyCode) => {
    const newFavorites = favorites.includes(currencyCode)
      ? favorites.filter(fav => fav !== currencyCode)
      : [...favorites, currencyCode];
    
    saveFavorites(newFavorites);
  };

  // Converter moeda
  const convertCurrency = () => {
    const fromCurrency = currencies.find(c => c.code === converterFrom);
    const toCurrency = currencies.find(c => c.code === converterTo);
    
    if (!fromCurrency || !toCurrency || !amount) {
      setConvertedAmount('0');
      return;
    }

    let result = 0;
    
    if (converterFrom === 'BRL' && converterTo !== 'BRL') {
      // BRL para outra moeda
      result = parseFloat(amount) / toCurrency.rate;
    } else if (converterFrom !== 'BRL' && converterTo === 'BRL') {
      // Outra moeda para BRL
      result = parseFloat(amount) * fromCurrency.rate;
    } else if (converterFrom !== 'BRL' && converterTo !== 'BRL') {
      // Entre duas moedas estrangeiras
      const brlAmount = parseFloat(amount) * fromCurrency.rate;
      result = brlAmount / toCurrency.rate;
    } else {
      // BRL para BRL
      result = parseFloat(amount);
    }

    setConvertedAmount(result.toFixed(2));
  };

  useEffect(() => {
    fetchCurrencies();
    loadFavorites();
  }, []);

  useEffect(() => {
    convertCurrency();
  }, [amount, converterFrom, converterTo, currencies]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCurrencies();
  };

  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteCurrencies = currencies.filter(currency =>
    favorites.includes(currency.code)
  );

  const renderCurrencyItem = (currency) => (
    <View key={currency.code} style={styles.currencyItem}>
      <View style={styles.currencyInfo}>
        <View style={styles.currencyHeader}>
          <Text style={styles.currencyFlag}>{currency.flag}</Text>
          <View style={styles.currencyDetails}>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <Text style={styles.currencyName}>{currency.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(currency.code)}
          style={styles.favoriteButton}
        >
          <MaterialIcons
            name={favorites.includes(currency.code) ? 'favorite' : 'favorite-outline'}
            size={20}
            color={favorites.includes(currency.code) ? colors.danger : colors.textLight}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.currencyRates}>
        <Text style={styles.currencyRate}>R$ {currency.rate.toFixed(2)}</Text>
        <View style={[styles.currencyChange, {
          backgroundColor: currency.change >= 0 ? colors.success : colors.danger
        }]}>
          <MaterialIcons
            name={currency.change >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={colors.white}
          />
          <Text style={styles.currencyChangeText}>
            {currency.change.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Mini gráfico simulado */}
      <View style={styles.miniChart}>
        <Text style={styles.miniChartLabel}>Máx: R$ {currency.high.toFixed(2)}</Text>
        <View style={styles.chartLine} />
        <Text style={styles.miniChartLabel}>Mín: R$ {currency.low.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cotações Internacionais</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <MaterialIcons name="refresh" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'rates' && styles.activeTab]}
          onPress={() => setSelectedTab('rates')}
        >
          <Text style={[styles.tabText, selectedTab === 'rates' && styles.activeTabText]}>
            Cotações
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'converter' && styles.activeTab]}
          onPress={() => setSelectedTab('converter')}
        >
          <Text style={[styles.tabText, selectedTab === 'converter' && styles.activeTabText]}>
            Conversor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'favorites' && styles.activeTab]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.activeTabText]}>
            Favoritos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'rates' && (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar moeda..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Currency List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando cotações...</Text>
              </View>
            ) : (
              <View style={styles.currencyList}>
                {filteredCurrencies.map(renderCurrencyItem)}
              </View>
            )}
          </>
        )}

        {selectedTab === 'converter' && (
          <View style={styles.converterContainer}>
            <Text style={styles.converterTitle}>Conversor de Moedas</Text>
            
            {/* From Currency */}
            <View style={styles.converterSection}>
              <Text style={styles.converterLabel}>De:</Text>
              <View style={styles.converterRow}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <TouchableOpacity style={styles.currencySelector}>
                  <Text style={styles.currencySelectorText}>{converterFrom}</Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Swap Button */}
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const temp = converterFrom;
                setConverterFrom(converterTo);
                setConverterTo(temp);
              }}
            >
              <MaterialIcons name="swap-vert" size={24} color={colors.primaryDark} />
            </TouchableOpacity>

            {/* To Currency */}
            <View style={styles.converterSection}>
              <Text style={styles.converterLabel}>Para:</Text>
              <View style={styles.converterRow}>
                <View style={styles.resultContainer}>
                  <Text style={styles.resultAmount}>{convertedAmount}</Text>
                </View>
                <TouchableOpacity style={styles.currencySelector}>
                  <Text style={styles.currencySelectorText}>{converterTo}</Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Conversion Buttons */}
            <View style={styles.quickConversions}>
              <Text style={styles.quickConversionsLabel}>Conversões rápidas:</Text>
              <View style={styles.quickButtonsRow}>
                {['1', '10', '100', '1000'].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={styles.quickButton}
                    onPress={() => setAmount(value)}
                  >
                    <Text style={styles.quickButtonText}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'favorites' && (
          <View style={styles.favoritesContainer}>
            {favoriteCurrencies.length > 0 ? (
              <View style={styles.currencyList}>
                {favoriteCurrencies.map(renderCurrencyItem)}
              </View>
            ) : (
              <View style={styles.emptyFavorites}>
                <MaterialIcons name="favorite-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyFavoritesText}>Nenhuma moeda favoritada</Text>
                <Text style={styles.emptyFavoritesSubtext}>
                  Toque no ❤️ para adicionar moedas aos seus favoritos
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  refreshButton: {
    padding: spacing.small,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.medium,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.medium,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.small,
    marginBottom: spacing.medium,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.small,
    fontSize: 14,
    color: colors.text,
  },
  currencyList: {
    gap: spacing.small,
  },
  currencyItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.medium,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currencyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: spacing.small,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  currencyName: {
    fontSize: 12,
    color: colors.textLight,
  },
  favoriteButton: {
    padding: spacing.small,
  },
  currencyRates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  currencyRate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  currencyChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currencyChangeText: {
    fontSize: 12,
    color: colors.white,
    marginLeft: 4,
  },
  miniChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniChartLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  chartLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.small,
  },
  loadingContainer: {
    padding: spacing.large,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  // Converter Styles
  converterContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  converterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  converterSection: {
    marginBottom: spacing.medium,
  },
  converterLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.small,
  },
  converterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.medium,
    fontSize: 18,
    color: colors.text,
    marginRight: spacing.small,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.medium,
    marginRight: spacing.small,
  },
  resultAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.medium,
    minWidth: 80,
  },
  currencySelectorText: {
    fontSize: 16,
    color: colors.text,
    marginRight: spacing.small,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.small,
    marginVertical: spacing.small,
  },
  quickConversions: {
    marginTop: spacing.medium,
  },
  quickConversionsLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.small,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  // Favorites Styles
  favoritesContainer: {
    flex: 1,
  },
  emptyFavorites: {
    alignItems: 'center',
    paddingVertical: spacing.large * 2,
  },
  emptyFavoritesText: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: spacing.medium,
  },
  emptyFavoritesSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.small,
    textAlign: 'center',
  },
});

export default CurrencyScreen;