import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import withPremiumProtection from './hocs/withPremiumProtection';

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

function TradingHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [quickRates, setQuickRates] = useState({
    usd: 0,
    eur: 0,
    btc: 0,
    ibov: 0,
    sp500: 0,
  });

  const EXCHANGE_API_KEY = '7b0dd9209108c6604ede5f39';
  const HG_API_KEY = 'f6ba5a2e';

  // 🔹 Busca de cotações reais (ExchangeRateAPI + CoinGecko + HG Brasil)
  const fetchQuickRates = async () => {
    try {
      setLoading(true);

      // 🟡 1. Cotações de moedas (base BRL)
      const fxResp = await fetch(
        `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/BRL`
      );
      const fxJson = await fxResp.json();

      const usdRate = fxJson?.conversion_rates?.USD
        ? 1 / fxJson.conversion_rates.USD
        : 5.20;
      const eurRate = fxJson?.conversion_rates?.EUR
        ? 1 / fxJson.conversion_rates.EUR
        : 5.60;

      // 🟣 2. Cotação de Bitcoin (CoinGecko)
      const cryptoResp = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl'
      );
      const cryptoJson = await cryptoResp.json();
      const btcRate = cryptoJson?.bitcoin?.brl ?? 175000;

      // 🟢 3. Índices da Bolsa (HG Brasil)
      const hgResp = await fetch(
        `https://api.hgbrasil.com/finance?key=${HG_API_KEY}`
      );
      const hgJson = await hgResp.json();

      const ibov = hgJson?.results?.stocks?.IBOVESPA?.points ?? 126340;
      const sp500 = hgJson?.results?.stocks?.SP500?.points ?? 4567;

      setQuickRates({
        usd: usdRate,
        eur: eurRate,
        btc: btcRate,
        ibov,
        sp500,
      });
    } catch (error) {
      console.warn('Erro ao buscar taxas:', error);
      setQuickRates({
        usd: 5.00,
        eur: 5.60,
        btc: 175000,
        ibov: 126340,
        sp500: 4567,
      }); // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuickRates();
    const interval = setInterval(fetchQuickRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const tradingOptions = [
    {
      id: 'currency',
      title: 'Cotação de Moedas Internacionais',
      subtitle: `USD: R$${quickRates.usd.toFixed(2)} • EUR: R$${quickRates.eur.toFixed(2)}`,
      icon: 'attach-money',
      screen: 'CurrencyTrading',
      color: colors.primaryDark,
    },
    {
      id: 'crypto',
      title: 'Índices de Criptomoedas',
      subtitle: `BTC: R$${quickRates.btc.toLocaleString('pt-BR')}`,
      icon: 'trending-up',
      screen: 'CryptoTrading',
      color: colors.warning,
    },
    {
      id: 'stocks',
      title: 'Bolsa de Valores e Ações',
      subtitle: `IBOV: ${quickRates.ibov.toLocaleString('pt-BR')} • S&P500: ${quickRates.sp500.toLocaleString('pt-BR')}`,
      icon: 'show-chart',
      screen: 'StocksTrading',
      color: colors.success,
    },
  ];

  const handleOptionPress = (option) => {
    if (navigation && option.screen) navigation.navigate(option.screen);
    else Alert.alert('Erro', 'Tela não encontrada.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Câmbio e Trading</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trading Options */}
        <View style={styles.optionsContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primaryDark} size="small" />
              <Text style={styles.loadingText}>Atualizando cotações...</Text>
            </View>
          ) : (
            tradingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, { borderLeftColor: option.color }]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.9}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                    <MaterialIcons name={option.icon} size={26} color={colors.white} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CurrencyTrading', { action: 'converter' })}
            >
              <MaterialIcons name="swap-horiz" size={24} color={colors.primaryDark} />
              <Text style={styles.quickActionText}>Conversor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('CryptoTrading', { action: 'watchlist' })}
            >
              <MaterialIcons name="favorite-outline" size={24} color={colors.danger} />
              <Text style={styles.quickActionText}>Favoritos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('StocksTrading', { action: 'alerts' })}
            >
              <MaterialIcons name="notifications-active" size={24} color={colors.warning} />
              <Text style={styles.quickActionText}>Alertas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() =>
                Alert.alert('Em breve', 'Portfolio tracker será implementado em breve!')
              }
            >
              <MaterialIcons name="pie-chart" size={24} color={colors.success} />
              <Text style={styles.quickActionText}>Portfolio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkBlue,
  },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  loadingText: { marginLeft: 8, color: colors.textLight, fontSize: 13 },
  optionsContainer: { marginTop: 10 },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 14,
    borderLeftWidth: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 2,
  },
  optionContent: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.darkBlue },
  optionSubtitle: { fontSize: 12, color: colors.textLight, marginTop: 3 },
  quickActionsContainer: { marginTop: 25 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkBlue,
    marginBottom: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  quickActionText: { fontSize: 13, fontWeight: '600', color: colors.darkBlue, marginTop: 8 },
});

export default withPremiumProtection(TradingHomeScreen);
