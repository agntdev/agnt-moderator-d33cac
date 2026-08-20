import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { member, missingTarget, saveMember, targetFromReply, requireGroupAdmin, logAction } from "../moderation.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

const composer = new Composer<Ctx>();

composer.command("trust", async (ctx) => {
  if (!(await requireGroupAdmin(ctx))) return;
  const target = targetFromReply(ctx); if (!target) return missingTarget(ctx);
  const current = await member(ctx, target); if (!current) { await ctx.reply("I couldn’t find that member’s record yet."); return; }
  await saveMember(ctx, { ...current, trusted: true }); await logAction(ctx, { action: "trust", userId: target, actor: ctx.from!.id, reason: "Trusted by administrator" }); await ctx.reply("The member is now trusted.");
});
composer.command("untrust", async (ctx) => {
  if (!(await requireGroupAdmin(ctx))) return;
  const target = targetFromReply(ctx); if (!target) return missingTarget(ctx);
  const current = await member(ctx, target); if (!current) { await ctx.reply("I couldn’t find that member’s record yet."); return; }
  await saveMember(ctx, { ...current, trusted: false }); await logAction(ctx, { action: "untrust", userId: target, actor: ctx.from!.id, reason: "Trust removed by administrator" }); await ctx.reply("The member is no longer trusted.");
});

export default composer;
