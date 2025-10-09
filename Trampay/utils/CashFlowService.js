// Serviço compartilhado para Fluxo de Caixa - Trampay
import * as SecureStore from 'expo-secure-store';

// Chaves de armazenamento
export const TRANSACTIONS_STORAGE_KEY = 'trampay_transactions';
export const BALANCE_STORAGE_KEY = 'trampay_balance';

// Classe de serviço para fluxo de caixa
export class CashFlowService {
  // Carregar transações
  static async loadTransactions() {
    try {
      const stored = await SecureStore.getItemAsync(TRANSACTIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      return [];
    }
  }

  // Carregar saldo
  static async loadBalance() {
    try {
      const stored = await SecureStore.getItemAsync(BALANCE_STORAGE_KEY);
      return stored ? parseFloat(stored) : 0;
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
      return 0;
    }
  }

  // Salvar transações
  static async saveTransactions(transactions) {
    try {
      await SecureStore.setItemAsync(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      return false;
    }
  }

  // Salvar saldo
  static async saveBalance(balance) {
    try {
      await SecureStore.setItemAsync(BALANCE_STORAGE_KEY, balance.toString());
      return true;
    } catch (error) {
      console.error('Erro ao salvar saldo:', error);
      return false;
    }
  }

  // Adicionar nova transação
  static async addTransaction(transactionData) {
    try {
      const transactions = await this.loadTransactions();
      const balance = await this.loadBalance();

      const newTransaction = {
        ...transactionData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        status: transactionData.isRecurring ? 'agendado' : 'concluído'
      };

      const updatedTransactions = [...transactions, newTransaction];
      await this.saveTransactions(updatedTransactions);

      // Atualizar saldo se a transação não for recorrente
      if (!transactionData.isRecurring) {
        const newBalance = transactionData.type === 'income' 
          ? balance + transactionData.amount 
          : balance - transactionData.amount;
        await this.saveBalance(newBalance);
      }

      return { success: true, transaction: newTransaction };
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      return { success: false, error };
    }
  }

  // Calcular resumo financeiro
  static calculateFinancialSummary(transactions, period = 'monthly') {
    const now = new Date();
    const startDate = period === 'monthly' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const periodTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      return transactionDate >= startDate && transactionDate <= now;
    });

    const income = periodTransactions
      .filter(t => t.type === 'income' && t.status === 'concluído')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense' && t.status === 'concluído')
      .reduce((sum, t) => sum + t.amount, 0);

    const total = income + expenses;
    const incomePercentage = total > 0 ? (income / total) * 100 : 50;
    const expensePercentage = total > 0 ? (expenses / total) * 100 : 50;

    return {
      income,
      expenses,
      incomePercentage: incomePercentage.toFixed(1),
      expensePercentage: expensePercentage.toFixed(1),
      total
    };
  }

  // Calcular previsão financeira
  static calculateFinancialForecast(transactions) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

    const getForecastForPeriod = (startDate, endDate) => {
      const periodTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date || transaction.createdAt);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return { income, expenses };
    };

    return {
      today: getForecastForPeriod(today, today),
      tomorrow: getForecastForPeriod(tomorrow, tomorrow),
      future: getForecastForPeriod(tomorrow, nextWeek)
    };
  }
}