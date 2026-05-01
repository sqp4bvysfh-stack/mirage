import { createServer } from "node:http";
import { Client, GatewayIntentBits, Partials, Collection, Events, REST, Routes } from "discord.js";
import type { Message } from "discord.js";
import type { Command } from "./types.js";

// ─── COMMANDS ─────────────────────────────────────────────
import { pingCommand } from "./commands/ping.js";
import { aideCommand } from "./commands/aide.js";
import { infoCommand } from "./commands/info.js";
import { loupgarouCommand } from "./commands/loupgarou.js";
import { rolesCommand } from "./commands/roles.js"; // ⚠️ Loup-garou
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
import { confessionCommand, handleConfessionInteraction } from "./commands/confession.js";

// ─── TOKEN ────────────────────────────────────────────────
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant");
  process.exit(1);
}

export const PREFIX = "*";

// ─── COMMAND COLLECTION ───────────────────────────────────
const commands = new Collection<string, Command>();

for (const cmd of [
  pingCommand,
  aideCommand,
  infoCommand,
  loupgarouCommand,
  rolesCommand, // ✅ ton loup-garou
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
  confessionCommand
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
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

// ─── ANTI RAID ─────────────────────────────────────────────
const joinTracker = new Map();
const RAID_THRESHOLD = 5;
const RAID_WINDOW_MS = 10000;

client.on(Events.GuildMemberAdd, async (member) => {
  const guildId = member.guild.id;
  const now = Date.now();

  const joins = (joinTracker.get(guildId) || []).filter(t => now - t < RAID_WINDOW_MS);
  joins.push(now);
  joinTracker.set(guildId, joins);

  if (joins.length >= RAID_THRESHOLD) {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.isTextBased());
    if (channel && channel.isTextBased()) {
      channel.send(`🚨 ALERTE RAID : ${joins.length} arrivées rapides`).catch(() => {});
    }
  }
});

// ─── WELCOME ──────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  const salon = member.guild.channels.cache.get("1476532494768672850");
  if (salon && salon.isTextBased()) {
    salon.send(`## Bienvenue ${member}`).catch(() => {});
  }
});

// ─── HTTP SERVER ──────────────────────────────────────────
const PORT = process.env.BOT_PORT ? parseInt(process.env.BOT_PORT) : 3000;

createServer((req, res) => {
  const status = {
    status: client.isReady() ? "online" : "starting",
    bot: client.user?.tag ?? null,
    guilds: client.guilds.cache.size,
    uptime: client.uptime ?? 0,
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(status));
}).listen(PORT);

// ─── READY ────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot en ligne : ${c.user.tag}`);
});

// ─── INTERACTIONS ─────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await handleConfessionInteraction(interaction);
  } catch (err) {
    console.error("Erreur interaction:", err);
  }
});

// ─── MESSAGES ─────────────────────────────────────────────
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  // IA mention
  if (client.user && message.mentions.has(client.user)) {
    const texte = message.content.replace(`<@${client.user.id}>`, "").trim();

    if (texte) {
      const isMod =
        message.member?.permissions.has("ManageMessages") ||
        message.member?.permissions.has("Administrator");

      await message.channel.sendTyping();
      const reply = await repondreIA(texte, isMod ?? false, message.channelId);
      await message.reply(reply);
    }
    return;
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply("❌ erreur commande").catch(() => {});
  }
});

// ─── LOGIN ────────────────────────────────────────────────
client.login(token);