// Tela de Bolsa de Valores e Ações - Trampay
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

const StocksScreen = ({ navigation, route }) => {
  const [stocks, setStocks] = useState([]);
  const [indices, setIndices] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('b3'); // 'b3', 'international', 'indices', 'watchlist'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume'); // 'volume', 'price', 'change'

  const WATCHLIST_STORAGE_KEY = 'stocks_watchlist';

  // Mock data para demonstração (substituir por APIs reais)
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

  // Buscar dados das ações (mock - substituir por APIs reais)
  const fetchStockData = async () => {
    try {
      setLoading(true);
      
      // Simular chamada de API
      setTimeout(() => {
        setStocks([...mockB3Stocks, ...mockInternationalStocks]);
        setIndices(mockIndices);
        setLoading(false);
        setRefreshing(false);
      }, 1000);

      // TODO: Implementar integração com APIs reais
      // B3: Alpha Vantage, Yahoo Finance, ou API proprietária
      // Internacional: Alpha Vantage, IEX Cloud, etc.
      
    } catch (error) {
      console.error('Erro ao buscar dados das ações:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados das ações');
      setLoading(false);
      setRefreshing(false);
    }
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
      Alert.alert('Removido', 'Ação removida da watchlist');
    } else {
      newWatchlist = [...watchlist, {
        ...stock,
        added_at: new Date().toISOString()
      }];
      Alert.alert('Adicionado', 'Ação adicionada à watchlist');
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
      return `R$ ${price.toFixed(2).replace('.', ',')}`;
    }
    return `US$ ${price.toFixed(2)}`;
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

  const renderStockItem = (stock) => (
    <TouchableOpacity
      key={stock.symbol}
      style={styles.stockItem}
      onPress={() => {
        Alert.alert('Em breve', 'Detalhes da ação serão implementados');
      }}
    >
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{stock.symbol}</Text>
          <Text style={styles.stockName}>{stock.name}</Text>
          <Text style={styles.stockSector}>{stock.sector} • {stock.market}</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleWatchlist(stock)}
          style={styles.watchlistButton}
        >
          <MaterialIcons
            name={watchlist.some(item => item.symbol === stock.symbol) ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={watchlist.some(item => item.symbol === stock.symbol) ? colors.primary : colors.textLight}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.stockStats}>
        <View style={styles.stockPrice}>
          <Text style={styles.priceValue}>{formatPrice(stock.price, stock.market)}</Text>
          <View style={[styles.priceChange, {
            backgroundColor: stock.change >= 0 ? colors.success : colors.danger
          }]}>
            <MaterialIcons
              name={stock.change >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={colors.white}
            />
            <Text style={styles.priceChangeText}>
              {stock.change_percent.toFixed(2)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.stockMetrics}>
          <Text style={styles.metricLabel}>
            Variação: {formatPrice(Math.abs(stock.change), stock.market)}
          </Text>
          <Text style={styles.metricLabel}>
            Volume: {formatVolume(stock.volume)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderIndexItem = (index) => (
    <View key={index.symbol} style={styles.indexItem}>
      <View style={styles.indexInfo}>
        <Text style={styles.indexName}>{index.name}</Text>
        <Text style={styles.indexSymbol}>{index.symbol} • {index.market}</Text>
      </View>
      <View style={styles.indexStats}>
        <Text style={styles.indexValue}>{index.value.toLocaleString('pt-BR')}</Text>
        <View style={[styles.indexChange, {
          backgroundColor: index.change >= 0 ? colors.success : colors.danger
        }]}>
          <MaterialIcons
            name={index.change >= 0 ? 'trending-up' : 'trending-down'}
            size={14}
            color={colors.white}
          />
          <Text style={styles.indexChangeText}>
            {index.change_percent.toFixed(2)}%
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Bolsa de Valores</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <MaterialIcons name="refresh" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Market Overview */}
      <View style={styles.marketOverview}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {indices.map((index) => (
            <View key={index.symbol} style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>{index.symbol}</Text>
              <Text style={styles.overviewValue}>{index.value.toLocaleString('pt-BR')}</Text>
              <Text style={[styles.overviewChange, {
                color: index.change >= 0 ? colors.success : colors.danger
              }]}>
                {index.change_percent >= 0 ? '+' : ''}{index.change_percent.toFixed(2)}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'b3' && styles.activeTab]}
          onPress={() => setSelectedTab('b3')}
        >
          <Text style={[styles.tabText, selectedTab === 'b3' && styles.activeTabText]}>
            B3
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'international' && styles.activeTab]}
          onPress={() => setSelectedTab('international')}
        >
          <Text style={[styles.tabText, selectedTab === 'international' && styles.activeTabText]}>
            Internacional
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'indices' && styles.activeTab]}
          onPress={() => setSelectedTab('indices')}
        >
          <Text style={[styles.tabText, selectedTab === 'indices' && styles.activeTabText]}>
            Índices
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'watchlist' && styles.activeTab]}
          onPress={() => setSelectedTab('watchlist')}
        >
          <Text style={[styles.tabText, selectedTab === 'watchlist' && styles.activeTabText]}>
            Watchlist
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {(selectedTab === 'b3' || selectedTab === 'international') && (
          <>
            {/* Search and Sort */}
            <View style={styles.searchSortContainer}>
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar ação..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  const sorts = ['volume', 'price', 'change'];
                  const currentIndex = sorts.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % sorts.length;
                  setSortBy(sorts[nextIndex]);
                }}
              >
                <MaterialIcons name="sort" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>

            {/* Stock List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando dados...</Text>
              </View>
            ) : (
              <View style={styles.stockList}>
                {getFilteredStocks(selectedTab).map(renderStockItem)}
              </View>
            )}
          </>
        )}

        {selectedTab === 'indices' && (
          <View style={styles.indicesContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando índices...</Text>
              </View>
            ) : (
              <View style={styles.indicesList}>
                {indices.map(renderIndexItem)}
              </View>
            )}
          </View>
        )}

        {selectedTab === 'watchlist' && (
          <View style={styles.watchlistContainer}>
            {watchlist.length > 0 ? (
              <View style={styles.stockList}>
                {watchlist.map(renderStockItem)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="bookmark-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyStateText}>Watchlist vazia</Text>
                <Text style={styles.emptyStateSubtext}>
                  Toque no 🔖 para adicionar ações à sua watchlist
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
  marketOverview: {
    backgroundColor: colors.white,
    paddingVertical: spacing.medium,
  },
  overviewCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.medium,
    marginHorizontal: spacing.small,
    minWidth: 120,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  overviewChange: {
    fontSize: 12,
    fontWeight: 'bold',
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
    fontSize: 12,
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
  searchSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.small,
    marginRight: spacing.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.small,
    fontSize: 14,
    color: colors.text,
  },
  sortButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.small,
  },
  stockList: {
    gap: spacing.small,
  },
  stockItem: {
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
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  stockName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  stockSector: {
    fontSize: 12,
    color: colors.textLight,
  },
  watchlistButton: {
    padding: spacing.small,
  },
  stockStats: {
    gap: spacing.small,
  },
  stockPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceChangeText: {
    fontSize: 12,
    color: colors.white,
    marginLeft: 4,
  },
  stockMetrics: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  // Indices Styles
  indicesContainer: {
    flex: 1,
  },
  indicesList: {
    gap: spacing.small,
  },
  indexItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  indexInfo: {
    flex: 1,
  },
  indexName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  indexSymbol: {
    fontSize: 12,
    color: colors.textLight,
  },
  indexStats: {
    alignItems: 'flex-end',
  },
  indexValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  indexChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indexChangeText: {
    fontSize: 12,
    color: colors.white,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: spacing.large,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.large * 2,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: spacing.medium,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.small,
    textAlign: 'center',
  },
  watchlistContainer: {
    flex: 1,
  },
});

export default StocksScreen;