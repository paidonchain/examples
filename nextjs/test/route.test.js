import { test } from "node:test";
import assert from "node:assert/strict";
import { mockChain, TX, PAY_TO } from "../../mockchain.js";
process.env.PAY_TO = PAY_TO;
const { POST } = await import("../app/api/claim/route.js");
const req = b => new Request("https://x/api/claim", { method: "POST", body: JSON.stringify(b) });

test("unknown order -> 404", async () => { assert.equal((await POST(req({ orderId: "nope", tx: TX }))).status, 404); });
test("underpaid -> 402, order stays unpaid", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 1_000_000 });
  assert.equal((await POST(req({ orderId: "demo-1", tx: "0x" + "2".repeat(64) }))).status, 402);
});
test("paid -> 200, then replay -> 409", async () => {
  globalThis.fetch = mockChain({ to: PAY_TO, amountUnits: 19_000_000 });
  assert.equal((await POST(req({ orderId: "demo-1", tx: TX }))).status, 200);
  assert.equal((await POST(req({ orderId: "demo-1", tx: TX }))).status, 409);
});
