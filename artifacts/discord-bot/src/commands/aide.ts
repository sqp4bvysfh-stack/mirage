import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const aideCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("aide")
    .setDescription("Affiche la liste des commandes disponibles."),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Aide — Commandes disponibles")
      .addFields(
        { name: "/ping", value: "Vérifie la latence du bot.", inline: true },
        { name: "/aide", value: "Affiche ce message d'aide.", inline: true },
        { name: "/info", value: "Informations sur le serveur.", inline: true },
        { name: "/loupgarou", value: "Lance une partie de Loup-Garou et envoie les rôles en MP (3 à 15 joueurs).", inline: false }
      )
      .setFooter({ text: "Bot Discord • Replit" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
