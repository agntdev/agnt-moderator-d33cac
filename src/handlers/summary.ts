import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { adminChatId, requireOwner } from "../toolkit/index.js";
import { readData } from "../moderation.js";

const composer = new Composer<Ctx>();
async function summary(ctx: Ctx) {
  if (!(await requireOwner(ctx))) return;
  const owner = adminChatId(ctx as Ctx & { env?: Record<string, unknown> }); if (!owner) { await ctx.reply("Owner summaries aren’t set up yet."); return; }
  const data = await readData(ctx); const members = Object.values(data?.members ?? {}); const logs = data?.logs ?? [];
  const removed = members.filter((m) => m.verification === "removed").length; const verified = members.filter((m) => m.verification === "verified").length;
  const top = logs.reduce<Record<string, number>>((all, item) => { all[String(item.userId)] = (all[String(item.userId)] ?? 0) + 1; return all; }, {});
  const offender = Object.values(top).sort((a, b) => b - a)[0] ?? 0;
  const text = `Moderation summary:\nVerified members: ${verified}\nVerification removals: ${removed}\nActions logged: ${logs.length}\nTop offender actions: ${offender}`;
  try { await ctx.api.sendMessage(owner, text); } catch { await ctx.reply("I couldn’t send the summary to the owner chat."); return; }
  await ctx.reply("The moderation summary has been sent to the owner.");
}
composer.callbackQuery("guard:summary", async (ctx) => { await ctx.answerCallbackQuery(); await summary(ctx); });
export default composer;
