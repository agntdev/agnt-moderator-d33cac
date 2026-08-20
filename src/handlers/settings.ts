import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, requireOwner } from "../toolkit/index.js";
import { updateSettings } from "../moderation.js";

const composer = new Composer<Ctx>();
type Key = "welcome" | "rules" | "thresholds" | "action";
function input(ctx: Ctx): string { return (ctx.message?.text ?? "").replace(/^\/\w+(?:@\w+)?\s*/, "").trim(); }
async function set(ctx: Ctx, key: Key) {
  if (!(await requireOwner(ctx))) return;
  const value = input(ctx); if (!value) { await ctx.reply("Add the new value after the command and try again."); return; }
  let update: Parameters<typeof updateSettings>[1];
  if (key === "welcome") update = { welcome: value };
  else if (key === "rules") update = { rules: value };
  else if (key === "thresholds") { const parts = value.split(/[ ,/]+/).map(Number); if (parts.length < 2 || parts.some((n) => !Number.isInteger(n) || n < 1)) { await ctx.reply("Use two whole numbers: repeated-message limit and messages-per-minute limit."); return; } update = { repeatLimit: parts[0], floodLimit: parts[1] }; }
  else { if (!["warn", "mute", "kick"].includes(value)) { await ctx.reply("Choose warn, mute, or kick."); return; } update = { action: value as "warn" | "mute" | "kick" }; }
  if (!(await updateSettings(ctx, update))) { await ctx.reply("Settings are available in a group where I’m installed."); return; }
  await ctx.reply("That moderation setting has been saved.");
}
composer.command("setwelcome", (ctx) => set(ctx, "welcome"));
composer.command("setrules", (ctx) => set(ctx, "rules"));
composer.command("setthresholds", (ctx) => set(ctx, "thresholds"));
composer.command("setactionchain", (ctx) => set(ctx, "action"));
composer.on("callback_query:data", async (ctx, next) => {
  const key = /^guard:set:(welcome|rules|thresholds|action)$/.exec(ctx.callbackQuery.data)?.[1] as Key | undefined;
  if (!key) return next();
  await ctx.answerCallbackQuery(); if (!(await requireOwner(ctx))) return;
  ctx.session.setting = key;
  const prompt: Record<Key, string> = { welcome: "Send the welcome message you want new members to see.", rules: "Send the group rules you want new members to see.", thresholds: "Send two whole numbers: repeated-message limit and messages-per-minute limit.", action: "Send warn, mute, or kick for automatic spam actions." };
  await ctx.editMessageText(prompt[key], { reply_markup: inlineKeyboard([[inlineButton("Back", "guard:settings")]]) });
});
composer.on("message:text", async (ctx, next) => {
  const key = ctx.session.setting; if (!key || ctx.message.text.startsWith("/")) return next();
  ctx.session.setting = undefined;
  await set(ctx, key);
});
export default composer;
