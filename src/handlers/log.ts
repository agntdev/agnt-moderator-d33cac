import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, requireOwner } from "../toolkit/index.js";
import { readData } from "../moderation.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

const composer = new Composer<Ctx>();

async function show(ctx: Ctx, edit = false) {
  if (!(await requireOwner(ctx))) return;
  const logs = (await readData(ctx))?.logs ?? [];
  const text = logs.length === 0 ? "No moderation actions yet — actions will appear here." : "Recent moderation actions:\n" + logs.slice(0, 8).map((x) => `• ${x.action} — ${x.reason}`).join("\n");
  const markup = inlineKeyboard([[inlineButton("Back to menu", "menu:main")]]);
  if (edit && ctx.callbackQuery) await ctx.editMessageText(text, { reply_markup: markup }); else await ctx.reply(text, { reply_markup: markup });
}
composer.command("log", async (ctx) => { await show(ctx); });
composer.callbackQuery("guard:log", async (ctx) => { await ctx.answerCallbackQuery(); await show(ctx, true); });

export default composer;
