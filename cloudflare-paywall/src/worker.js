// Sell a digital file for USDC on Cloudflare Workers (free tier).
// Buyer pays PRICE_USDC to PAY_TO on Base or Arbitrum, then POSTs the tx hash to /claim.
// The Worker verifies the payment on-chain, locks the tx (no reuse) and returns an expiring download link.
import { verifyPayment } from "paidonchain";

const json = (o, status = 200) => Response.json(o, { status });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/claim") {
      let body;
      try { body = await req.json(); } catch { return json({ error: "JSON body required" }, 400); }
      const chain = body.chain === "arbitrum" ? "arbitrum" : "base";
      const tx = String(body.tx || "").toLowerCase();
      const lock = `tx:${chain}:${tx}`;
      if (await env.SALES.get(lock)) return json({ error: "This transaction was already used." }, 409);

      let r;
      try {
        r = await verifyPayment({ chain, tx, to: env.PAY_TO, minAmount: env.PRICE_USDC });
      } catch (e) {
        return json({ error: e.message, code: e.code }, e.code?.startsWith("RPC") ? 502 : 400);
      }
      if (!r.ok) return json(r, r.code === "PENDING" ? 202 : 402);

      const token = crypto.randomUUID();
      await env.SALES.put(lock, JSON.stringify({ from: r.from, paid: r.paid, at: Date.now() }));
      await env.SALES.put("dl:" + token, "1", { expirationTtl: 7 * 86400 });
      return json({ ok: true, download: `/download/${token}` });
    }

    const m = url.pathname.match(/^\/download\/([0-9a-f-]{36})$/);
    if (req.method === "GET" && m) {
      if (!(await env.SALES.get("dl:" + m[1]))) return new Response("Link invalid or expired", { status: 404 });
      return new Response(env.PRODUCT_TEXT || "Thanks for your purchase!", {
        headers: { "content-type": "text/plain", "content-disposition": 'attachment; filename="product.txt"' },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
