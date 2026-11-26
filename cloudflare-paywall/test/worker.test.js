import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";
import { mockChain, TX, PAY_TO, USDC_BASE } from "../../mockchain.js";

const kv = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => void m.set(k, v) }; };
const env = () => ({ SALES: kv(), PAY_TO, PRICE_USDC: "19" });
const claim = (e, tx = TX) => worker.fetch(new Request("https://x/claim", { method: "POST", body: JSON.stringify({ tx }) }), e);

test("valid payment -> download link that works", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 19_000_000 });
  const e = env(); const r = await claim(e); const j = await r.json();
  assert.equal(r.status, 200); assert.ok(j.download);
  const dl = await worker.fetch(new Request("https://x" + j.download), e);
  assert.equal(dl.status, 200);
});
test("same tx twice -> 409", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 19_000_000 });
  const e = env(); await claim(e); assert.equal((await claim(e)).status, 409);
});
test("underpaid -> 402", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 5_000_000 });
  const r = await claim(env()); assert.equal(r.status, 402); assert.equal((await r.json()).code, "UNDERPAID");
});
test("fake token named USDC -> 402", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 19_000_000, token: "0x" + "9".repeat(40) });
  assert.equal((await claim(env())).status, 402);
});
test("bad download token -> 404", async () => {
  assert.equal((await worker.fetch(new Request("https://x/download/00000000-0000-0000-0000-000000000000"), env())).status, 404);
});
