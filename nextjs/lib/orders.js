// Replace this in-memory store with your database (Prisma, Drizzle, Supabase, ...).
// It must guarantee that one transaction hash can only ever pay one order.
const orders = new Map([["demo-1", { id: "demo-1", priceUsdc: "19", paid: false, txHash: null }]]);
const usedTx = new Set();

export const db = {
  getOrder: async id => orders.get(id) ?? null,
  isTxUsed: async tx => usedTx.has(tx),
  markPaid: async (id, tx, payer) => { usedTx.add(tx); Object.assign(orders.get(id), { paid: true, txHash: tx, payer }); },
};
