import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
} from "discord.js";
import type { Command } from "./types.js";
import { pingCommand } from "./commands/ping.js";
import { aideCommand } from "./commands/aide.js";
import { infoCommand } from "./commands/info.js";
import { loupgarouCommand } from "./commands/loupgarou.js";
import { onGuildMemberAdd } from "./events/guildMemberAdd.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN manquant dans les variables d'environnement.");
  process.exit(1);
}

const commands: Command[] = [pingCommand, aideCommand, infoCommand, loupgarouCommand];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    // GatewayIntentBits.GuildMembers — intent privilégié, activer dans le Developer Portal
    // (Bot → Privileged Gateway Intents → Server Members Intent) puis décommenter
  ],
});

const commandCollection = new Collection<string, Command>();
for (const command of commands) {
  commandCollection.set(command.data.name, command);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot connecté en tant que ${readyClient.user.tag}`);
  console.log(`📡 Serveurs : ${readyClient.guilds.cache.size}`);

  const rest = new REST().setToken(token!);
  const commandData = commands.map((c) => c.data.toJSON());

  // Enregistrement global (toujours actif)
  try {
    await rest.put(Routes.applicationCommands(readyClient.user.id), { body: commandData });
    console.log(`📋 ${commandData.length} commande(s) globale(s) enregistrée(s).`);
  } catch (err) {
    console.error("Erreur enregistrement global:", err);
  }

  // Enregistrement par serveur (instantané)
  for (const guild of readyClient.guilds.cache.values()) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(readyClient.user.id, guild.id),
        { body: commandData }
      );
      console.log(`✅ Commandes enregistrées dans : "${guild.name}"`);
    } catch (err) {
      console.error(`Erreur enregistrement dans "${guild.name}":`, err);
    }
  }
});

client.on(Events.GuildMemberAdd, onGuildMemberAdd);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`⚡ Commande reçue : /${interaction.commandName} par ${interaction.user.tag}`);

  const command = commandCollection.get(interaction.commandName);
  if (!command) {
    console.warn(`Commande inconnue : ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erreur avec /${interaction.commandName}:`, error);
    const errorMessage = { content: "❌ Une erreur s'est produite.", flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage).catch(() => {});
    } else {
      await interaction.reply(errorMessage).catch(() => {});
    }
  }
});

client.login(token);
