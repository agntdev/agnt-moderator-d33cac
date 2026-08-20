# GroupGuard Moderation Bot — Bot specification

**Archetype:** community

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

Automated group moderation bot that enforces anti-spam rules, verifies new members with challenges, and provides admin controls for warnings, mutes, and removals. Tracks infractions, maintains action logs, and sends periodic summaries to admins.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Telegram group admins
- Moderators

## Success criteria

- Automated verification of new members with configurable timeout
- Real-time spam detection with warn/mute/kick/ban actions
- Admin command interface for moderation actions
- Action log retention and periodic summary reports

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main admin menu for settings and logs
- **/help** (command, actor: user, command: /help) — Show available admin commands
- **/warn** (command, actor: admin, command: /warn) — Warn a user with optional reason
- **/mute** (command, actor: admin, command: /mute) — Mute a user with optional duration
- **/kick** (command, actor: admin, command: /kick) — Remove a user from the group
- **/ban** (command, actor: admin, command: /ban) — Permanently ban a user
- **/trust** (command, actor: admin, command: /trust) — Mark user as trusted (exempt from rules)
- **/log** (command, actor: admin, command: /log) — View recent moderation log entries

## Flows

### Join Verification
_Trigger:_ new_member_joined

1. Send welcome message with rules
2. Present verification challenge (emoji/math/reasoning)
3. Wait for correct answer within timeout
4. Verify or auto-remove user

_Data touched:_ Member, VerificationChallenge

### Spam Detection
_Trigger:_ message_posted

1. Check account age for link suspicion
2. Detect repeated messages
3. Monitor message flood rate
4. Apply configured action (warn/mute/kick)

_Data touched:_ InfractionRecord, Member

### Admin Command
_Trigger:_ /admin_command

1. Parse command and target user
2. Apply action (warn/mute/kick/ban)
3. Log action with timestamp and reason

_Data touched:_ InfractionRecord, Member

### Periodic Summary
_Trigger:_ daily/weekly_schedule

1. Aggregate join/verification/removal stats
2. Generate top offenders list
3. Send summary to admin chat

_Data touched:_ ActionLog, InfractionRecord

## Owner-supplied settings

The OWNER provides these; they are collected in chat and injected into the environment at deploy. Read each one from the environment where it is used (`ctx.env.<KEY>` / `env.<KEY>` on Cloudflare Workers; `process.env.<KEY>` only as a Node/harness fallback — never the sole read). Do NOT invent your own way of learning the value, do NOT ask for it in a bot message, and do NOT hardcode a default.

- **ADMIN_CHAT_ID** — Where auto-removals and daily summaries are sent
  - this is the OWNER's own chat id; the platform already knows it. Read `ADMIN_CHAT_ID` via `ctx.env` (prefer toolkit `adminChatId` / `requireOwner`) — never ask a user, never treat whoever writes first as the admin, never invent claim-admin or open manage for everyone.
  - may be UNSET at runtime: the bot must still start, and the feature needing ADMIN_CHAT_ID must say so plainly instead of failing.

Your behavioral specs run WITHOUT these values, so no spec may depend on one.

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

An entity that merely NAMES an owner-supplied setting above (an admin chat, an API account) is not something to store or discover — read it from the environment.

- **Member** _(retention: persistent)_ — Group participant with moderation status
  - fields: user_id, join_time, trusted_flag, verification_status
- **VerificationChallenge** _(retention: session)_ — Moderate-difficulty multiple-choice challenge
  - fields: challenge_type, options, correct_answer, timeout
- **InfractionRecord** _(retention: persistent)_ — Logged rule violation and action taken
  - fields: user_id, infraction_type, timestamp, actor, action_taken
- **AdminSettings** _(retention: persistent)_ — Configurable moderation parameters
  - fields: welcome_message, rules_text, thresholds, action_chain, trusted_users
- **ActionLog** _(retention: persistent)_ — Recent moderation actions with metadata
  - fields: action_type, user_id, timestamp, reason, actor

## Integrations

- **Telegram** (required) — Bot API messaging and group management
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /setwelcome
- /setrules
- /setthresholds
- /setactionchain
- /trust
- /untrust

## Notifications

- Real-time admin alerts for auto-removals
- Daily/weekly summary reports
- In-group verification prompts

## Permissions & privacy

- Only admin users can access moderation commands
- Verification challenges use private messaging
- Infraction records stored with user IDs

## Edge cases

- User fails verification multiple times
- Admin account violates rules
- Message flood during verification period

## Required tests

- End-to-end verification flow with timeout
- Spam detection with threshold triggers
- Admin command execution and logging

## Assumptions

- Default 3-minute verification timeout
- Emoji/math challenges as default verification type
- 48-hour account age threshold for links
