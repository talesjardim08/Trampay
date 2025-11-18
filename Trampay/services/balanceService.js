// Balance Service - Gerencia saldo em mãos do usuário via API backend
import api from './api';

/**
 * Busca o saldo do usuário do backend
 * @param {string} currency - Moeda (default: BRL)
 * @returns {Promise<number>} Saldo do usuário
 */
export async function fetchBalance(currency = 'BRL') {
  try {
    const resp = await api.get('/users/balance', { params: { currency } });
    console.log('[BalanceService] Saldo obtido:', resp?.data?.balance);
    return resp?.data?.balance || 0;
  } catch (err) {
    console.error('[BalanceService] Erro ao buscar saldo:', err?.response?.data || err.message);
    return 0; // Retorna 0 em caso de erro ao invés de null
  }
}

/**
 * Ajusta o saldo do usuário (adiciona ou subtrai)
 * @param {number} amount - Valor a ajustar (positivo para adicionar, negativo para subtrair)
 * @param {string} currency - Moeda (default: BRL)
 * @returns {Promise<{success: boolean, newBalance?: number, error?: any}>}
 */
export async function adjustBalance(amount, currency = 'BRL') {
  try {
    const resp = await api.patch('/users/balance/adjust', { amount, currency });
    console.log('[BalanceService] Saldo ajustado. Novo saldo:', resp?.data?.newBalance);
    return { success: true, newBalance: resp?.data?.newBalance };
  } catch (err) {
    console.error('[BalanceService] Erro ao ajustar saldo:', err?.response?.data || err.message);
    return { success: false, error: err };
  }
}

/**
 * Define o saldo do usuário (override completo)
 * @param {number} balance - Novo saldo
 * @param {string} currency - Moeda (default: BRL)
 * @returns {Promise<{success: boolean, balance?: number, error?: any}>}
 */
export async function updateBalance(balance, currency = 'BRL') {
  try {
    const resp = await api.put('/users/balance', { balance, currency });
    console.log('[BalanceService] Saldo atualizado:', resp?.data?.balance);
    return { success: true, balance: resp?.data?.balance };
  } catch (err) {
    console.error('[BalanceService] Erro ao atualizar saldo:', err?.response?.data || err.message);
    return { success: false, error: err };
  }
}


//rgfdgd