// Tela Principal de Câmbio e Trading - Trampay
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../styles';

const TradingHomeScreen = ({ navigation }) => {
  const [quickRates, setQuickRates] = useState({
    usd: 5.64,
    eur: 6.12,
    btc: 324500.00
  });

  // Buscar cotações rápidas para preview
  const fetchQuickRates = async () => {
    try {
      // Preview das principais cotações
      const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
      const data = await response.json();
      
      if (data.USDBRL && data.EURBRL) {
        setQuickRates({
          usd: parseFloat(data.USDBRL.bid),
          eur: parseFloat(data.EURBRL.bid),
          btc: quickRates.btc
        });
      }
    } catch (error) {
      console.log('Preview das cotações não disponível, usando valores padrão');
    }
  };

  useEffect(() => {
    fetchQuickRates();
  }, []);

  const tradingOptions = [
    {
      id: 'currency',
      title: 'Cotação de moedas internacionais',
      subtitle: `USD: R$${quickRates.usd.toFixed(2)} • EUR: R$${quickRates.eur.toFixed(2)}`,
      icon: 'attach-money',
      screen: 'CurrencyTrading',
      color: colors.primaryDark
    },
    {
      id: 'crypto',
      title: 'Índices de Criptomoedas',
      subtitle: `BTC: R$${quickRates.btc.toLocaleString('pt-BR')} • ETH: R$21.450,00`,
      icon: 'trending-up',
      screen: 'CryptoTrading', 
      color: colors.warning
    },
    {
      id: 'stocks',
      title: 'Bolsa de Valores e Ações',
      subtitle: 'IBOV: 126.340 • S&P500: 4.567',
      icon: 'trending-up',
      screen: 'StocksTrading',
      color: colors.success
    }
  ];

  const handleOptionPress = (option) => {
    navigation.navigate(option.screen);
  };

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
        <Text style={styles.headerTitle}>Câmbio e Trading</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trading Options */}
        <View style={styles.optionsContainer}>
          {tradingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, { borderLeftColor: option.color }]}
              onPress={() => handleOptionPress(option)}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                  <MaterialIcons name={option.icon} size={28} color={colors.white} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textLight} />
              </View>
            </TouchableOpacity>
          ))}
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
              onPress={() => {
                Alert.alert('Em breve', 'Portfolio tracker será implementado em breve!');
              }}
            >
              <MaterialIcons name="pie-chart" size={24} color={colors.success} />
              <Text style={styles.quickActionText}>Portfolio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Overview */}
        <View style={styles.marketOverview}>
          <Text style={styles.sectionTitle}>Visão Geral do Mercado</Text>
          
          <View style={styles.marketCard}>
            <View style={styles.marketRow}>
              <Text style={styles.marketLabel}>Dólar Americano</Text>
              <Text style={styles.marketValue}>R$ {quickRates.usd.toFixed(2)}</Text>
              <View style={styles.marketChange}>
                <MaterialIcons name="trending-up" size={16} color={colors.success} />
                <Text style={styles.marketChangeText}>+0.5%</Text>
              </View>
            </View>

            <View style={styles.marketRow}>
              <Text style={styles.marketLabel}>Euro</Text>
              <Text style={styles.marketValue}>R$ {quickRates.eur.toFixed(2)}</Text>
              <View style={styles.marketChange}>
                <MaterialIcons name="trending-down" size={16} color={colors.danger} />
                <Text style={styles.marketChangeText}>-0.2%</Text>
              </View>
            </View>

            <View style={styles.marketRow}>
              <Text style={styles.marketLabel}>Bitcoin</Text>
              <Text style={styles.marketValue}>R$ {quickRates.btc.toLocaleString('pt-BR')}</Text>
              <View style={styles.marketChange}>
                <MaterialIcons name="trending-up" size={16} color={colors.success} />
                <Text style={styles.marketChangeText}>+2.1%</Text>
              </View>
            </View>
          </View>
        </View>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.medium,
  },
  optionsContainer: {
    marginBottom: spacing.large,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.medium,
  },
  quickActionsContainer: {
    marginBottom: spacing.large,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: colors.white,
    width: '48%',
    padding: spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.small,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.text,
    marginTop: spacing.small,
    textAlign: 'center',
  },
  marketOverview: {
    marginBottom: spacing.large,
  },
  marketCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.medium,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  marketLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  marketValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.small,
  },
  marketChange: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  marketChangeText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default TradingHomeScreen;