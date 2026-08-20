import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem, requireOwner } from "../toolkit/index.js";

registerMainMenuItem({ label: "🛡 Moderation", data: "guard:menu", order: 10 });
const composer = new Composer<Ctx>();
const menu = inlineKeyboard([[inlineButton("View action log", "guard:log")], [inlineButton("Send summary", "guard:summary")], [inlineButton("Manage settings", "guard:settings")], [inlineButton("Back to menu", "menu:main")]]);
composer.callbackQuery("guard:menu", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Manage your group’s verification, spam rules, and action log.", { reply_markup: menu }); });
composer.callbackQuery("guard:settings", async (ctx) => { await ctx.answerCallbackQuery(); if (!(await requireOwner(ctx))) return; await ctx.editMessageText("Choose a setting to update.", { reply_markup: inlineKeyboard([[inlineButton("Welcome message", "guard:set:welcome")], [inlineButton("Rules", "guard:set:rules")], [inlineButton("Thresholds", "guard:set:thresholds")], [inlineButton("Action chain", "guard:set:action")], [inlineButton("Back", "guard:menu")]]) }); });
export default composer;
