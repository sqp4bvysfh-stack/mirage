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

// ─── PHOTO SYSTEM (SAFE) ─────────────────────────────────
import { photoCommand } from "./commands/photo.js";

// ─── ÉCONOMIE ─────────────────────────────────────────────
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

// ─── PHOTO STATE ──────────────────────────────────────────
const photoChannels = new Map<string, string>();
const photoSetup = new Map<string, { step: "channel" | "emoji"; channelId?: string }>();

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
]) ecoCommands.set(cmd.name, cmd);

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
  photoCommand,
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
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot en ligne : ${c.user.tag}`);
});

// ─── MESSAGE CREATE (UNIQUE CLEAN) ───────────────────────
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  if (message.guild) incrementMessages(message.guild.id);

  // ── PHOTO SYSTEM (SAFE INLINE) ─────────────────────────
  const setup = photoSetup.get(message.author.id);

  if (setup) {
    if (setup.step === "channel") {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("❌ Mentionne un salon valide.");

      photoSetup.set(message.author.id, {
        step: "emoji",
        channelId: channel.id,
      });

      return message.reply("😀 Quel emoji pour les réactions ?");
    }

    if (setup.step === "emoji") {
      const emoji = message.content.trim();
      if (!setup.channelId) return;

      photoChannels.set(setup.channelId, emoji);
      photoSetup.delete(message.author.id);

      return message.reply(`✅ Salon photo configuré avec ${emoji}`);
    }
  }

  const emoji = photoChannels.get(message.channel.id);

  if (emoji) {
    const hasMedia = message.attachments.some(att =>
      (att.contentType || "").startsWith("image/") ||
      (att.contentType || "").startsWith("video/")
    );

    if (!hasMedia) return message.delete().catch(() => {});
    await message.react(emoji).catch(() => {});
  }

  // ── COMMANDES ──────────────────────────────────────────
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const name = args.shift()?.toLowerCase();
  if (!name) return;

  const cmd = commands.get(name);
  if (!cmd) return;

  try {
    await cmd.execute(message, args);
  } catch (e) {
    console.error(e);
    message.reply("❌ erreur commande").catch(() => {});
  }
});

// ─── LOGIN ───────────────────────────────────────────────
client.login(token);