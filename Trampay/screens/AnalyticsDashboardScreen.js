// Tela de Analytics Dashboard - Trampay
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { colors, fonts, spacing } from '../styles';
import LineChartEnhanced from '../components/LineChartEnhanced';
import PieChartEnhanced from '../components/PieChartEnhanced';
import BarChart from '../components/BarChart';
import {
  fetchAnalyticsSummary,
  fetchExpensesByCategory,
  fetchRevenueByCategory,
  fetchGrowthTrends,
  fetchCashFlow,
} from '../services/analyticsService';

const { width } = Dimensions.get('window');
const chartWidth = Math.min(width - 40, 380);

export default function AnalyticsDashboardScreen({ navigation }) {
  const { isPro } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [growthTrends, setGrowthTrends] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [summaryData, expenses, revenue, trends, cashFlowData] = await Promise.all([
        fetchAnalyticsSummary().catch(() => null),
        fetchExpensesByCategory().catch(() => []),
        fetchRevenueByCategory().catch(() => []),
        fetchGrowthTrends().catch(() => []),
        fetchCashFlow(period).catch(() => []),
      ]);

      setSummary(summaryData);
      setExpensesByCategory(expenses || []);
      setRevenueByCategory(revenue || []);
      setGrowthTrends(trends || []);
      setCashFlow(cashFlowData || []);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const StatCard = ({ icon, label, value, color, sublabel }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <MaterialIcons name={icon} size={28} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Resumo Geral */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="trending-up"
              label="Receitas"
              value={formatCurrency(summary?.income)}
              color={colors.success || '#22c55e'}
            />
            <StatCard
              icon="trending-down"
              label="Despesas"
              value={formatCurrency(summary?.expenses)}
              color={colors.danger || '#ef4444'}
            />
            <StatCard
              icon="account-balance-wallet"
              label="Saldo"
              value={formatCurrency((summary?.income || 0) - (summary?.expenses || 0))}
              color={(summary?.income || 0) - (summary?.expenses || 0) >= 0 ? colors.success : colors.danger}
            />
            <StatCard
              icon="people"
              label="Clientes"
              value={summary?.clients || 0}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Selector de período para fluxo de caixa */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fluxo de Caixa</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
                onPress={() => setPeriod('week')}
              >
                <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
                  Semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
                onPress={() => setPeriod('month')}
              >
                <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
                  Mês
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chartContainer}>
            <LineChartEnhanced data={cashFlow} width={chartWidth} height={250} />
          </View>
        </View>

        {/* Tendências de Crescimento */}
        {growthTrends && growthTrends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tendências de Crescimento</Text>
            <View style={styles.chartContainer}>
              <LineChartEnhanced
                data={growthTrends}
                width={chartWidth}
                height={250}
                title="Evolução Mensal"
              />
            </View>
          </View>
        )}

        {/* Despesas por Categoria */}
        {expensesByCategory && expensesByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despesas por Categoria</Text>
            <View style={styles.chartRow}>
              <View style={styles.chartContainerPie}>
                <PieChartEnhanced data={expensesByCategory} size={220} />
              </View>
              <View style={{ marginTop: 20, width: chartWidth }}>
                <BarChart data={expensesByCategory} width={chartWidth} height={280} showLegend={false} />
              </View>
            </View>
          </View>
        )}

        {/* Receitas por Categoria */}
        {revenueByCategory && revenueByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receitas por Categoria</Text>
            <View style={styles.chartRow}>
              <View style={styles.chartContainerPie}>
                <PieChartEnhanced data={revenueByCategory} size={220} />
              </View>
              <View style={{ marginTop: 20, width: chartWidth }}>
                <BarChart data={revenueByCategory} width={chartWidth} height={280} showLegend={false} />
              </View>
            </View>
          </View>
        )}

        {/* Badge PRO */}
        {!isPro && (
          <View style={styles.proPrompt}>
            <MaterialIcons name="workspace-premium" size={32} color={colors.primary} />
            <Text style={styles.proPromptTitle}>Desbloqueie Analytics Avançados</Text>
            <Text style={styles.proPromptText}>
              Com o Trampay PRO você tem acesso a relatórios detalhados, IA assistente e muito mais!
            </Text>
            <TouchableOpacity
              style={styles.proButton}
              onPress={() => navigation.navigate('AssinePro')}
            >
              <Text style={styles.proButtonText}>Assinar PRO</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, color: colors.textLight, fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.textDark },
  content: { flex: 1 },
  section: { padding: spacing.lg, backgroundColor: colors.white, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textDark, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.xs * 2) / 2,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.xs,
    borderLeftWidth: 4,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  statLabel: { fontSize: 13, fontFamily: fonts.medium, color: colors.textLight, marginLeft: spacing.sm },
  statValue: { fontSize: 22, fontFamily: fonts.bold, marginTop: 4 },
  statSublabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  periodSelector: { flexDirection: 'row', backgroundColor: colors.lightGray, borderRadius: 8, padding: 2 },
  periodButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 6 },
  periodButtonActive: { backgroundColor: colors.primary },
  periodButtonText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textLight },
  periodButtonTextActive: { color: colors.white },
  chartContainer: { alignItems: 'center', backgroundColor: colors.white, padding: spacing.sm, borderRadius: 12 },
  chartContainerPie: { alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12 },
  chartRow: { alignItems: 'center' },
  proPrompt: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  proPromptTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textDark, marginTop: spacing.md },
  proPromptText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  proButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  proButtonText: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
});
