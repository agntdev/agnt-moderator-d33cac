import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { logAction, member, now, readData, settings, writeData } from "../moderation.js";

const composer = new Composer<Ctx>();
composer.on("message:text", async (ctx, next) => {
  if (!ctx.from || !ctx.chat || (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")) return next();
  const record = await member(ctx, ctx.from.id); if (record?.trusted) return next();
  try { const cm = await ctx.getChatMember(ctx.from.id); if (cm.status === "administrator" || cm.status === "creator") return next(); } catch { return next(); }
  const data = await readData(ctx); if (!data) return next();
  const config = await settings(ctx); data.messages ??= {};
  const prior = data.messages[String(ctx.from.id)]; const age = prior && now() - prior.at < 60000 ? prior : { text: "", at: now(), count: 0 };
  const repeated = age.text === ctx.message.text ? age.count + 1 : 1;
  data.messages[String(ctx.from.id)] = { text: ctx.message.text, at: now(), count: repeated };
  await writeData(ctx, data);
  const newMemberLink = Boolean(record && now() - record.joinedAt < 48 * 3600000 && /https?:\/\//i.test(ctx.message.text));
  if (repeated < config.repeatLimit && repeated < config.floodLimit && !newMemberLink) return next();
  const reason = newMemberLink ? "Link from a recently joined member" : repeated >= config.floodLimit ? "Message flood detected" : "Repeated message detected";
  if (config.action === "mute") { try { await ctx.api.restrictChatMember(ctx.chat.id, ctx.from.id, { can_send_messages: false }, { until_date: Math.floor(now() / 1000) + 3600 }); } catch { await ctx.reply("I detected spam but couldn’t mute the member. Check my admin permissions."); return; } }
  if (config.action === "kick") { try { await ctx.api.banChatMember(ctx.chat.id, ctx.from.id); await ctx.api.unbanChatMember(ctx.chat.id, ctx.from.id); } catch { await ctx.reply("I detected spam but couldn’t remove the member. Check my admin permissions."); return; } }
  await logAction(ctx, { action: config.action, userId: ctx.from.id, actor: 0, reason });
  await ctx.reply(config.action === "warn" ? "That message breaks this group’s spam rules. This is a warning." : config.action === "mute" ? "Spam detected. The member has been muted." : "Spam detected. The member has been removed.");
});
export default composer;
