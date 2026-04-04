import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const aideCommand: Command = {
  name: "aide",
  description: "Affiche la liste des commandes disponibles.",
  usage: "*aide",

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Aide — Commandes disponibles")
      .setDescription("Toutes les commandes commencent par `*`")
      .addFields(
        { name: "`*ping`", value: "Vérifie la latence du bot.", inline: true },
        { name: "`*aide`", value: "Affiche ce message d'aide.", inline: true },
        { name: "`*info`", value: "Informations sur le serveur.", inline: true },
        {
          name: "`*loupgarou @j1 @j2 @j3 ...`",
          value: "Lance une partie de Loup-Garou et envoie les rôles en MP (3 à 20 joueurs).",
          inline: false,
        }
      )
      .setFooter({ text: "Bot Discord • Replit" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
