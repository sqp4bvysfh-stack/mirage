import { createServer } from "node:http";
import { Client, GatewayIntentBits, Collection, Events, REST, Routes } from "discord.js";
import type { Message } from "discord.js";
import type { Command } from "./types.js";
import { pingCommand } from "./commands/ping.js";
import { aideCommand } from "./commands/aide.js";
import { infoCommand } from "./commands/info.js";
import { loupgarouCommand } from "./commands/loupgarou.js";
import { rolesCommand } from "./commands/roles.js";
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

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant dans les variables d'environnement.");
  process.exit(1);
}

export const PREFIX = "*";

const commands = new Collection<string, Command>();
for (const cmd of [
  pingCommand, aideCommand, infoCommand, loupgarouCommand, rolesCommand,
  sayCommand, banCommand, tempbanCommand, muteCommand, kickCommand, warnCommand,
  quizCommand, undercoverCommand, telephoneCommand, twerkCommand, sendCommand,
  unmuteCommand, unbanCommand, iaCommand,
]) {
  commands.set(cmd.name, cmd);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

// ─── Anti-Raid ────────────────────────────────────────────────────────────────
const joinTracker = new Map<string, number[]>();
const RAID_THRESHOLD = 5;
const RAID_WINDOW_MS = 10000;

client.on(Events.GuildMemberAdd, async (member) => {
  const guildId = member.guild.id;
  const now = Date.now();
  const joins = (joinTracker.get(guildId) ?? []).filter(t => now - t < RAID_WINDOW_MS);
  joins.push(now);
  joinTracker.set(guildId, joins);

  if (joins.length >= RAID_THRESHOLD) {
    const channel = member.guild.systemChannel ?? member.guild.channels.cache.find(c => c.isTextBased());
    if (channel && channel.isTextBased()) {
      await channel.send(
        `🚨 **ALERTE ANTI-RAID** — ${joins.length} membres ont rejoint en moins de 10 secondes !`
      ).catch(() => {});
    }
  }
});

// ─── Serveur HTTP ─────────────────────────────────────────────────────────────
const PORT = process.env.BOT_PORT ? parseInt(process.env.BOT_PORT) : 3000;
const httpServer = createServer((req, res) => {
  const isOnline = client.isReady();
  const status = {
    status: isOnline ? "online" : "connecting",
    bot: client.user?.tag ?? null,
    guilds: client.guilds.cache.size,
    commands: [...commands.keys()].map((k) => PREFIX + k),
    uptime: client.uptime ?? 0,
  };
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(status));
});
httpServer.listen(PORT, () => {
  console.log(`🌐 Serveur statut en ligne sur le port ${PORT}`);
});

// ─── Arrêt du bot ─────────────────────────────────────────────────────────────
async function shutdown() {
  const salon = client.channels.cache.get("1487480560090874066");
  if (salon && salon.isTextBased()) {
    await salon.send("😴 Bot endormi...").catch(() => {});
  }
  client.destroy();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ─── Bot prêt ─────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot en ligne — ${readyClient.user.tag}`);

  const salon = readyClient.channels.cache.get("1487480560090874066");
  if (salon && salon.isTextBased()) {
    salon.send("✅ Bot en ligne !").catch(() => {});
  }

  const rest = new REST().setToken(token!);
  rest.put(Routes.applicationCommands(readyClient.user.id), { body: [] }).catch(() => {});
  for (const guild of readyClient.guilds.cache.values()) {
    rest.put(Routes.applicationGuildCommands(readyClient.user.id, guild.id), { body: [] }).catch(() => {});
  }
});

// ─── Messages ─────────────────────────────────────────────────────────────────
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  // ─── Réponse aux mentions ──────────────────────────────────────────────────
  if (client.user && message.mentions.has(client.user)) {
    const texte = message.content.replace(`<@${client.user.id}>`, "").trim();
    if (texte) {
      const isMod =
        message.member?.permissions.has("ManageMessages") ||
        message.member?.permissions.has("Administrator");
      await message.channel.sendTyping();
      const reply = await repondreIA(texte, isMod ?? false);
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

  console.log(`⚡ Commande : ${PREFIX}${commandName} par ${message.author.tag}`);

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`❌ Erreur avec ${PREFIX}${commandName}:`, error);
    await message.reply("❌ Une erreur s'est produite.").catch(() => {});
  }
});

client.login(token);