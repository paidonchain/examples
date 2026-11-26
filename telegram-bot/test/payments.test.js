import { test } from "node:test";
import assert from "node:assert/strict";
import { handleTxHash, quote } from "../payments.js";
import { mockChain, TX, PAY_TO } from "../../mockchain.js";
const store = () => { const s = new Set(); return { isUsed: async t => s.has(t), markUsed: async t => void s.add(t) }; };

test("quote contains address and an EIP-681 link", () => { const q = quote({ payTo: PAY_TO, price: "10" }); assert.match(q, /ethereum:0x8335/); assert.ok(q.includes(PAY_TO)); });
test("not a hash", async () => { assert.equal((await handleTxHash("hello", { payTo: PAY_TO, price: "10", store: store() })).ok, false); });
test("paid once, rejected on reuse", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 10_000_000 }); const s = store();
  assert.equal((await handleTxHash(TX, { payTo: PAY_TO, price: "10", store: s })).ok, true);
  assert.match((await handleTxHash(TX, { payTo: PAY_TO, price: "10", store: s })).reply, /already used/);
});
test("pending -> retry message", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 10_000_000, block: 110, head: 110 });
  assert.match((await handleTxHash(TX, { payTo: PAY_TO, price: "10", store: store() })).reply, /Almost there/);
});
