// app/api/claim/route.js: POST { orderId, tx } after the buyer paid in USDC on Base.
import { verifyPayment } from "paidonchain";
import { db } from "../../../lib/orders.js";

const PAY_TO = process.env.PAY_TO; // your receiving address

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "JSON body required" }, { status: 400 }); }
  const { orderId } = body;
  const tx = String(body.tx || "").toLowerCase();

  const order = await db.getOrder(orderId);
  if (!order) return Response.json({ error: "unknown order" }, { status: 404 });
  if (order.paid) return Response.json({ error: "order already paid" }, { status: 409 });
  if (await db.isTxUsed(tx)) return Response.json({ error: "transaction already used" }, { status: 409 });

  let r;
  try {
    r = await verifyPayment({ chain: "base", tx, to: PAY_TO, minAmount: order.priceUsdc });
  } catch (e) {
    return Response.json({ error: e.message, code: e.code }, { status: e.code?.startsWith("RPC") ? 502 : 400 });
  }
  if (!r.ok) return Response.json(r, { status: r.code === "PENDING" ? 202 : 402 });

  await db.markPaid(orderId, tx, r.from);
  return Response.json({ ok: true, paid: r.paid });
}
