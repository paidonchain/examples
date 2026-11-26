// Pure payment logic, kept separate from the bot so it can be tested without Telegram.
import { verifyPayment, paymentURI } from "paidonchain";

export function quote({ payTo, price }) {
  return `Send ${price} USDC on Base to:\n${payTo}\n\nWallet link: ${paymentURI({ to: payTo, amount: price })}\n\nThen paste your transaction hash here.`;
}

// store: { isUsed(tx), markUsed(tx, info) }. Use a real database in production.
export async function handleTxHash(text, { payTo, price, store }) {
  const tx = text.trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(tx)) return { ok: false, reply: "That doesn't look like a transaction hash." };
  if (await store.isUsed(tx)) return { ok: false, reply: "That transaction was already used." };
  let r;
  try { r = await verifyPayment({ chain: "base", tx, to: payTo, minAmount: price }); }
  catch { return { ok: false, reply: "Couldn't reach the network. Please try again in a minute." }; }
  if (r.code === "PENDING") return { ok: false, reply: "Almost there. Send the hash again in ~10 seconds." };
  if (!r.ok) return { ok: false, reply: "Payment not verified: " + r.reason };
  await store.markUsed(tx, { from: r.from, paid: r.paid });
  return { ok: true, reply: "Paid ✓" };
}
