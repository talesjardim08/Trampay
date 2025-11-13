import api from './api';

export const fetchAnalyticsSummary = async () => {
  try {
    const response = await api.get('/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar resumo:', error);
    throw error;
  }
};

export const fetchCashFlow = async (period = 'month') => {
  try {
    const response = await api.get(`/analytics/cashflow?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar fluxo de caixa:', error);
    throw error;
  }
};

export const fetchExpensesByCategory = async () => {
  try {
    const response = await api.get('/analytics/expenses-by-category');
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar despesas por categoria:', error);
    throw error;
  }
};

export const fetchRevenueByCategory = async () => {
  try {
    const response = await api.get('/analytics/revenue-by-category');
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar receitas por categoria:', error);
    throw error;
  }
};

export const fetchTopClients = async (limit = 5) => {
  try {
    const response = await api.get(`/analytics/top-clients?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar top clientes:', error);
    throw error;
  }
};

export const fetchProfitableItems = async (limit = 5) => {
  try {
    const response = await api.get(`/analytics/profitable-items?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar items lucrativos:', error);
    throw error;
  }
};

export const fetchGrowthTrends = async () => {
  try {
    const response = await api.get('/analytics/growth-trends');
    return response.data;
  } catch (error) {
    console.error('[AnalyticsService] Erro ao buscar tendências:', error);
    throw error;
  }
};
