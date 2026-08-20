import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { logAction, missingTarget, reasonFromCommand, requireGroupAdmin, targetFromReply } from "../moderation.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

const composer = new Composer<Ctx>();

composer.command("kick", async (ctx) => {
  if (!(await requireGroupAdmin(ctx))) return;
  const target = targetFromReply(ctx); if (!target) return missingTarget(ctx);
  try { await ctx.api.banChatMember(ctx.chat!.id, target); await ctx.api.unbanChatMember(ctx.chat!.id, target); } catch { await ctx.reply("I couldn’t remove that member. Check that I’m a group administrator."); return; }
  await logAction(ctx, { action: "kick", userId: target, actor: ctx.from!.id, reason: reasonFromCommand(ctx) }); await ctx.reply("The member has been removed.");
});

export default composer;
