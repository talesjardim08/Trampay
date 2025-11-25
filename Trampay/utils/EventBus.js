// utils/EventBus.js
const listeners = {};

export const Events = {
  BalanceUpdated: 'balance_updated',
  TransactionsUpdated: 'transactions_updated',
};

export const emit = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach(callback => callback(data));
  }
};

export const on = (event, callback) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);
  
  // Retorna função para remover listener
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
};
