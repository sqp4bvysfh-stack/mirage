import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
} from "discord.js";
import type { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
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

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands: Command[] = [pingCommand, aideCommand, infoCommand, loupgarouCommand];

// GuildMembers est un intent privilégié — à activer dans le Developer Portal
// (Bot → Privileged Gateway Intents → Server Members Intent)
// puis décommenter GatewayIntentBits.GuildMembers ci-dessous
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    // GatewayIntentBits.GuildMembers,
  ],
});

const commandCollection = new Collection<string, Command>();
for (const command of commands) {
  commandCollection.set(command.data.name, command);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot connecté en tant que ${readyClient.user.tag}`);

  const rest = new REST().setToken(token!);
  try {
    const commandData = commands.map((c) => c.data.toJSON());
    await rest.put(Routes.applicationCommands(readyClient.user.id), {
      body: commandData,
    });
    console.log(`📋 ${commandData.length} commande(s) slash enregistrée(s).`);
  } catch (err) {
    console.error("Erreur lors de l'enregistrement des commandes:", err);
  }
});

client.on(Events.GuildMemberAdd, onGuildMemberAdd);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandCollection.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erreur avec la commande ${interaction.commandName}:`, error);
    const errorMessage = { content: "❌ Une erreur s'est produite.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.login(token);
