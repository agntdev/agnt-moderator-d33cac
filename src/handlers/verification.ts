import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { member, now, notifyOwner, saveMember, settings } from "../moderation.js";

const composer = new Composer<Ctx>();
composer.on("message:new_chat_members", async (ctx) => {
  if (!ctx.chat || (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")) return;
  const config = await settings(ctx);
  for (const person of ctx.message.new_chat_members) {
    if (person.is_bot) continue;
    await saveMember(ctx, { userId: person.id, joinedAt: now(), trusted: false, verification: "pending" });
    await ctx.reply(`${config.welcome}\n${config.rules}\n\nTo verify, tap the answer: 7 + 5 =`, { reply_markup: inlineKeyboard([[inlineButton("11", `verify:${person.id}:11`), inlineButton("12", `verify:${person.id}:12`), inlineButton("13", `verify:${person.id}:13`)]]) });
  }
});
composer.on("callback_query:data", async (ctx, next) => {
  const match = /^verify:(\d+):(\d+)$/.exec(ctx.callbackQuery.data); if (!match) return next();
  await ctx.answerCallbackQuery(); const userId = Number(match[1]);
  if (ctx.from?.id !== userId) { await ctx.answerCallbackQuery({ text: "Only the new member can verify.", show_alert: true }); return; }
  const record = await member(ctx, userId); if (!record || record.verification !== "pending") { await ctx.reply("This verification has expired. Ask an administrator for help."); return; }
  if (match[2] === "12") { await saveMember(ctx, { ...record, verification: "verified" }); await ctx.editMessageText("Verification complete. You can now participate."); }
  else { await ctx.reply("That answer isn’t right. Try again before the verification window closes."); }
});
// Timeout is enforced when the member next interacts, avoiding unreliable process timers.
composer.on("message:text", async (ctx, next) => { const record = ctx.from ? await member(ctx, ctx.from.id) : undefined; if (record?.verification === "pending" && now() - record.joinedAt > 180000) { await saveMember(ctx, { ...record, verification: "removed" }); try { await ctx.api.banChatMember(ctx.chat!.id, record.userId); await ctx.api.unbanChatMember(ctx.chat!.id, record.userId); } catch { /* Bot needs group-admin rights; the alert still records the event. */ } await notifyOwner(ctx, "A member was removed after verification expired."); await ctx.reply("Your verification window expired. Ask an administrator to rejoin."); return; } return next(); });
export default composer;
