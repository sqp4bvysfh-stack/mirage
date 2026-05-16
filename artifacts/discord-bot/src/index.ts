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

import {
  iaCommand,
  repondreIA,
  shouldTriggerIA,
} from "./commands/ia.js";

import { iablockCommand } from "./commands/iablock.js";
import { isIaBlocked } from "./utils/iaBlock.js";

import { confessionCommand } from "./commands/confession.js";
import { ticketCommand } from "./commands/ticket.js";
import { originesCommand } from "./commands/origines.js";

import { clearCommand } from "./commands/clear.js";
import { lockCommand, unlockCommand } from "./commands/lock.js";

import {
  giveawayCommand,
  rerollCommand,
  topGiveawayCommand,
} from "./commands/giveaway.js";

import { pollCommand } from "./commands/poll.js";

import {
  boostSetupCommand,
  handleBoostMember,
  handleBoostInteraction,
} from "./commands/boost.js";

import { talkCommand } from "./commands/talk.js";

import {
  fermetureCommand,
  ouvertureCommand,
} from "./commands/fermeture.js";

import { configCommand } from "./commands/config.js";

import {
  massbanCommand,
  delsalonCommand,
  broadcastCommand,
  masskickCommand,
  parleCommand,
} from "./commands/owner.js";

import { userinfoCommand } from "./commands/userinfo.js";

import {
  statsCommand,
  incrementMessages,
} from "./commands/stats.js";

import { dmCommand } from "./commands/dm.js";

import { serverprofileCommand } from "./commands/serverprofile.js";
import { botprofilCommand } from "./commands/botprofil.js";

// ─── JAIL ────────────────────────────────────────────────
import {
  jailCommand,
  unjailCommand,
} from "./commands/jail.js";

// ─── PHOTO ───────────────────────────────────────────────
import {
  handlePhotoSystem,
  getPhotoEmoji,
} from "./commands/photo.js";

// ─── ECONOMY ─────────────────────────────────────────────
import {
  soldeCommand,
  dailyCommand,
  workCommand,
  payCommand,
  depCommand,
  depositCommand,
  withCommand,
  withdrawCommand,
  repCommand,
  metierCommand,
  topCommand,
  ecoHelpCommand,
} from "./commands/economy.js";

import {
  braquerCommand,
  cambriolerCommand,
  casserCommand,
  jugerCommand,
  robCommand,
} from "./commands/jobs.js";

import { teamCommand } from "./commands/team.js";
import { livretCommand } from "./commands/livret.js";
import { tycoonCommand } from "./commands/tycoon.js";
import { cryptoCommand } from "./commands/crypto.js";

import {
  rouletteCommand,
  blackjackCommand,
  bjCommand,
} from "./commands/casino.js";

import { shopCommand } from "./commands/shop.js";
import { ecoconfigCommand } from "./commands/ecoconfig.js";
import { coinsetupCommand } from "./commands/coinsetup.js";

// ─── TOKEN ───────────────────────────────────────────────
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant");
  process.exit(1);
}

export const PREFIX = "*";
export const ECO_PREFIX = "&";

// ─── COLLECTIONS ─────────────────────────────────────────
const commands = new Collection<string, Command>();
const ecoCommands = new Collection<string, Command>();

// ─── ECO COMMANDS ────────────────────────────────────────
for (const cmd of [
  soldeCommand,
  dailyCommand,
  workCommand,
  payCommand,
  depCommand,
  depositCommand,
  withCommand,
  withdrawCommand,
  repCommand,
  metierCommand,
  topCommand,
  ecoHelpCommand,

  braquerCommand,
  cambriolerCommand,
  casserCommand,
  jugerCommand,
  robCommand,

  teamCommand,
  livretCommand,
  tycoonCommand,
  cryptoCommand,

  rouletteCommand,
  blackjackCommand,
  bjCommand,

  shopCommand,
  ecoconfigCommand,
  coinsetupCommand,
]) {
  ecoCommands.set(cmd.name, cmd);
}

// ─── NORMAL COMMANDS ─────────────────────────────────────
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
]) {
  commands.set(cmd.name, cmd);
}

// ─── CLIENT ──────────────────────────────────────────────
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

// ─── BOOST ───────────────────────────────────────────────
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  try {
    await handleBoostMember(
      oldMember as any,
      newMember
    );
  } catch (err) {
    console.error("Erreur boost:", err);
  }
});

// ─── INTERACTIONS ────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await handleBoostInteraction(interaction);
  } catch (err) {
    console.error(err);
  }
});

// ─── MESSAGE CREATE ──────────────────────────────────────
client.on(Events.MessageCreate, async (message: Message) => {

  if (message.author.bot) return;

  if (message.guild) {
    incrementMessages(message.guild.id);
  }

  // ─────────────────────────────
  // PHOTO SYSTEM
  // ─────────────────────────────
  handlePhotoSystem(message);

  const emoji = getPhotoEmoji(message.channel.id);

  if (emoji) {

    const hasMedia = message.attachments.some(att =>
      (att.contentType || "").startsWith("image/") ||
      (att.contentType || "").startsWith("video/")
    );

    if (!hasMedia) {
      await message.delete().catch(() => {});
      return;
    }

    await message.react(emoji).catch(() => {});
    return;
  }

  // ─────────────────────────────
  // ECONOMY COMMANDS
  // ─────────────────────────────
  if (message.content.startsWith(ECO_PREFIX)) {

    const args = message.content
      .slice(ECO_PREFIX.length)
      .trim()
      .split(/\s+/);

    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = ecoCommands.get(commandName);

    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (err) {
      console.error(err);

      message.reply(
        "❌ erreur commande économique"
      ).catch(() => {});
    }

    return;
  }

  // ─────────────────────────────
  // IA SYSTEM
  // ─────────────────────────────
  const ia = await shouldTriggerIA(message, client);

  if (ia.trigger) {

    if (
      message.guildId &&
      isIaBlocked(message.guildId, message.channelId)
    ) return;

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

  // ─────────────────────────────
  // NORMAL COMMANDS
  // ─────────────────────────────
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);

    message.reply(
      "❌ erreur commande"
    ).catch(() => {});
  }
});

// ─── HTTP SERVER ─────────────────────────────────────────
const PORT = process.env.PORT
  ? parseInt(process.env.PORT)
  : 3000;

createServer((req, res) => {

  const status = {
    status: client.isReady() ? "online" : "starting",
    bot: client.user?.tag ?? null,
    guilds: client.guilds.cache.size,
    uptime: client.uptime ?? 0,
  };

  res.writeHead(200, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(status));

}).listen(PORT, () => {
  console.log(`🌐 HTTP server listening on ${PORT}`);
});

// ─── LOGIN ───────────────────────────────────────────────
client.login(token);