// Shared test helper: a fake JSON-RPC endpoint that returns a USDC Transfer receipt.
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const pad = a => "0x" + a.toLowerCase().slice(2).padStart(64, "0");
export function mockChain({ to, amountUnits, token = USDC_BASE, status = "0x1", block = 100, head = 110 }) {
  return async (_url, init) => {
    const { method } = JSON.parse(init.body);
    const result = method === "eth_blockNumber" ? "0x" + head.toString(16) : {
      status, blockNumber: "0x" + block.toString(16),
      logs: [{ address: token, topics: [TOPIC, pad("0x" + "ab".repeat(20)), pad(to)], data: "0x" + BigInt(amountUnits).toString(16) }],
    };
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { headers: { "content-type": "application/json" } });
  };
}
export const TX = "0x" + "1".repeat(64);
export const PAY_TO = "0x000000000000000000000000000000000000bEEF";
