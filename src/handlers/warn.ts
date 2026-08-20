import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem } from "../toolkit/index.js";
import { logAction, missingTarget, reasonFromCommand, requireGroupAdmin, targetFromReply } from "../moderation.js";

// SCAFFOLD — generated from the bot blueprint BEFORE the agent runs.
// Keep a LIVE registration (.command / .callbackQuery / …) so this feature is
// never an empty stub. Replace the reply body with real logic + copy; if you
// change the user-facing text, update tests/specs to match EXACTLY.
// Do NOT rewrite src/bot.ts — buildBot() already auto-loads this module.

registerMainMenuItem({ label: "Warn a member", data: "guard:menu", order: 11 });
const composer = new Composer<Ctx>();

composer.command("warn", async (ctx) => {
  if (!(await requireGroupAdmin(ctx))) return;
  const target = targetFromReply(ctx); if (!target) return missingTarget(ctx);
  const reason = reasonFromCommand(ctx); await logAction(ctx, { action: "warn", userId: target, actor: ctx.from!.id, reason });
  await ctx.reply("The member has been warned.");
});

export default composer;
