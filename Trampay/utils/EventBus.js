const listeners = {};

export function on(event, handler) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(handler);
  return () => off(event, handler);
}

export function off(event, handler) {
  if (listeners[event]) listeners[event].delete(handler);
}

export function emit(event, payload) {
  if (!listeners[event]) return;
  for (const fn of Array.from(listeners[event])) {
    try { fn(payload); } catch {}
  }
}

export const Events = {
  BalanceUpdated: 'balanceUpdated',
  TransactionsUpdated: 'transactionsUpdated'
};
