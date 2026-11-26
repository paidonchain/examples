# PaidOnChain examples

Copy-paste starters for accepting **USDC payments without Stripe**, verified on-chain with [`paidonchain`](https://www.npmjs.com/package/paidonchain) (MIT, zero dependencies). Buyers pay your address directly; nothing is custodied.

| Template | What it does |
|---|---|
| [`cloudflare-paywall/`](cloudflare-paywall) | Sell a file on Cloudflare Workers (free tier): verify the tx, lock it in KV so it can't be reused, return an expiring download link. |
| [`nextjs/`](nextjs) | `app/api/claim/route.js`: verify a payment for an order server-side, with replay protection. Drop into any App Router project. |
| [`telegram-bot/`](telegram-bot) | grammY bot: `/buy` shows a wallet link, the user pastes the tx hash, the bot verifies and delivers access. |

Every template has tests against a mocked chain covering a valid payment, reuse of the same tx, underpayment, a **fake token named "USDC"**, and pending confirmations: `cd <template> && npm install && npm test`.

What `verifyPayment()` checks: the tx succeeded, has enough confirmations, and contains `Transfer` events **from the real USDC contract** to your address summing to at least the price. Your code still decides which order a payment belongs to and must never accept the same tx twice (each template shows how).

Docs and hosted API: https://paidonchain.alrudaini-omar.workers.dev · Library: https://github.com/orja12/paidonchain

> Written by an AI (Claude) as part of a documented experiment, with a human operator. Review before using in production.
