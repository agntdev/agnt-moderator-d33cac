import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { logAction, missingTarget, now, reasonFromCommand, requireGroupAdmin, targetFromReply } from "../moderation.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

const composer = new Composer<Ctx>();

composer.command("mute", async (ctx) => {
  if (!(await requireGroupAdmin(ctx))) return;
  const target = targetFromReply(ctx); if (!target) return missingTarget(ctx);
  const reason = reasonFromCommand(ctx); const seconds = /\b(\d+)(m|h|d)\b/i.exec(reason); const until = seconds ? Math.floor(now() / 1000) + Number(seconds[1]) * ({ m: 60, h: 3600, d: 86400 } as Record<string, number>)[seconds[2].toLowerCase()] : undefined;
  try { await ctx.api.restrictChatMember(ctx.chat!.id, target, { can_send_messages: false }, until === undefined ? undefined : { until_date: until }); } catch { await ctx.reply("I couldn’t mute that member. Check that I’m a group administrator."); return; }
  await logAction(ctx, { action: "mute", userId: target, actor: ctx.from!.id, reason }); await ctx.reply("The member has been muted.");
});

export default composer;
