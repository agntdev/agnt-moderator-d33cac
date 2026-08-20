import type { Ctx } from "./bot.js";
import { now, setClockForTests } from "./toolkit/clock.js";

export type Action = "warn" | "mute" | "kick" | "ban" | "trust" | "untrust" | "auto-remove";
export interface Settings {
  welcome: string;
  rules: string;
  repeatLimit: number;
  floodLimit: number;
  action: "warn" | "mute" | "kick";
}
export interface LogEntry { action: Action; userId: number; actor: number; reason: string; at: number }
export interface Member { userId: number; joinedAt: number; trusted: boolean; verification: "pending" | "verified" | "removed" }

const defaults: Settings = {
  welcome: "Welcome. Complete verification to participate.",
  rules: "No spam, repeated messages, or unsolicited links.",
  repeatLimit: 3,
  floodLimit: 6,
  action: "mute",
};

export { now, setClockForTests };

type Data = { settings?: Settings; members?: Record<string, Member>; logs?: LogEntry[]; messages?: Record<string, { text: string; at: number; count: number }> };
type Env = { CHAT_DO?: { idFromName(name: string): unknown; get(id: unknown): { fetch(input: string, init?: { method?: string; body?: string }): Promise<Response> } } };

function envOf(ctx: Ctx): Env | undefined { return (ctx as Ctx & { env?: Env }).env; }
function groupKey(ctx: Ctx): string | undefined {
  if (!ctx.chat || (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")) return undefined;
  return String(ctx.chat.id);
}

async function request(ctx: Ctx, method: string, body?: unknown): Promise<Data | undefined> {
  const env = envOf(ctx); const group = groupKey(ctx);
  if (!env?.CHAT_DO || !group) return undefined;
  const stub = env.CHAT_DO.get(env.CHAT_DO.idFromName("chat:" + group));
  const response = await stub.fetch(`https://do/moderation?chat=${encodeURIComponent(group)}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) return undefined;
  return (await response.json()) as Data;
}
export async function readData(ctx: Ctx): Promise<Data | undefined> { return request(ctx, "GET"); }
export async function writeData(ctx: Ctx, data: Data): Promise<boolean> { return (await request(ctx, "PUT", data)) !== undefined; }
export async function settings(ctx: Ctx): Promise<Settings> { return (await readData(ctx))?.settings ?? defaults; }
export async function updateSettings(ctx: Ctx, update: Partial<Settings>): Promise<boolean> {
  const data = await readData(ctx); if (!data) return false;
  data.settings = { ...(data.settings ?? defaults), ...update }; return writeData(ctx, data);
}
export async function saveMember(ctx: Ctx, member: Member): Promise<boolean> {
  const data = await readData(ctx); if (!data) return false;
  data.members ??= {}; data.members[String(member.userId)] = member; return writeData(ctx, data);
}
export async function member(ctx: Ctx, userId: number): Promise<Member | undefined> { return (await readData(ctx))?.members?.[String(userId)]; }
export async function logAction(ctx: Ctx, entry: Omit<LogEntry, "at">): Promise<boolean> {
  const data = await readData(ctx); if (!data) return false;
  data.logs ??= []; data.logs.unshift({ ...entry, at: now() }); data.logs = data.logs.slice(0, 200); return writeData(ctx, data);
}
export function targetFromReply(ctx: Ctx): number | undefined { return ctx.message?.reply_to_message?.from?.id; }
export function reasonFromCommand(ctx: Ctx): string {
  const text = ctx.message?.text ?? ""; return text.replace(/^\/\w+(?:@\w+)?\s*/, "").trim() || "No reason provided";
}
export async function requireGroupAdmin(ctx: Ctx): Promise<boolean> {
  if (!ctx.from || !groupKey(ctx)) { await ctx.reply("Use this in the group as an administrator."); return false; }
  try {
    const cm = await ctx.getChatMember(ctx.from.id);
    if (cm.status === "administrator" || cm.status === "creator") return true;
  } catch { /* Telegram may withhold this while the bot is not an admin. */ }
  await ctx.reply("Only group administrators can do that."); return false;
}
export function missingTarget(ctx: Ctx): Promise<unknown> { return ctx.reply("Reply to the member you want to moderate, then send this command."); }
export async function notifyOwner(ctx: Ctx, text: string): Promise<void> {
  const { adminChatId } = await import("./toolkit/index.js"); const owner = adminChatId(ctx as Ctx & { env?: Record<string, unknown> });
  if (!owner) return;
  try { await ctx.api.sendMessage(owner, text); } catch { /* Owner may have blocked the bot; moderation still continues. */ }
}
