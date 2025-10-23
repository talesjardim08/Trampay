// StocksScreen.js (Estilo TramPay + animações e interatividade)
// Mantém funcionalidades originais: mock fetch, watchlist (SecureStore), tabs, search, sort, pull-to-refresh.
// Adicionado: animações de entrada (fade + translate), press scale, expand por card, animação bookmark.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
// se você usa um file ../styles, ele será ignorado em favor da paleta local — mantive import caso queira usar
// import { colors as baseColors, fonts, spacing as baseSpacing } from '../styles';

const { width } = Dimensions.get('window');

// --- Paleta TramPay (mesma do CurrencyScreen) ---
const colors = {
  background: '#F7F7F9',
  card: '#FFFFFF',
  primary: '#FFD84D',      // amarelo principal
  primaryDark: '#E6BA2F',  // amarelo escuro
  darkBlue: '#0F1724',
  text: '#24313A',
  textLight: '#7B8790',
  success: '#0BB066',
  danger: '#E25555',
  warning: '#F5B041',
  white: '#FFFFFF',
};

const TRAMPAY_BLUE = colors.primary;
const TRAMPAY_YELLOW = colors.primaryDark;
const BACKGROUND_WHITE = colors.card;
const LIGHT_GREY = colors.background;
const MUTED = colors.textLight;

// fallback spacing (caso você não importe)
const spacing = { small: 8, medium: 16, large: 24 };

const WATCHLIST_STORAGE_KEY = 'stocks_watchlist';

// Mock data para demonstração (mantive seus objetos exatamente)
const mockB3Stocks = [
  {
    symbol: 'PETR4',
    name: 'Petrobras PN',
    price: 32.45,
    change: 2.15,
    change_percent: 7.1,
    volume: 125000000,
    market: 'B3',
    sector: 'Petróleo e Gás'
  },
  {
    symbol: 'VALE3',
    name: 'Vale ON',
    price: 68.90,
    change: -1.23,
    change_percent: -1.8,
    volume: 89000000,
    market: 'B3',
    sector: 'Mineração'
  },
  {
    symbol: 'ITUB4',
    name: 'Itaú Unibanco PN',
    price: 28.75,
    change: 0.85,
    change_percent: 3.0,
    volume: 67000000,
    market: 'B3',
    sector: 'Bancos'
  },
  {
    symbol: 'BBAS3',
    name: 'Banco do Brasil ON',
    price: 54.20,
    change: 1.45,
    change_percent: 2.7,
    volume: 45000000,
    market: 'B3',
    sector: 'Bancos'
  },
  {
    symbol: 'MGLU3',
    name: 'Magazine Luiza ON',
    price: 8.95,
    change: -0.35,
    change_percent: -3.8,
    volume: 78000000,
    market: 'B3',
    sector: 'Varejo'
  }
];

const mockInternationalStocks = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 890.50,
    change: 12.75,
    change_percent: 1.45,
    volume: 45000000,
    market: 'NASDAQ',
    sector: 'Tecnologia'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 1456.80,
    change: -23.40,
    change_percent: -1.58,
    volume: 28000000,
    market: 'NASDAQ',
    sector: 'Tecnologia'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 1245.30,
    change: 45.60,
    change_percent: 3.80,
    volume: 35000000,
    market: 'NASDAQ',
    sector: 'Automotivo'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 1678.90,
    change: 8.20,
    change_percent: 0.49,
    volume: 22000000,
    market: 'NASDAQ',
    sector: 'Tecnologia'
  }
];

const mockIndices = [
  {
    symbol: 'IBOV',
    name: 'Índice Bovespa',
    value: 126340.25,
    change: 1254.30,
    change_percent: 1.00,
    market: 'B3'
  },
  {
    symbol: 'SPX',
    name: 'S&P 500',
    value: 4567.89,
    change: -45.67,
    change_percent: -0.99,
    market: 'NYSE'
  },
  {
    symbol: 'IXIC',
    name: 'NASDAQ Composite',
    value: 14256.78,
    change: 123.45,
    change_percent: 0.87,
    market: 'NASDAQ'
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones',
    value: 34567.12,
    change: 234.56,
    change_percent: 0.68,
    market: 'NYSE'
  }
];

const StocksScreen = ({ navigation, route }) => {
  const [stocks, setStocks] = useState([]);
  const [indices, setIndices] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('b3'); // 'b3', 'international', 'indices', 'watchlist'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume'); // 'volume', 'price', 'change'
  const [expandedSymbols, setExpandedSymbols] = useState([]); // para controlar cards expandidos

  // animações globais
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listTranslate = useRef(new Animated.Value(8)).current;

  // Fetch stock data (mock)
  const fetchStockData = async () => {
    try {
      setLoading(true);

      // Simular chamada de API
      setTimeout(() => {
        setStocks([...mockB3Stocks, ...mockInternationalStocks]);
        setIndices(mockIndices);
        setLoading(false);
        setRefreshing(false);
        runEntryAnim();
      }, 900);
    } catch (error) {
      console.error('Erro ao buscar dados das ações:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados das ações');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // run entry animation
  const runEntryAnim = () => {
    fadeAnim.setValue(0);
    listTranslate.setValue(8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(listTranslate, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Carregar watchlist
  const loadWatchlist = async () => {
    try {
      const stored = await SecureStore.getItemAsync(WATCHLIST_STORAGE_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar watchlist:', error);
    }
  };

  // Adicionar/remover da watchlist
  const toggleWatchlist = async (stock) => {
    const isInWatchlist = watchlist.some(item => item.symbol === stock.symbol);

    let newWatchlist;
    if (isInWatchlist) {
      newWatchlist = watchlist.filter(item => item.symbol !== stock.symbol);
      // feedback rápido
      // Alert.alert('Removido', 'Ação removida da watchlist');
    } else {
      newWatchlist = [...watchlist, {
        ...stock,
        added_at: new Date().toISOString()
      }];
      // Alert.alert('Adicionado', 'Ação adicionada à watchlist');
    }

    try {
      await SecureStore.setItemAsync(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
    } catch (error) {
      console.error('Erro ao salvar watchlist:', error);
    }
  };

  // Formatar valores
  const formatPrice = (price, market = 'B3') => {
    if (market === 'B3') {
      return `R$ ${Number(price).toFixed(2).replace('.', ',')}`;
    }
    return `US$ ${Number(price).toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    }
    return volume.toString();
  };

  useEffect(() => {
    fetchStockData();
    loadWatchlist();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStockData();
  };

  // Filtrar ações por mercado e busca
  const getFilteredStocks = (market) => {
    return stocks
      .filter(stock => {
        const matchesMarket = market === 'all' ||
          (market === 'b3' && stock.market === 'B3') ||
          (market === 'international' && stock.market !== 'B3');

        const matchesSearch = !searchQuery ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesMarket && matchesSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return b.price - a.price;
          case 'change':
            return b.change_percent - a.change_percent;
          case 'volume':
          default:
            return b.volume - a.volume;
        }
      });
  };

  // Toggle expand item
  const toggleExpand = (symbol) => {
    setExpandedSymbols(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  };

  // Hook para efeito de escala ao pressionar
  const useScalePress = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    return { scale, onPressIn, onPressOut };
  };

  // StockItem: componente interno por item (pode usar hooks)
  const StockItem = ({ stock, index }) => {
    const { scale, onPressIn, onPressOut } = useScalePress();
    const isExpanded = expandedSymbols.includes(stock.symbol);

    // entrada por item (stagger)
    const itemOpacity = useRef(new Animated.Value(0)).current;
    const itemTranslate = useRef(new Animated.Value(6)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemOpacity, {
          toValue: 1,
          duration: 360,
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.timing(itemTranslate, {
          toValue: 0,
          duration: 360,
          delay: index * 30,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // bookmark animation
    const bookmarkScale = useRef(new Animated.Value(1)).current;
    const animateBookmark = () => {
      Animated.sequence([
        Animated.timing(bookmarkScale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
        Animated.timing(bookmarkScale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    };

    const onToggleBookmark = () => {
      animateBookmark();
      toggleWatchlist(stock);
    };

    const changePositive = stock.change >= 0;

    return (
      <Animated.View
        style={[
          styles.stockItem,
          {
            opacity: itemOpacity,
            transform: [{ translateY: Animated.add(listTranslate, itemTranslate) }, { scale }],
            borderLeftColor: changePositive ? '#DFF6E8' : '#FFECEC',
            borderLeftWidth: 4,
          },
        ]}
      >
        <View style={styles.stockHeader}>
          <View style={styles.leftStockInfo}>
            <View style={styles.rankIconWrap}>
              <Text style={styles.stockSymbol}>{stock.symbol}</Text>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.stockName}>{stock.name}</Text>
              <Text style={styles.stockSector}>{stock.sector} • {stock.market}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onToggleBookmark}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={{ marginRight: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <MaterialIcons
                  name={watchlist.some(item => item.symbol === stock.symbol) ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={watchlist.some(item => item.symbol === stock.symbol) ? TRAMPAY_YELLOW : MUTED}
                />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => toggleExpand(stock.symbol)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={{ padding: 8 }}
            >
              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={22}
                color={MUTED}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Top row price + change */}
        <View style={styles.stockStats}>
          <View style={styles.stockPrice}>
            <Text style={styles.priceValue}>{formatPrice(stock.price, stock.market)}</Text>

            <View style={[styles.priceChange, { backgroundColor: changePositive ? '#E6FBEE' : '#FFEDED' }]}>
              <MaterialIcons
                name={changePositive ? 'trending-up' : 'trending-down'}
                size={16}
                color={changePositive ? TRAMPAY_BLUE : colors.danger}
              />
              <Text style={[styles.priceChangeText, { color: changePositive ? '#0B6A36' : colors.danger }]}>
                {stock.change_percent.toFixed(2)}%
              </Text>
            </View>
          </View>

          {/* expanded area */}
          {isExpanded && (
            <Animated.View style={styles.expandedArea}>
              <View style={styles.expandedRow}>
                <Text style={styles.expLabel}>Variação</Text>
                <Text style={styles.expValue}>{formatPrice(Math.abs(stock.change), stock.market)}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={styles.expLabel}>Volume</Text>
                <Text style={styles.expValue}>{formatVolume(stock.volume)}</Text>
              </View>

              {/* placeholder mini-sparkline */}
              <View style={styles.sparklinePlaceholder}>
                <Text style={{ fontSize: 12, color: MUTED }}>Mini gráfico (em breve)</Text>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Index item component
  const IndexItem = ({ indexItem, idx }) => {
    const itemOpacity = useRef(new Animated.Value(0)).current;
    const itemTranslate = useRef(new Animated.Value(6)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemOpacity, {
          toValue: 1,
          duration: 360,
          delay: idx * 30,
          useNativeDriver: true,
        }),
        Animated.timing(itemTranslate, {
          toValue: 0,
          duration: 360,
          delay: idx * 30,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const positive = indexItem.change >= 0;
    return (
      <Animated.View
        style={[
          styles.indexItem,
          {
            opacity: itemOpacity,
            transform: [{ translateY: Animated.add(listTranslate, itemTranslate) }],
            borderLeftColor: positive ? '#DFF6E8' : '#FFECEC',
            borderLeftWidth: 4,
          },
        ]}
      >
        <View style={styles.indexInfo}>
          <Text style={styles.indexName}>{indexItem.name}</Text>
          <Text style={styles.indexSymbol}>{indexItem.symbol} • {indexItem.market}</Text>
        </View>
        <View style={styles.indexStats}>
          <Text style={styles.indexValue}>{indexItem.value.toLocaleString('pt-BR')}</Text>
          <View style={[styles.indexChange, { backgroundColor: positive ? '#E6FBEE' : '#FFEDED' }]}>
            <MaterialIcons name={positive ? 'trending-up' : 'trending-down'} size={14} color={positive ? TRAMPAY_BLUE : colors.danger} />
            <Text style={[styles.indexChangeText, { color: positive ? '#0B6A36' : colors.danger }]}>
              {indexItem.change_percent >= 0 ? '+' : ''}{indexItem.change_percent.toFixed(2)}%
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // renderers for FlatList
  const stocksData = getFilteredStocks(selectedTab);
  const favoriteStocksData = watchlist; // for watchlist tab
  const indicesData = indices;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header (igual ao CurrencyScreen/TradingHome) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={TRAMPAY_BLUE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bolsa de Valores</Text>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color={TRAMPAY_BLUE} />
        </TouchableOpacity>
      </View>

      {/* Tabs (visual do CurrencyScreen) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'b3' && styles.tabActive]}
          onPress={() => setSelectedTab('b3')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'b3' && styles.tabTextActive]}>B3</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'international' && styles.tabActive]}
          onPress={() => setSelectedTab('international')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'international' && styles.tabTextActive]}>Internacional</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'indices' && styles.tabActive]}
          onPress={() => setSelectedTab('indices')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'indices' && styles.tabTextActive]}>Índices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'watchlist' && styles.tabActive]}
          onPress={() => setSelectedTab('watchlist')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'watchlist' && styles.tabTextActive]}>Watchlist</Text>
        </TouchableOpacity>
      </View>

      {/* Search + overview horizontal */}
      <View style={styles.content}>
        {(selectedTab === 'b3' || selectedTab === 'international') && (
          <>
            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color={MUTED} />
              <TextInput
                placeholder="Buscar ação..."
                placeholderTextColor={MUTED}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={{ marginLeft: 8, padding: 6 }}
                onPress={() => {
                  const sorts = ['volume', 'price', 'change'];
                  const idx = sorts.indexOf(sortBy);
                  setSortBy(sorts[(idx + 1) % sorts.length]);
                }}
              >
                <MaterialIcons name="sort" size={20} color={TRAMPAY_YELLOW} />
              </TouchableOpacity>
            </View>

            <View style={styles.marketOverview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
                {indicesData.map((index, idx) => (
                  <View key={index.symbol} style={styles.overviewCard}>
                    <Text style={styles.overviewLabel}>{index.symbol}</Text>
                    <Text style={styles.overviewValue}>{index.value.toLocaleString('pt-BR')}</Text>
                    <Text style={[styles.overviewChange, { color: index.change >= 0 ? colors.success : colors.danger }]}>
                      {index.change_percent >= 0 ? '+' : ''}{index.change_percent.toFixed(2)}%
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* Conteúdo vertical: usamos FlatList para listas (evita nested VirtualizedList issues) */}
        {selectedTab === 'b3' || selectedTab === 'international' ? (
          <FlatList
            data={stocksData}
            keyExtractor={(item) => item.symbol}
            renderItem={({ item, index }) => <StockItem stock={item} index={index} />}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>Carregando dados...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="search" size={48} color={MUTED} />
                  <Text style={styles.emptyStateText}>Nenhuma ação encontrada</Text>
                </View>
              )
            }
          />
        ) : selectedTab === 'indices' ? (
          <FlatList
            data={indicesData}
            keyExtractor={(it) => it.symbol}
            renderItem={({ item, index }) => <IndexItem indexItem={item} idx={index} />}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>Carregando índices...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="bar-chart" size={48} color={MUTED} />
                  <Text style={styles.emptyStateText}>Nenhum índice disponível</Text>
                </View>
              )
            }
          />
        ) : (
          // watchlist
          <FlatList
            data={favoriteStocksData}
            keyExtractor={(item) => item.symbol}
            renderItem={({ item, index }) => <StockItem stock={item} index={index} />}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="bookmark-outline" size={48} color={MUTED} />
                <Text style={styles.emptyStateText}>Watchlist vazia</Text>
                <Text style={styles.emptyStateSubtext}>
                  Toque no 🔖 para adicionar ações à sua watchlist
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// --- Styles (baseados no CurrencyScreen) ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LIGHT_GREY,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BACKGROUND_WHITE,
    borderBottomWidth: 0,
    elevation: 2,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  tabsRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BACKGROUND_WHITE,
  },
  tabBtn: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: TRAMPAY_BLUE,
    elevation: 2,
    shadowColor: TRAMPAY_BLUE,
  },
  tabText: { color: TRAMPAY_BLUE, fontWeight: '700' },
  tabTextActive: { color: BACKGROUND_WHITE },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND_WHITE,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  searchInput: { marginLeft: 8, fontSize: 14, color: '#273444', flex: 1 },

  marketOverview: {
    backgroundColor: BACKGROUND_WHITE,
    paddingVertical: 8,
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: LIGHT_GREY,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  overviewChange: {
    fontSize: 12,
  },

  /* Stock card styles (inspirado no CurrencyScreen card) */
  stockList: { marginTop: 8, paddingBottom: 32 },
  stockItem: {
    backgroundColor: BACKGROUND_WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0A2340',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },

  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftStockInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankIconWrap: {
    width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7E6',
  },
  stockSymbol: { fontSize: 16, fontWeight: '800', color: colors.darkBlue },
  stockName: { fontSize: 15, fontWeight: '700', color: colors.darkBlue },
  stockSector: { fontSize: 12, color: MUTED },

  watchlistButton: { padding: 8 },

  stockStats: { marginTop: 12 },
  stockPrice: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceValue: { fontSize: 16, fontWeight: '800', color: colors.darkBlue },
  priceChange: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  priceChangeText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },

  stockMetrics: { marginTop: 10 },
  metricLabel: { fontSize: 12, color: MUTED },

  // expanded area
  expandedArea: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F4F8', paddingTop: 12 },
  expandedRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  expLabel: { fontSize: 12, color: MUTED },
  expValue: { fontSize: 13, fontWeight: '700', color: colors.darkBlue },
  sparklinePlaceholder: { height: 36, borderRadius: 8, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', marginTop: 8 },

  // Indices Styles
  indicesContainer: { marginTop: 8 },
  indicesList: { paddingBottom: 32 },
  indexItem: {
    backgroundColor: BACKGROUND_WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0A2340',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indexInfo: { flex: 1 },
  indexName: { fontSize: 16, fontWeight: '800', color: colors.darkBlue },
  indexSymbol: { fontSize: 12, color: MUTED },

  indexStats: { alignItems: 'flex-end' },
  indexValue: { fontSize: 16, fontWeight: '800', color: colors.darkBlue },
  indexChange: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  indexChangeText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },

  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { color: MUTED },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: colors.darkBlue },
  emptyStateSubtext: { marginTop: 6, color: MUTED },

  watchlistContainer: { marginTop: 8 },
});

export default StocksScreen;
