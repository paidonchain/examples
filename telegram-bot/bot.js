// Minimal grammY bot selling access for USDC. Env: BOT_TOKEN, PAY_TO, PRICE_USDC, INVITE_LINK.
import { Bot } from "grammy";
import { quote, handleTxHash } from "./payments.js";

const { BOT_TOKEN, PAY_TO, PRICE_USDC = "10", INVITE_LINK } = process.env;
const used = new Map(); // replace with a database: an in-memory Map is lost on restart
const store = { isUsed: async tx => used.has(tx), markUsed: async (tx, info) => void used.set(tx, info) };

const bot = new Bot(BOT_TOKEN);
bot.command("buy", ctx => ctx.reply(quote({ payTo: PAY_TO, price: PRICE_USDC })));
bot.on("message:text", async ctx => {
  const r = await handleTxHash(ctx.message.text, { payTo: PAY_TO, price: PRICE_USDC, store });
  await ctx.reply(r.ok ? `${r.reply} Here's your access: ${INVITE_LINK}` : r.reply);
});
bot.start();
