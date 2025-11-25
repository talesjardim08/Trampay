import api from './api';

export const fetchTransactions = async (filters = {}) => {
  try {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const response = await api.get('/transactions', { params });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    const payload = {
      title: transactionData.description || transactionData.name || 'Transação',
      description: transactionData.description || transactionData.name || 'Transação',
      amount: parseFloat(transactionData.amount),
      type: transactionData.type,
      currency: transactionData.currency || 'BRL',
      transactionDate: transactionData.transactionDate || new Date().toISOString(),
      category: transactionData.category || 'Outros',
      status: transactionData.isRecurring ? 'agendado' : 'concluído',
      metadata: JSON.stringify(transactionData.metadata || {}),
    };

    const response = await api.post('/transactions', payload);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false, error };
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    await api.delete(`/transactions/${transactionId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    return { success: false, error };
  }
};
