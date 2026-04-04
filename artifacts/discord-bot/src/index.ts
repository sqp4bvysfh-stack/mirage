import { createServer } from "node:http";
import { Client, GatewayIntentBits, Collection, Events, REST, Routes } from "discord.js";
import type { Message } from "discord.js";
import type { Command } from "./types.js";
import { pingCommand } from "./commands/ping.js";
import { aideCommand } from "./commands/aide.js";
import { infoCommand } from "./commands/info.js";
import { loupgarouCommand } from "./commands/loupgarou.js";
import { rolesCommand } from "./commands/roles.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant dans les variables d'environnement.");
  process.exit(1);
}

export const PREFIX = "*";

const commands = new Collection<string, Command>();
for (const cmd of [pingCommand, aideCommand, infoCommand, loupgarouCommand, rolesCommand]) {
  commands.set(cmd.name, cmd);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    // GatewayIntentBits.GuildMembers — activer dans le Developer Portal pour la bienvenue
  ],
});

// Serveur HTTP de statut (nécessaire pour le déploiement Replit)
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

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot connecté en tant que ${readyClient.user.tag}`);
  console.log(`📡 Serveurs : ${readyClient.guilds.cache.size}`);
  console.log(`📋 Commandes : ${[...commands.keys()].map((k) => PREFIX + k).join(", ")}`);

  const rest = new REST().setToken(token!);
  rest.put(Routes.applicationCommands(readyClient.user.id), { body: [] }).catch(() => {});
  for (const guild of readyClient.guilds.cache.values()) {
    rest.put(Routes.applicationGuildCommands(readyClient.user.id, guild.id), { body: [] }).catch(() => {});
  }
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
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
