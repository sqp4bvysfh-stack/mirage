import { createServer } from "node:http";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
} from "discord.js";

import type { Message } from "discord.js";
import type { Command } from "./types.js";

import { getConfig } from "./utils/serverConfig.js";
import { registerLogs } from "./utils/logs.js";

// ─── COMMANDS ─────────────────────────────────────────────
import { pingCommand } from "./commands/ping.js";
import { aideCommand, handleAideInteraction } from "./commands/aide.js";
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
import { iaCommand, repondreIA, shouldTriggerIA } from "./commands/ia.js";
import { iablockCommand } from "./commands/iablock.js";
import { isIaBlocked } from "./utils/iaBlock.js";
import { confessionCommand, handleConfessionInteraction } from "./commands/confession.js";
import { ticketCommand, handleTicketInteraction } from "./commands/ticket.js";
import { originesCommand, originesPanels } from "./commands/origines.js";
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
import { jailCommand, unjailCommand } from "./commands/jail.js";
import { photoCommand, handlePhotoSystem, getPhotoEmoji } from "./commands/photo.js";
import { blCommand, unblCommand } from "./commands/blacklist.js";
import { getBlacklistEntry } from "./utils/blacklist.js";
import { antiraidCommand } from "./commands/antiraid.js";
import { isAntiRaidEnabled } from "./utils/antiraid.js";
import { antispamCommand } from "./commands/antispam.js";
import { handleAntiSpam } from "./utils/antispam.js";
import { recrutementCommand } from "./commands/recrutement.js";
import {
  profilCommand,
  handleProfilReactionAdd,
  handleProfilReactionRemove,
} from "./commands/profil.js";
import {
  verificationCommand,
  handleVerificationJoin,
  handleVerificationInteraction,
} from "./commands/verification.js";

// ─── TOKEN ────────────────────────────────────────────────
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant");
  process.exit(1);
}

export const PREFIX = "*";
const MAIN_GUILD_ID = "1362520000426152036";

// ─── COLLECTIONS ─────────────────────────────────────────
const commands = new Collection<string, Command>();

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
  jailCommand,
  unjailCommand,
  photoCommand,
  blCommand,
  recrutementCommand,
  profilCommand,
  unblCommand,
  antiraidCommand,
  antispamCommand,
]) {
  commands.set(cmd.name, cmd);
}

console.log(
  "📦 Commandes chargées :",
  [...commands.keys()].join(", "),
);
console.log(
  "✅ Vérification enregistrée :",
  commands.has("verification"),
);

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

// ─── LOGS ────────────────────────────────────────────────
registerLogs(client);

// ─── READY ───────────────────────────────────────────────
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot en ligne : ${c.user.tag}`);

  for (const guild of c.guilds.cache.values()) {
    if (guild.id === MAIN_GUILD_ID) continue;

    console.log(`🚪 Serveur non autorisé quitté : ${guild.name}`);
    await guild.leave().catch((err) => {
      console.error(`Impossible de quitter ${guild.name}:`, err);
    });
  }
});

// ─── ANTI RAID ────────────────────────────────────────────
const RAID_THRESHOLD = 5;
const RAID_WINDOW_MS = 10_000;
const joinTracker    = new Map<string, { time: number; memberId: string }[]>();
const raidMode       = new Set<string>();

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.guild.id !== MAIN_GUILD_ID) return;

  await handleVerificationJoin(member);

  const blacklistEntry = getBlacklistEntry(member.id);
  if (blacklistEntry) {
    await member.ban({
      deleteMessageSeconds: 60 * 60 * 24,
      reason: `Reban automatique — blacklist : ${blacklistEntry.reason}`,
    }).catch((error) => {
      console.error(`Impossible de reban ${member.user.tag} :`, error);
    });
    return;
  }

  if (!isAntiRaidEnabled()) return;

  const guildId = member.guild.id;
  const now     = Date.now();

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
          `🚨 **ALERTE RAID DÉTECTÉE** — ${recent.length} arrivées en ${RAID_WINDOW_MS / 1000}s.\n` +
          `Les comptes de moins de 7 jours ont été kick automatiquement.`
        ).catch(() => {});
      }
    }
    joinTracker.set(guildId, []);
  }
});

// ─── BLACKLIST — REBAN APRÈS UNBAN MANUEL ────────────────
client.on(Events.GuildBanRemove, async (ban) => {
  if (ban.guild.id !== MAIN_GUILD_ID) return;

  const entry = getBlacklistEntry(ban.user.id);
  if (!entry) return;

  await ban.guild.members.ban(ban.user.id, {
    deleteMessageSeconds: 60 * 60 * 24,
    reason: `Reban automatique — toujours blacklisté : ${entry.reason}`,
  }).catch((error) => {
    console.error(`Impossible de reban ${ban.user.tag} après unban manuel :`, error);
  });
});

// ─── WELCOME ─────────────────────────────────────────────
const DEFAULT_WELCOME_CHANNEL = "1523502660295069777";

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.guild.id !== MAIN_GUILD_ID) return;

  const welcomeChannelId = getConfig(member.guild.id).welcomeChannel ?? DEFAULT_WELCOME_CHANNEL;
  const salon = member.guild.channels.cache.get(welcomeChannelId);
  if (salon?.isTextBased()) salon.send(`👋 Bienvenue ${member}`).catch(() => {});
});

// ─── BOOST ───────────────────────────────────────────────
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (newMember.guild.id !== MAIN_GUILD_ID) return;

  try {
    await handleBoostMember(oldMember as import("discord.js").GuildMember, newMember);
  } catch (err) {
    console.error("Erreur boost:", err);
  }
});

// ─── INTERACTIONS ────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.guildId !== MAIN_GUILD_ID) return;

  try {
    await handleConfessionInteraction(interaction);
    await handleTicketInteraction(interaction);
    await handleAideInteraction(interaction);
    await handleBoostInteraction(interaction);
    await handleVerificationInteraction(interaction);
  } catch (err) {
    console.error("Erreur interaction:", err);
  }
});

// ─── ORIGINES — réaction ajoutée ─────────────────────────
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.guildId !== MAIN_GUILD_ID) return;

  await handleProfilReactionAdd(reaction, user);

  const config = originesPanels.get(reaction.message.id);
  if (!config) return;
  const cfg    = config.find(o => o.emoji === reaction.emoji.name);
  if (!cfg) return;
  const guild  = reaction.message.guild;
  const member = await guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;
  await member.roles.add(cfg.roleId).catch(() => {});
});

// ─── ORIGINES — réaction retirée ─────────────────────────
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.guildId !== MAIN_GUILD_ID) return;

  await handleProfilReactionRemove(reaction, user);
  const config = originesPanels.get(reaction.message.id);
  if (!config) return;
  const cfg    = config.find(o => o.emoji === reaction.emoji.name);
  if (!cfg) return;
  const guild  = reaction.message.guild;
  const member = await guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;
  await member.roles.remove(cfg.roleId).catch(() => {});
});

// ─── MESSAGES ────────────────────────────────────────────
const LIENS_AUTORISES       = new Set(["nci"]);
const INVITE_REGEX          = /discord(?:\.gg|(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)/gi;
const DEFAULT_ANTI_PUB_ROLE = "1476499085748862986";

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.guild || message.guild.id !== MAIN_GUILD_ID) return;

  incrementMessages(message.guild.id);

  // ── ANTI-SPAM ──────────────────────────────────────────────────────────
  if (await handleAntiSpam(message)) return;

  // ── PHOTO SYSTEM ─────────────────────────────────────────────────────────
  // Si le salon est configuré en mode photo, photo.ts gère seul
  // la suppression des messages sans média et la réaction automatique.
  if (getPhotoEmoji(message.channel.id)) {
    await handlePhotoSystem(message);
    return;
  }

  // ── ANTI LIEN ────────────────────────────────────────────────────────────
  const isModoAntiLink =
    message.member?.permissions.has("ManageMessages") ||
    message.member?.permissions.has("Administrator");

  if (!isModoAntiLink) {
    const liens = [...message.content.matchAll(INVITE_REGEX)];
    const hasLienInterdit = liens.some(m => !LIENS_AUTORISES.has(m[1].toLowerCase()));

    if (hasLienInterdit) {
      const antiPubRoleId = getConfig(message.guild?.id ?? "").antiPubRole ?? DEFAULT_ANTI_PUB_ROLE;
      await message.delete().catch(() => {});
      await message.channel.send(
        `🚫 ${message.author} **PUB INTERDITE SANS L'ACCORD DES** <@&${antiPubRoleId}>\n> Les liens vers d'autres serveurs sont interdits ici.`
      ).catch(() => {});

      const warnCmd = commands.get("warn");
      if (warnCmd && message.member) {
        const fakeArgs = [message.author.id, "Lien Discord non autorisé (pub interdite)"];
        const fakeMsg  = Object.create(message) as Message;
        (fakeMsg as any).content = `*warn ${fakeArgs.join(" ")}`;
        (fakeMsg as any).member  = message.guild?.members.me ?? message.member;
        await warnCmd.execute(fakeMsg, fakeArgs).catch(() => {});
      }
      return;
    }
  }

  // ── IA mention ───────────────────────────────────────────────────────────
  const ia = await shouldTriggerIA(message, client);
  if (ia.trigger) {
    if (message.guildId && isIaBlocked(message.guildId, message.channelId)) return;
    await message.channel.sendTyping();
    const reply = await repondreIA(
      ia.text,
      message.member?.permissions.has("ManageMessages") ?? false,
      message.channelId,
      message.guildId ?? undefined
    );
    await message.reply(reply);
    return;
  }

  // ── COMMANDES NORMALES * ─────────────────────────────────────────────────
  if (!message.content.startsWith(PREFIX)) return;

  const args        = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName);

  if (!command) {
    await message.reply(
      `❌ Commande inconnue : \`${PREFIX}${commandName}\`.`,
    ).catch(() => {});

    console.warn(
      `⚠️ Commande inconnue reçue : ${commandName}`,
    );
    return;
  }

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply("❌ erreur commande").catch(() => {});
  }
});

// ─── HTTP SERVER ──────────────────────────────────────────
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

createServer((req, res) => {
  const status = {
    status: client.isReady() ? "online" : "starting",
    bot:    client.user?.tag ?? null,
    guilds: client.guilds.cache.size,
    uptime: client.uptime ?? 0,
  };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(status));
}).listen(PORT, () => {
  console.log(`🌐 HTTP server listening on ${PORT}`);
});

// ─── LOGIN ───────────────────────────────────────────────
client.login(token);
