// CurrencyScreen.js (Estético TramPay - adaptado para paleta enviada)
// Mantém funcionalidades: cotações (AwesomeAPI + fallback ExchangeRate), conversor, favoritos (SecureStore), modal selector, pull-to-refresh.

import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Animated,
  Modal,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors as baseColors, fonts, spacing } from '../styles'; // mantém seu arquivo de estilos, se algo faltar usamos valores locais

const { width } = Dimensions.get('window');

// --- Paleta fornecida pelo usuário (copiada para facilitar uso) ---
const colors = {
  background: '#F7F7F9',
  card: '#FFFFFF',
  primary: '#FFD84D',      // amarelo principal (substitui azul)
  primaryDark: '#E6BA2F',  // amarelo escuro
  darkBlue: '#0F1724',
  text: '#24313A',         // títulos em preto-escuro
  textLight: '#7B8790',
  success: '#0BB066',
  danger: '#E25555',
  warning: '#F5B041',
  white: '#FFFFFF',
};

// para manter nomes originais usados no código (ex.: TRAMPAY_BLUE), apenas redirecionamos os valores:
const TRAMPAY_BLUE = colors.primary; // antes azul, agora amarelo
const TRAMPAY_YELLOW = colors.primaryDark; // mantendo variável usada no layout
const BACKGROUND_WHITE = colors.card;
const LIGHT_GREY = colors.background;
const MUTED = colors.textLight;

const EXCHANGE_API_KEY = '7b0dd9209108c6604ede5f39'; // fornecida
const FAVORITES_STORAGE_KEY = 'currency_favorites';

// --- Lista de moedas ampliada (mais moedas conforme pedido) ---
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
  { code: 'CLP', name: 'Peso Chileno', flag: '🇨🇱' },

  // moedas adicionais
  { code: 'MXN', name: 'Peso Mexicano', flag: '🇲🇽' },
  { code: 'INR', name: 'Rúpia Indiana', flag: '🇮🇳' },
  { code: 'ZAR', name: 'Rand Sul-Africano', flag: '🇿🇦' },
  { code: 'SEK', name: 'Coroa Sueca', flag: '🇸🇪' },
  { code: 'NOK', name: 'Coroa Norueguesa', flag: '🇳🇴' },
  { code: 'SGD', name: 'Dólar de Singapura', flag: '🇸🇬' },
  { code: 'NZD', name: 'Dólar Neozelandês', flag: '🇳🇿' },
  { code: 'THB', name: 'Baht Tailandês', flag: '🇹🇭' },
  { code: 'KRW', name: 'Won Sul-Coreano', flag: '🇰🇷' },
  { code: 'AED', name: 'Dirham dos EAU', flag: '🇦🇪' },
  { code: 'ILS', name: 'Novo Shekel', flag: '🇮🇱' },
  { code: 'TRY', name: 'Lira Turca', flag: '🇹🇷' },
  { code: 'PLN', name: 'Zloty Polonês', flag: '🇵🇱' },
  { code: 'HUF', name: 'Florim Húngaro', flag: '🇭🇺' },
  { code: 'IDR', name: 'Rupia Indonésia', flag: '🇮🇩' },
];

const CurrencyScreen = ({ navigation }) => {
  const [currencies, setCurrencies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('rates'); // 'rates' | 'converter' | 'favorites'
  const [converterFrom, setConverterFrom] = useState('USD');
  const [converterTo, setConverterTo] = useState('BRL');
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState(null); // 'from' | 'to'

  // animation refs (globais)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listTranslate = useRef(new Animated.Value(8)).current;

  // run entry animation (mais suave)
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

  // Fetch currencies: AwesomeAPI primary, ExchangeRate fallback
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const pairs = mainCurrencies.filter(c => c.code !== 'BRL').map(c => `${c.code}-BRL`).join(',');
      let awesomeData = null;

      // Try AwesomeAPI first
      try {
        const awesomeResp = await fetch(`https://economia.awesomeapi.com.br/json/last/${pairs}`);
        if (awesomeResp.ok) {
          awesomeData = await awesomeResp.json();
        }
      } catch (err) {
        awesomeData = null;
      }

      let exchangeJson = null;
      if (!awesomeData) {
        try {
          const exchResp = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/BRL`);
          if (exchResp.ok) exchangeJson = await exchResp.json();
        } catch (err) {
          exchangeJson = null;
        }
      }

      const currencyData = mainCurrencies.map(curr => {
        if (curr.code === 'BRL') return { ...curr, rate: 1.0, change: 0, high: 1.0, low: 1.0, timestamp: new Date().toISOString() };

        // AwesomeAPI
        if (awesomeData) {
          const key = `${curr.code}BRL`;
          const apiData = awesomeData[key];
          if (apiData) {
            return {
              ...curr,
              rate: parseFloat(apiData.bid),
              change: parseFloat(apiData.pctChange || 0),
              high: parseFloat(apiData.high || 0),
              low: parseFloat(apiData.low || 0),
              timestamp: apiData.create_date || new Date().toISOString(),
            };
          }
        }

        // ExchangeRate fallback (base BRL)
        if (exchangeJson && exchangeJson.conversion_rates) {
          const conv = exchangeJson.conversion_rates[curr.code];
          if (conv !== undefined && conv !== null) {
            const rateBRL = conv === 0 ? 0 : 1 / conv; // 1 unit CUR in BRL
            return {
              ...curr,
              rate: parseFloat(rateBRL),
              change: 0,
              high: parseFloat(rateBRL),
              low: parseFloat(rateBRL),
              timestamp: exchangeJson.time_last_update_utc || new Date().toISOString(),
            };
          }
        }

        // generic fallback
        return { ...curr, rate: 0, change: 0, high: 0, low: 0, timestamp: new Date().toISOString() };
      });

      setCurrencies(currencyData);
      runEntryAnim();
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as cotações. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Favorites (SecureStore)
  const loadFavorites = async () => {
    try {
      const stored = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
    }
  };

  const saveFavorites = async (newFav) => {
    try {
      await SecureStore.setItemAsync(FAVORITES_STORAGE_KEY, JSON.stringify(newFav));
      setFavorites(newFav);
    } catch (err) {
      console.error('Erro ao salvar favoritos:', err);
    }
  };

  const toggleFavorite = (currencyCode) => {
    const newFavorites = favorites.includes(currencyCode)
      ? favorites.filter(f => f !== currencyCode)
      : [...favorites, currencyCode];
    saveFavorites(newFavorites);
  };

  // Converter
  const convertCurrency = () => {
    const fromCurrency = currencies.find(c => c.code === converterFrom);
    const toCurrency = currencies.find(c => c.code === converterTo);
    if (!fromCurrency || !toCurrency) {
      setConvertedAmount('0');
      return;
    }
    const amt = parseFloat(amount) || 0;
    let result = 0;
    if (converterFrom === 'BRL' && converterTo !== 'BRL') result = amt / toCurrency.rate;
    else if (converterFrom !== 'BRL' && converterTo === 'BRL') result = amt * fromCurrency.rate;
    else if (converterFrom !== 'BRL' && converterTo !== 'BRL') {
      const brlAmount = amt * fromCurrency.rate;
      result = brlAmount / toCurrency.rate;
    } else result = amt;
    setConvertedAmount(isFinite(result) ? result.toFixed(2) : '0');
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
    (currency.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (currency.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteCurrencies = currencies.filter(c => favorites.includes(c.code));

  // Pressable scale helper (for nice touch feedback)
  const useScalePress = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    return { scale, onPressIn, onPressOut };
  };

  // Render currency card
  // OBS: mantive o nome da função renderCurrencyItem exatamente como você pediu.
  // Para respeitar as regras dos Hooks, renderCurrencyItem retorna um componente interno que usa useScalePress.
  const renderCurrencyItem = ({ item, index }) => {
    // componente interno que pode usar hooks e animar por item (stagger)
    const RenderCurrencyItemInner = () => {
      const { scale, onPressIn, onPressOut } = useScalePress();
      const changePositive = item.change >= 0;

      // animação por item (stagger)
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

      return (
        <Animated.View
          style={[
            styles.currencyItem,
            {
              opacity: itemOpacity, // combina com animação global de tela
              transform: [
                { translateY: Animated.add(listTranslate, itemTranslate) },
                { scale },
              ],
            },
          ]}
        >
          <View style={styles.currencyTop}>
            <View style={styles.leftInfo}>
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </View>
            </View>

            <View style={styles.rightActions}>
              <Text style={styles.rateText}>R$ {item.rate ? item.rate.toFixed(2) : '—'}</Text>

              <View style={[styles.changeBadge, { backgroundColor: changePositive ? '#E6FBEE' : '#FFEDED' }]}>
                <MaterialIcons
                  name={changePositive ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={changePositive ? TRAMPAY_BLUE : '#C62828'}
                />
                <Text style={[styles.changeText, { color: changePositive ? '#0B6A36' : '#C62828' }]}>
                  {item.change ? `${item.change.toFixed(2)}%` : '—'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.currencyBottom}>
            <View style={styles.miniInfo}>
              <Text style={styles.smallLabel}>Máx</Text>
              <Text style={styles.smallValue}>R$ {item.high ? item.high.toFixed(2) : '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.miniInfo}>
              <Text style={styles.smallLabel}>Mín</Text>
              <Text style={styles.smallValue}>R$ {item.low ? item.low.toFixed(2) : '—'}</Text>
            </View>

            <Pressable
              onPressIn={onPressIn}
              onPressOut={() => { onPressOut(); toggleFavorite(item.code); }}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.heartWrap, favorites.includes(item.code) ? styles.heartActive : styles.heartInactive]}>
                <MaterialIcons name={favorites.includes(item.code) ? 'favorite' : 'favorite-outline'} size={18} color={favorites.includes(item.code) ? TRAMPAY_YELLOW : MUTED} />
              </View>
            </Pressable>
          </View>
        </Animated.View>
      );
    };

    return <RenderCurrencyItemInner />;
  };

  // Modal selector functions
  const openSelector = (target) => {
    setSelectorTarget(target);
    setSelectorVisible(true);
  };
  const selectCurrencyFromModal = (code) => {
    if (selectorTarget === 'from') setConverterFrom(code);
    if (selectorTarget === 'to') setConverterTo(code);
    setSelectorVisible(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={TRAMPAY_BLUE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cotações Internacionais</Text>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={22} color={TRAMPAY_BLUE} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'rates' && styles.tabActive]}
          onPress={() => setSelectedTab('rates')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'rates' && styles.tabTextActive]}>Cotações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'converter' && styles.tabActive]}
          onPress={() => setSelectedTab('converter')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'converter' && styles.tabTextActive]}>Conversor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'favorites' && styles.tabActive]}
          onPress={() => setSelectedTab('favorites')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.tabTextActive]}>Favoritos</Text>
        </TouchableOpacity>
      </View>

      {/* Substituí o ScrollView por View para evitar aninhar FlatList */}
      <View style={styles.content}>
        {selectedTab === 'rates' && (
          <>
            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color={MUTED} />
              <TextInput
                placeholder="Buscar moeda..."
                placeholderTextColor={MUTED}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.listWrap}>
              {loading ? (
                <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>Carregando cotações...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredCurrencies}
                  keyExtractor={(item) => item.code}
                  renderItem={renderCurrencyItem}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  initialNumToRender={12}
                />
              )}
            </View>
          </>
        )}

        {selectedTab === 'converter' && (
          <View style={styles.converterCard}>
            <Text style={styles.converterTitle}>Conversor de Moedas</Text>

            <View style={styles.convRow}>
              <View style={styles.convLeft}>
                <Text style={styles.convLabel}>Valor</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={styles.convInput}
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={styles.convRight}>
                <Text style={styles.convLabel}>Resultado</Text>
                <View style={styles.resultBox}>
                  <Text style={styles.resultNumber}>{convertedAmount}</Text>
                </View>
              </View>
            </View>

            <View style={styles.selectorRow}>
              <TouchableOpacity style={styles.selectorBtn} onPress={() => openSelector('from')}>
                <Text style={styles.selectorLabel}>De</Text>
                <Text style={styles.selectorValue}>{converterFrom}</Text>
                <MaterialIcons name="expand-more" size={18} color={MUTED} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.swapBtn} onPress={() => { const t = converterFrom; setConverterFrom(converterTo); setConverterTo(t); }}>
                <MaterialIcons name="swap-horiz" size={22} color={TRAMPAY_BLUE} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.selectorBtn} onPress={() => openSelector('to')}>
                <Text style={styles.selectorLabel}>Para</Text>
                <Text style={styles.selectorValue}>{converterTo}</Text>
                <MaterialIcons name="expand-more" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickRow}>
              {['1', '10', '100', '1000'].map((v) => (
                <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setAmount(v)}>
                  <Text style={styles.quickText}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'favorites' && (
          <View style={styles.favWrap}>
            {favoriteCurrencies.length === 0 ? (
              <View style={styles.emptyFav}>
                <MaterialIcons name="favorite-outline" size={56} color={MUTED} />
                <Text style={styles.emptyFavText}>Você não possui moedas favoritas</Text>
                <Text style={styles.emptyFavSub}>Toque no coração nos cards para favoritar</Text>
              </View>
            ) : (
              <FlatList
                data={favoriteCurrencies}
                keyExtractor={(item) => item.code}
                renderItem={renderCurrencyItem}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                initialNumToRender={8}
              />
            )}
          </View>
        )}
      </View>

      {/* Modal selector */}
      <Modal visible={selectorVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Escolha uma moeda</Text>
            <FlatList
              data={mainCurrencies}
              keyExtractor={(i) => i.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalRow} onPress={() => selectCurrencyFromModal(item.code)}>
                  <Text style={styles.modalFlag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCode}>{item.code}</Text>
                    <Text style={styles.modalName}>{item.name}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={MUTED} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectorVisible(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: LIGHT_GREY,
    // adiciona um pequeno padding top pra garantir que o título não seja "comido"
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
  // título agora em preto (colors.text) e deslocado um pouco pra baixo se necessário
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
  // texto das tabs agora usa cores da paleta
  tabText: { color: TRAMPAY_BLUE, fontWeight: '700' },
  tabTextActive: { color: BACKGROUND_WHITE },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

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

  listWrap: { marginBottom: 12 },

  currencyItem: {
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
  currencyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftInfo: { flexDirection: 'row', alignItems: 'center' },
  flag: { fontSize: 28 },
  code: { fontSize: 16, fontWeight: '700', color: '#0F2438' },
  name: { fontSize: 12, color: MUTED },

  rightActions: { alignItems: 'flex-end' },
  rateText: { fontSize: 16, fontWeight: '800', color: '#0F2438' },
  changeBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  changeText: { marginLeft: 6, fontSize: 12, fontWeight: '700' },

  currencyBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' },
  miniInfo: { alignItems: 'center' },
  smallLabel: { fontSize: 11, color: MUTED },
  smallValue: { fontSize: 12, fontWeight: '700', color: '#0F2438' },
  divider: { width: 1, height: 28, backgroundColor: '#EEF3FB', marginHorizontal: 12 },

  heartWrap: { padding: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heartActive: { backgroundColor: '#FFF7E6' },
  heartInactive: { backgroundColor: '#F5F7FA' },

  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { color: MUTED },

  // Converter styles
  converterCard: {
    backgroundColor: BACKGROUND_WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0A2340',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  converterTitle: { fontSize: 18, fontWeight: '700', color: '#0F2438', marginBottom: 12, textAlign: 'center' },

  convRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  convLeft: { flex: 1 },
  convRight: { flex: 1 },
  convLabel: { fontSize: 12, color: MUTED, marginBottom: 6 },
  convInput: {
    backgroundColor: LIGHT_GREY,
    padding: 12,
    borderRadius: 12,
    fontSize: 18,
    color: '#0F2438',
    borderWidth: 1,
    borderColor: '#EEF3FB',
  },
  resultBox: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultNumber: { fontSize: 20, fontWeight: '800', color: TRAMPAY_BLUE },

  selectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  selectorBtn: { flex: 1, backgroundColor: BACKGROUND_WHITE, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF3FB', flexDirection: 'row', justifyContent: 'space-between' },
  selectorLabel: { fontSize: 12, color: MUTED },
  selectorValue: { fontSize: 16, fontWeight: '800', color: '#0F2438' },
  swapBtn: { marginHorizontal: 8, backgroundColor: LIGHT_GREY, padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { flex: 1, backgroundColor: TRAMPAY_BLUE, marginHorizontal: 4, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  quickText: { color: BACKGROUND_WHITE, fontWeight: '700' },

  // Favorites
  favWrap: { marginBottom: 24 },
  emptyFav: { alignItems: 'center', paddingVertical: 48 },
  emptyFavText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#0F2438' },
  emptyFavSub: { marginTop: 6, color: MUTED },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '70%', backgroundColor: BACKGROUND_WHITE, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F2438', marginBottom: 8 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F4F8' },
  modalFlag: { fontSize: 22, marginRight: 10 },
  modalCode: { fontSize: 14, fontWeight: '700', color: '#0F2438' },
  modalName: { fontSize: 12, color: MUTED },
  modalClose: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  modalCloseText: { color: TRAMPAY_BLUE, fontWeight: '700' },
});

export default CurrencyScreen;
