// Tela de Índices de Criptomoedas - Trampay
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
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { colors, fonts, spacing } from '../styles';

const { width } = Dimensions.get('window');

const CryptoScreen = ({ navigation, route }) => {
  const [cryptos, setCryptos] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('market'); // 'market', 'favorites', 'portfolio'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap'); // 'market_cap', 'price', 'change'
  const [portfolioValue, setPortfolioValue] = useState(0);

  const FAVORITES_STORAGE_KEY = 'crypto_favorites';
  const WATCHLIST_STORAGE_KEY = 'crypto_watchlist';
  const PORTFOLIO_STORAGE_KEY = 'crypto_portfolio';

  // Mock data para demonstração (substituir por API real)
  const mockCryptoData = [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      icon: '₿',
      price: 324500.00,
      change_24h: 2.15,
      market_cap: 6345000000000,
      volume_24h: 28500000000,
      rank: 1
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      icon: 'Ξ',
      price: 21450.00,
      change_24h: -1.23,
      market_cap: 2580000000000,
      volume_24h: 15200000000,
      rank: 2
    },
    {
      id: 'tether',
      symbol: 'USDT',
      name: 'Tether',
      icon: '₮',
      price: 5.64,
      change_24h: 0.05,
      market_cap: 83000000000,
      volume_24h: 32100000000,
      rank: 3
    },
    {
      id: 'binancecoin',
      symbol: 'BNB',
      name: 'BNB',
      icon: 'B',
      price: 1250.00,
      change_24h: 3.45,
      market_cap: 192000000000,
      volume_24h: 1800000000,
      rank: 4
    },
    {
      id: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      icon: '₳',
      price: 2.15,
      change_24h: -0.87,
      market_cap: 76000000000,
      volume_24h: 1200000000,
      rank: 5
    }
  ];

  // Buscar dados de criptomoedas 
  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      
      // Tentar usar API real se disponível
      const coinMarketCapKey = Constants.expoConfig?.extra?.COINMARKETCAP_API_KEY;
      
      if (coinMarketCapKey) {
        try {
          const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=BRL', {
            headers: {
              'X-CMC_PRO_API_KEY': coinMarketCapKey,
              'Accept': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const cryptoData = data.data.map(crypto => ({
              id: crypto.id.toString(),
              symbol: crypto.symbol,
              name: crypto.name,
              icon: crypto.symbol.charAt(0),
              price: crypto.quote.BRL.price,
              change_24h: crypto.quote.BRL.percent_change_24h,
              market_cap: crypto.quote.BRL.market_cap,
              volume_24h: crypto.quote.BRL.volume_24h,
              rank: crypto.cmc_rank
            }));
            
            setCryptos(cryptoData);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        } catch (apiError) {
          console.log('API não disponível, usando dados mock:', apiError);
        }
      }
      
      // Fallback para dados mock se API não estiver disponível
      setTimeout(() => {
        setCryptos(mockCryptoData);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao buscar dados de cripto:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados das criptomoedas');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar favoritos e watchlist
  const loadUserData = async () => {
    try {
      const storedFavorites = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }

      const storedWatchlist = await SecureStore.getItemAsync(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  // Toggle favorito
  const toggleFavorite = async (cryptoId) => {
    const newFavorites = favorites.includes(cryptoId)
      ? favorites.filter(fav => fav !== cryptoId)
      : [...favorites, cryptoId];
    
    try {
      await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  };

  // Adicionar à watchlist
  const addToWatchlist = async (crypto) => {
    const isInWatchlist = watchlist.some(item => item.id === crypto.id);
    
    if (isInWatchlist) {
      Alert.alert('Info', 'Esta criptomoeda já está na sua watchlist');
      return;
    }

    const newWatchlist = [...watchlist, {
      ...crypto,
      added_at: new Date().toISOString()
    }];

    try {
      await SecureStore.setItemAsync(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
      Alert.alert('Sucesso', 'Adicionado à watchlist!');
    } catch (error) {
      console.error('Erro ao salvar watchlist:', error);
    }
  };

  // Formatar valores
  const formatPrice = (price) => {
    return `R$ ${price.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return `R$ ${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `R$ ${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `R$ ${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `R$ ${marketCap.toFixed(0)}`;
  };

  useEffect(() => {
    fetchCryptoData();
    loadUserData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCryptoData();
  };

  // Filtrar e ordenar criptomoedas
  const filteredCryptos = cryptos
    .filter(crypto =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.change_24h - a.change_24h;
        case 'market_cap':
        default:
          return b.market_cap - a.market_cap;
      }
    });

  const favoriteCryptos = cryptos.filter(crypto =>
    favorites.includes(crypto.id)
  );

  const renderCryptoItem = (crypto, showAddToWatchlist = true) => (
    <TouchableOpacity
      key={crypto.id}
      style={styles.cryptoItem}
      onPress={() => {
        // Navegar para detalhes da criptomoeda
        Alert.alert('Em breve', 'Detalhes da criptomoeda serão implementados');
      }}
    >
      <View style={styles.cryptoHeader}>
        <View style={styles.cryptoInfo}>
          <Text style={styles.cryptoIcon}>{crypto.icon}</Text>
          <View style={styles.cryptoDetails}>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
            <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
          </View>
        </View>
        <View style={styles.cryptoActions}>
          {showAddToWatchlist && (
            <TouchableOpacity
              onPress={() => addToWatchlist(crypto)}
              style={styles.actionButton}
            >
              <MaterialIcons name="add-alert" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => toggleFavorite(crypto.id)}
            style={styles.actionButton}
          >
            <MaterialIcons
              name={favorites.includes(crypto.id) ? 'favorite' : 'favorite-outline'}
              size={20}
              color={favorites.includes(crypto.id) ? colors.danger : colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cryptoStats}>
        <View style={styles.cryptoPrice}>
          <Text style={styles.priceValue}>{formatPrice(crypto.price)}</Text>
          <View style={[styles.priceChange, {
            backgroundColor: crypto.change_24h >= 0 ? colors.success : colors.danger
          }]}>
            <MaterialIcons
              name={crypto.change_24h >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={colors.white}
            />
            <Text style={styles.priceChangeText}>
              {crypto.change_24h.toFixed(2)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.cryptoMetrics}>
          <Text style={styles.metricLabel}>Cap. Mercado: {formatMarketCap(crypto.market_cap)}</Text>
          <Text style={styles.metricLabel}>Volume 24h: {formatMarketCap(crypto.volume_24h)}</Text>
        </View>
      </View>

      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{crypto.rank}</Text>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Criptomoedas</Text>
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
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Market Cap Total</Text>
            <Text style={styles.overviewValue}>R$ 12,5T</Text>
            <Text style={styles.overviewChange}>+2.3%</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Volume 24h</Text>
            <Text style={styles.overviewValue}>R$ 890B</Text>
            <Text style={styles.overviewChange}>+5.1%</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Dominância BTC</Text>
            <Text style={styles.overviewValue}>42.5%</Text>
            <Text style={styles.overviewChange}>+0.8%</Text>
          </View>
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'market' && styles.activeTab]}
          onPress={() => setSelectedTab('market')}
        >
          <Text style={[styles.tabText, selectedTab === 'market' && styles.activeTabText]}>
            Mercado
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'favorites' && styles.activeTab]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.activeTabText]}>
            Favoritas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'portfolio' && styles.activeTab]}
          onPress={() => setSelectedTab('portfolio')}
        >
          <Text style={[styles.tabText, selectedTab === 'portfolio' && styles.activeTabText]}>
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
        {selectedTab === 'market' && (
          <>
            {/* Search and Sort */}
            <View style={styles.searchSortContainer}>
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar criptomoeda..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  const sorts = ['market_cap', 'price', 'change'];
                  const currentIndex = sorts.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % sorts.length;
                  setSortBy(sorts[nextIndex]);
                }}
              >
                <MaterialIcons name="sort" size={20} color={colors.primaryDark} />
              </TouchableOpacity>
            </View>

            {/* Crypto List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando dados...</Text>
              </View>
            ) : (
              <View style={styles.cryptoList}>
                {filteredCryptos.map(crypto => renderCryptoItem(crypto))}
              </View>
            )}
          </>
        )}

        {selectedTab === 'favorites' && (
          <View style={styles.favoritesContainer}>
            {favoriteCryptos.length > 0 ? (
              <View style={styles.cryptoList}>
                {favoriteCryptos.map(crypto => renderCryptoItem(crypto, false))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="favorite-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyStateText}>Nenhuma favorita ainda</Text>
                <Text style={styles.emptyStateSubtext}>
                  Toque no ❤️ para adicionar às suas favoritas
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'portfolio' && (
          <View style={styles.portfolioContainer}>
            {watchlist.length > 0 ? (
              <View style={styles.cryptoList}>
                {watchlist.map(crypto => renderCryptoItem(crypto, false))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="visibility" size={48} color={colors.textLight} />
                <Text style={styles.emptyStateText}>Watchlist vazia</Text>
                <Text style={styles.emptyStateSubtext}>
                  Use o botão 🔔 para adicionar criptomoedas à sua watchlist
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  overviewChange: {
    fontSize: 12,
    color: colors.success,
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
  cryptoList: {
    gap: spacing.small,
  },
  cryptoItem: {
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
    position: 'relative',
  },
  cryptoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  cryptoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cryptoIcon: {
    fontSize: 32,
    marginRight: spacing.medium,
  },
  cryptoDetails: {
    flex: 1,
  },
  cryptoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  cryptoSymbol: {
    fontSize: 12,
    color: colors.textLight,
  },
  cryptoActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.small,
    marginLeft: spacing.small,
  },
  cryptoStats: {
    marginBottom: spacing.small,
  },
  cryptoPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
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
  cryptoMetrics: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
  },
  rankText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
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
  favoritesContainer: {
    flex: 1,
  },
  portfolioContainer: {
    flex: 1,
  },
});

export default CryptoScreen;