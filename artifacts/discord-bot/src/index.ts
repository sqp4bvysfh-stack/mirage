import { createServer } from "node:http";
import { Client, GatewayIntentBits, Partials, Collection, Events } from "discord.js";
import type { Message } from "discord.js";
import type { Command } from "./types.js";
import { getConfig } from "./utils/serverConfig.js";
import { registerLogs } from "./utils/logs.js";

// ─── COMMANDS ─────────────────────────────────────────────
import { pingCommand } from "./commands/ping.js";
import { aideCommand } from "./commands/aide.js";
import { infoCommand } from "./commands/info.js";
import { loupgarouCommand, finpartieCommand } from "./commands/loupgarou.js";
import { rolesCommand } from "./commands/roles.js";
import { roleaddCommand } from "./commands/roleadd.js";
import { roleremoveCommand } from "./commands/roleremove.js";
import { sayCommand } from "./commands/say.js";
import { banCommand } from "./commands/ban.js";
import { tempbanCommand } from "./commands/tempban.js";
import { muteCommand } from "./commands/mute.js";
import { kickCommand } from "./commands/kick.js";
import { warnCommand } from "./commands/warn.js";
import { quizCommand } from "./commands/quiz.js";
import { undercoverCommand } from "./commands/undercover.js";
import { telephoneCommand } from "./commands/telephone.js";
import { twerkCommand } from "./commands/twerk.js";
import { sendCommand } from "./commands/send.js";
import { unmuteCommand } from "./commands/unmute.js";
import { unbanCommand } from "./commands/unban.js";
import { iaCommand, repondreIA } from "./commands/ia.js";
import { iablockCommand } from "./commands/iablock.js";
import { isIaBlocked } from "./utils/iaBlock.js";
import { confessionCommand, handleConfessionInteraction } from "./commands/confession.js";
import { ticketCommand, handleTicketInteraction } from "./commands/ticket.js";
import { originesCommand, originesPanels } from "./commands/origines.js";
import { handleAideInteraction } from "./commands/aide.js";
import { clearCommand } from "./commands/clear.js";
import { lockCommand, unlockCommand } from "./commands/lock.js";
import { giveawayCommand, rerollCommand, topGiveawayCommand } from "./commands/giveaway.js";
import { pollCommand } from "./commands/poll.js";
import { boostSetupCommand, handleBoostMember, handleBoostInteraction } from "./commands/boost.js";
import { talkCommand } from "./commands/talk.js";
import { fermetureCommand, ouvertureCommand } from "./commands/fermeture.js";
import { configCommand } from "./commands/config.js";
import { massbanCommand, delsalonCommand, broadcastCommand, masskickCommand, parleCommand } from "./commands/owner.js";
import { userinfoCommand } from "./commands/userinfo.js";
import { statsCommand, incrementMessages } from "./commands/stats.js";
import { dmCommand } from "./commands/dm.js";
import { serverprofileCommand } from "./commands/serverprofile.js";
import { botprofilCommand } from "./commands/botprofil.js";

// ─── PHOTO SYSTEM ─────────────────────────────────────────
import { photoCommand, registerPhotoSystem } from "./commands/photo.js";

// ─── ÉCONOMIE (&) ─────────────────────────────────────────
import {
  soldeCommand, dailyCommand, workCommand, payCommand,
  depCommand, depositCommand, withCommand, withdrawCommand,
  repCommand, metierCommand, topCommand, ecoHelpCommand,
} from "./commands/economy.js";
import { braquerCommand, cambriolerCommand, casserCommand, jugerCommand, robCommand } from "./commands/jobs.js";
import { teamCommand } from "./commands/team.js";
import { livretCommand } from "./commands/livret.js";
import { tycoonCommand } from "./commands/tycoon.js";
import { cryptoCommand } from "./commands/crypto.js";
import { rouletteCommand, blackjackCommand, bjCommand } from "./commands/casino.js";
import { shopCommand } from "./commands/shop.js";
import { ecoconfigCommand } from "./commands/ecoconfig.js";
import { coinsetupCommand, getCoinSetup } from "./commands/coinsetup.js";

// ─── TOKEN ────────────────────────────────────────────────
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant");
  process.exit(1);
}

export const PREFIX = "*";
export const ECO_PREFIX = "&";

// ─── COMMAND COLLECTION ───────────────────────────────────
const commands = new Collection<string, Command>();
const ecoCommands = new Collection<string, Command>();

for (const cmd of [
  soldeCommand, dailyCommand, workCommand, payCommand,
  depCommand, depositCommand, withCommand, withdrawCommand,
  repCommand, metierCommand, topCommand, ecoHelpCommand,
  braquerCommand, cambriolerCommand, casserCommand, jugerCommand, robCommand,
  teamCommand, livretCommand, tycoonCommand, cryptoCommand,
  rouletteCommand, blackjackCommand, bjCommand, shopCommand,
  ecoconfigCommand, coinsetupCommand,
]) {
  ecoCommands.set(cmd.name, cmd);
}

for (const cmd of [
  pingCommand,
  aideCommand,
  infoCommand,
  loupgarouCommand,
  finpartieCommand,
  rolesCommand,
  roleaddCommand,
  roleremoveCommand,
  sayCommand,
  banCommand,
  tempbanCommand,
  muteCommand,
  kickCommand,
  warnCommand,
  quizCommand,
  undercoverCommand,
  telephoneCommand,
  twerkCommand,
  sendCommand,
  unmuteCommand,
  unbanCommand,
  iaCommand,
  iablockCommand,
  confessionCommand,
  clearCommand,
  lockCommand,
  unlockCommand,
  giveawayCommand,
  rerollCommand,
  topGiveawayCommand,
  pollCommand,
  ticketCommand,
  originesCommand,
  boostSetupCommand,
  talkCommand,
  fermetureCommand,
  ouvertureCommand,
  configCommand,
  massbanCommand,
  delsalonCommand,
  broadcastCommand,
  masskickCommand,
  parleCommand,
  userinfoCommand,
  statsCommand,
  dmCommand,
  serverprofileCommand,
  botprofilCommand,
  photoCommand, // ✅ AJOUT PHOTO
]) {
  commands.set(cmd.name, cmd);
}

// ─── CLIENT ───────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
});

// ─── PHOTO SYSTEM INIT ────────────────────────────────────
registerPhotoSystem(client);

// ─── ANTI RAID ────────────────────────────────────────────
const RAID_THRESHOLD = 5;
const RAID_WINDOW_MS = 10_000;
const joinTracker = new Map<string, { time: number; memberId: string }[]>();
const raidMode = new Set<string>();

client.on(Events.GuildMemberAdd, async (member) => {
  const guildId = member.guild.id;
  const now = Date.now();

  const recent = (joinTracker.get(guildId) ?? []).filter(e => now - e.time < RAID_WINDOW_MS);
  recent.push({ time: now, memberId: member.id });
  joinTracker.set(guildId, recent);

  if (recent.length >= RAID_THRESHOLD) {
    for (const { memberId } of recent) {
      const m = await member.guild.members.fetch(memberId).catch(() => null);
      if (!m) continue;
      const ageDays = (now - m.user.createdTimestamp) / 86_400_000;
      if (ageDays < 7) await m.kick("Anti-raid : compte récent").catch(() => {});
    }

    if (!raidMode.has(guildId)) {
      raidMode.add(guildId);
      setTimeout(() => raidMode.delete(guildId), 30_000);

      const alert = member.guild.systemChannel ?? member.guild.channels.cache.find(c => c.isTextBased());
      if (alert?.isTextBased()) {
        alert.send(
          `🚨 **ALERTE RAID DÉTECTÉE** — ${recent.length} arrivées en ${RAID_WINDOW_MS / 1000}s.`
        ).catch(() => {});
      }
    }

    joinTracker.set(guildId, []);
  }
});

// ─── WELCOME ─────────────────────────────────────────────
const DEFAULT_WELCOME_CHANNEL = "1476532494768672850";

client.on(Events.GuildMemberAdd, async (member) => {
  const welcomeChannelId = getConfig(member.guild.id).welcomeChannel ?? DEFAULT_WELCOME_CHANNEL;
  const salon = member.guild.channels.cache.get(welcomeChannelId);
  if (salon?.isTextBased()) salon.send(`👋 Bienvenue ${member}`).catch(() => {});
});

// ─── HTTP SERVER ──────────────────────────────────────────
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

createServer((req, res) => {
  const status = {
    status: client.isReady() ? "online" : "starting",
    bot: client.user?.tag ?? null,
    guilds: client.guilds.cache.size,
    uptime: client.uptime ?? 0,
  };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(status));
}).listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// ─── LOGS ────────────────────────────────────────────────
registerLogs(client);

// ─── READY ───────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot en ligne : ${c.user.tag}`);
});

// ─── INTERACTIONS ────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await handleConfessionInteraction(interaction);
    await handleTicketInteraction(interaction);
    await handleAideInteraction(interaction);
    await handleBoostInteraction(interaction);
  } catch (err) {
    console.error("Erreur interaction:", err);
  }
});

// ─── BOOST ───────────────────────────────────────────────
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  try {
    await handleBoostMember(oldMember as any, newMember);
  } catch (err) {
    console.error("Erreur boost:", err);
  }
});

// ─── ORIGINES ────────────────────────────────────────────
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  const guildId = reaction.message.guildId;
  if (guildId && reaction.emoji.name === "✅") {
    const setup = getCoinSetup(guildId);
    if (setup && reaction.message.id === setup.messageId) {
      const guild = reaction.message.guild ?? await client.guilds.fetch(guildId).catch(() => null);
      const member = await guild?.members.fetch(user.id).catch(() => null);
      if (member) await member.roles.add(setup.roleId).catch(() => {});
    }
  }

  const config = originesPanels.get(reaction.message.id);
  if (!config) return;
  const cfg = config.find(o => o.emoji === reaction.emoji.name);
  if (!cfg) return;
  const guild = reaction.message.guild;
  const member = await guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;
  await member.roles.add(cfg.roleId).catch(() => {});
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;

  const config = originesPanels.get(reaction.message.id);
  if (!config) return;
  const cfg = config.find(o => o.emoji === reaction.emoji.name);
  if (!cfg) return;

  const guild = reaction.message.guild;
  const member = await guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await member.roles.remove(cfg.roleId).catch(() => {});
});

// ─── MESSAGE CREATE ──────────────────────────────────────
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  if (message.guild) incrementMessages(message.guild.id);

  // anti-link + IA + commands
  // ...

});

// ─── LOGIN ───────────────────────────────────────────────
client.login(token);