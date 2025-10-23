// CryptoScreen.js
// Tela de Índices de Criptomoedas - Visual igual ao CurrencyScreen (paleta TramPay)
// Mantém funcionalidades: fetch (CoinMarketCap fallback), favoritos (SecureStore), watchlist toggle, tabs, pull-to-refresh.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const colors = {
  background: '#F7F7F9',
  card: '#FFFFFF',
  primary: '#FFD84D',
  primaryDark: '#E6BA2F',
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

const FAVORITES_STORAGE_KEY = 'crypto_favorites';
const WATCHLIST_STORAGE_KEY = 'crypto_watchlist';

const mockCryptoData = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    price: 324500.0,
    change_24h: 2.15,
    market_cap: 6345000000000,
    volume_24h: 28500000000,
    rank: 1,
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    price: 21450.0,
    change_24h: -1.23,
    market_cap: 2580000000000,
    volume_24h: 15200000000,
    rank: 2,
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
    rank: 3,
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    icon: 'B',
    price: 1250.0,
    change_24h: 3.45,
    market_cap: 192000000000,
    volume_24h: 1800000000,
    rank: 4,
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
    rank: 5,
  },
];

const CryptoScreen = ({ navigation }) => {
  const [cryptos, setCryptos] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('market'); // 'market' | 'favorites' | 'watchlist'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap'); // 'market_cap' | 'price' | 'change'

  // --- Fetch crypto data (CoinMarketCap if key available, else mock) ---
  const fetchCryptoData = useCallback(async () => {
    setLoading(true);
    try {
      const coinMarketCapKey = Constants.expoConfig?.extra?.COINMARKETCAP_API_KEY;
      if (coinMarketCapKey) {
        try {
          const resp = await fetch(
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=50&convert=BRL',
            {
              headers: {
                'X-CMC_PRO_API_KEY': coinMarketCapKey,
                Accept: 'application/json',
              },
            }
          );
          if (resp.ok) {
            const json = await resp.json();
            const mapped = json.data.map((c) => ({
              id: c.id.toString(),
              symbol: c.symbol,
              name: c.name,
              icon: c.symbol.charAt(0),
              price: c.quote.BRL.price,
              change_24h: c.quote.BRL.percent_change_24h,
              market_cap: c.quote.BRL.market_cap,
              volume_24h: c.quote.BRL.volume_24h,
              rank: c.cmc_rank,
            }));
            setCryptos(mapped);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        } catch (err) {
          console.log('CoinMarketCap fetch failed, using mock:', err);
        }
      }

      // fallback: mock
      setTimeout(() => {
        setCryptos(mockCryptoData);
        setLoading(false);
        setRefreshing(false);
      }, 700);
    } catch (error) {
      console.error('Erro ao buscar dados de cripto:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados das criptomoedas');
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // --- Load favorites & watchlist from SecureStore ---
  const loadUserData = useCallback(async () => {
    try {
      const storedFav = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (storedFav) setFavorites(JSON.parse(storedFav));

      const storedWatch = await SecureStore.getItemAsync(WATCHLIST_STORAGE_KEY);
      if (storedWatch) setWatchlist(JSON.parse(storedWatch));
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  }, []);

  useEffect(() => {
    fetchCryptoData();
    loadUserData();
  }, [fetchCryptoData, loadUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCryptoData();
  };

  // --- Toggle favorite ---
  const toggleFavorite = async (cryptoId) => {
    const newFav = favorites.includes(cryptoId)
      ? favorites.filter((f) => f !== cryptoId)
      : [...favorites, cryptoId];
    try {
      await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(newFav));
      setFavorites(newFav);
    } catch (err) {
      console.error('Erro ao salvar favoritos:', err);
    }
  };

  // --- Toggle watchlist (adicionar/remover) ---
  const toggleWatchlist = async (crypto) => {
    const exists = watchlist.some((w) => w.id === crypto.id);
    let newWatch;
    if (exists) {
      newWatch = watchlist.filter((w) => w.id !== crypto.id);
    } else {
      newWatch = [...watchlist, { ...crypto, added_at: new Date().toISOString() }];
    }
    try {
      await SecureStore.setItemAsync(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatch));
      setWatchlist(newWatch);
      if (exists) {
        // remover feedback
        // opcional: Alert.alert('Removido', `${crypto.name} removida da watchlist`);
      } else {
        // opcional: Alert.alert('Adicionado', `${crypto.name} adicionada à watchlist`);
      }
    } catch (err) {
      console.error('Erro ao atualizar watchlist:', err);
    }
  };

  // --- Formatting helpers ---
  const formatPrice = (price) =>
    `R$ ${Number(price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatMarketCap = (v) => {
    if (v === undefined || v === null) return 'R$ —';
    if (v >= 1e12) return `R$ ${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`;
    return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
  };

  // --- Filter & sort ---
  const filteredCryptos = cryptos
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
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

  const favoriteCryptos = cryptos.filter((c) => favorites.includes(c.id));

  // --- Render individual crypto item (updated card) ---
  const renderCryptoItem = ({ item }) => {
    const changePositive = item.change_24h >= 0;
    const inWatchlist = watchlist.some((w) => w.id === item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        style={[
          styles.cryptoItem,
          { borderLeftColor: changePositive ? '#DFF6E8' : '#FFECEC', borderLeftWidth: 4 },
        ]}
        onPress={() => Alert.alert('Em breve', 'Detalhes da criptomoeda serão implementados')}
      >
        {/* Top row: name + rank+price */}
        <View style={styles.cryptoTop}>
          <View style={styles.leftInfo}>
            <View style={styles.rankAndIcon}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankNumber}>#{item.rank}</Text>
              </View>
              <View style={styles.cryptoIconWrap}>
                <Text style={styles.cryptoIcon}>{item.icon}</Text>
              </View>
            </View>

            <View style={{ marginLeft: 10 }}>
              <Text style={styles.code}>{item.name}</Text>
              <Text style={styles.name}>{item.symbol}</Text>
            </View>
          </View>

          <View style={styles.rightActions}>
            <View style={styles.priceRow}>
              <Text style={styles.rateText}>{formatPrice(item.price)}</Text>
            </View>

            <View
              style={[
                styles.changeBadge,
                { backgroundColor: changePositive ? '#E6FBEE' : '#FFEDED' },
              ]}
            >
              <MaterialIcons
                name={changePositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={changePositive ? TRAMPAY_BLUE : '#C62828'}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: changePositive ? '#0B6A36' : '#C62828' },
                ]}
              >
                {item.change_24h !== undefined ? `${item.change_24h.toFixed(2)}%` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom row: metrics + actions */}
        <View style={styles.cryptoBottom}>
          <View style={styles.miniInfo}>
            <Text style={styles.smallLabel}>Cap. Mercado</Text>
            <Text style={styles.smallValue}>{formatMarketCap(item.market_cap)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.miniInfo}>
            <Text style={styles.smallLabel}>Volume 24h</Text>
            <Text style={styles.smallValue}>{formatMarketCap(item.volume_24h)}</Text>
          </View>

          <View style={styles.rightButtons}>
            <TouchableOpacity
              style={[styles.iconBtn, inWatchlist ? styles.iconBtnActive : null]}
              onPress={() => toggleWatchlist(item)}
            >
              <MaterialIcons
                name={inWatchlist ? 'notifications-active' : 'notifications-none'}
                size={18}
                color={inWatchlist ? TRAMPAY_YELLOW : MUTED}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.heartWrap,
                favorites.includes(item.id) ? styles.heartActive : styles.heartInactive,
              ]}
              onPress={() => toggleFavorite(item.id)}
            >
              <MaterialIcons
                name={favorites.includes(item.id) ? 'favorite' : 'favorite-outline'}
                size={16}
                color={favorites.includes(item.id) ? TRAMPAY_YELLOW : MUTED}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmpty = ({ type }) => (
    <View style={styles.emptyFav}>
      <MaterialIcons name={type === 'fav' ? 'favorite-outline' : 'visibility'} size={56} color={MUTED} />
      <Text style={styles.emptyFavText}>
        {type === 'fav' ? 'Nenhuma favorita ainda' : 'Lista vazia'}
      </Text>
      <Text style={styles.emptyFavSub}>
        {type === 'fav' ? 'Toque no ❤️ para adicionar às suas favoritas' : 'Use o sino 🔔 para adicionar à watchlist'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={TRAMPAY_BLUE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Criptomoedas</Text>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color={TRAMPAY_BLUE} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'market' && styles.tabActive]}
          onPress={() => setSelectedTab('market')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'market' && styles.tabTextActive]}>Mercado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'favorites' && styles.tabActive]}
          onPress={() => setSelectedTab('favorites')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.tabTextActive]}>Favoritas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'watchlist' && styles.tabActive]}
          onPress={() => setSelectedTab('watchlist')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'watchlist' && styles.tabTextActive]}>Watchlist</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={MUTED} />
          <TextInput
            placeholder="Buscar criptomoeda..."
            placeholderTextColor={MUTED}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={{ marginLeft: 8, padding: 6 }}
            onPress={() => {
              const sorts = ['market_cap', 'price', 'change'];
              const idx = sorts.indexOf(sortBy);
              setSortBy(sorts[(idx + 1) % sorts.length]);
            }}
          >
            <MaterialIcons name="sort" size={20} color={TRAMPAY_YELLOW} />
          </TouchableOpacity>
        </View>

        <View style={styles.marketOverview}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
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

        {selectedTab === 'market' && (
          <FlatList
            data={filteredCryptos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCryptoItem}
            contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={<ListEmpty type="market" />}
            initialNumToRender={12}
          />
        )}

        {selectedTab === 'favorites' && (
          <FlatList
            data={favoriteCryptos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCryptoItem}
            contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={<ListEmpty type="fav" />}
            initialNumToRender={8}
          />
        )}

        {selectedTab === 'watchlist' && (
          <FlatList
            data={watchlist}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCryptoItem}
            contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={<ListEmpty type="watch" />}
            initialNumToRender={8}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

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
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

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
    marginBottom: 8,
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
    color: colors.success,
  },

  /* Crypto Item styles (mimic currency card but prettier) */
  cryptoItem: {
    backgroundColor: BACKGROUND_WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0A2340',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
    position: 'relative',
  },

  cryptoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankAndIcon: { flexDirection: 'row', alignItems: 'center' },

  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TRAMPAY_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankNumber: { fontSize: 12, fontWeight: '800', color: colors.white },

  cryptoIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6E6',
  },
  cryptoIcon: { fontSize: 20, color: colors.darkBlue },
  code: { fontSize: 15, fontWeight: '700', color: colors.darkBlue },
  name: { fontSize: 12, color: MUTED },

  rightActions: { alignItems: 'flex-end' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  rateText: { fontSize: 16, fontWeight: '800', color: colors.darkBlue },
  changeBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  changeText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },

  cryptoBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' },
  miniInfo: { alignItems: 'flex-start' },
  smallLabel: { fontSize: 11, color: MUTED },
  smallValue: { fontSize: 12, fontWeight: '700', color: colors.darkBlue },
  divider: { width: 1, height: 36, backgroundColor: '#EEF3FB', marginHorizontal: 12 },

  rightButtons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, borderRadius: 10, marginRight: 8, backgroundColor: '#F5F7FA' },
  iconBtnActive: { backgroundColor: '#FFF7E6' },

  heartWrap: { padding: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heartActive: { backgroundColor: '#FFF7E6' },
  heartInactive: { backgroundColor: '#F5F7FA' },

  rankBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: TRAMPAY_YELLOW, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  rankText: { fontSize: 10, color: colors.white, fontWeight: '700' },

  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { color: MUTED },

  emptyFav: { alignItems: 'center', paddingVertical: 48 },
  emptyFavText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: colors.darkBlue },
  emptyFavSub: { marginTop: 6, color: MUTED },
});

export default CryptoScreen;
