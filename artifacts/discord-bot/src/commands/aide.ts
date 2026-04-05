import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const aideCommand: Command = {
  name: "aide",
  description: "Affiche l'aide du bot",
  usage: "*aide | *aide jeu | *aide mod | *aide bot",
  execute: async (message, args) => {
    const categorie = args[0]?.toLowerCase();

    if (categorie === "jeu") {
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🎮 Commandes — Jeux")
        .addFields(
          { name: "*loupgarou @j1 @j2 ...", value: "Lance une partie de Loup-Garou (min 3 joueurs)" },
          { name: "*undercover @j1 @j2 ...", value: "Lance une partie d'Undercover (min 3 joueurs)" },
          { name: "*quiz drapeaux", value: "Lance un quiz sur les drapeaux du monde" },
          { name: "*quiz cultureg", value: "Lance un quiz de culture générale" },
          { name: "*quiz capital", value: "Lance un quiz sur les capitales du monde" },
          { name: "*telephone", value: "Lance une partie du téléphone arabe" },
        )
        .setFooter({ text: "*aide pour voir toutes les catégories" })
        .setTimestamp();
      await message.reply({ embeds: [embed] });
      return;
    }

    if (categorie === "mod") {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🛡️ Commandes — Modération")
        .setDescription("Ces commandes sont réservées aux modérateurs et admins.")
        .addFields(
          { name: "*ban @membre [raison]", value: "Bannir un membre définitivement" },
          { name: "*tempban @membre 1h/30m/1j [raison]", value: "Bannir un membre temporairement" },
          { name: "*kick @membre [raison]", value: "Expulser un membre du serveur" },
          { name: "*mute @membre 10m/1h [raison]", value: "Rendre un membre muet temporairement" },
          { name: "*warn @membre [raison]", value: "Avertir un membre" },
          { name: "*warn list @membre", value: "Voir les avertissements d'un membre" },
          { name: "*say [message]", value: "Faire parler le bot" },
          { name: "*send [message]", value: "Envoyer un média dans le salon" },
        )
        .setFooter({ text: "*aide pour voir toutes les catégories" })
        .setTimestamp();
      await message.reply({ embeds: [embed] });
      return;
    }

    if (categorie === "bot") {
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("🤖 Commandes — Bot")
        .addFields(
          { name: "*ping", value: "Vérifie la latence du bot" },
          { name: "*info", value: "Informations sur le bot" },
          { name: "*roles", value: "Affiche les rôles du serveur" },
          { name: "*twerk", value: "Envoie un gif qui twerk" },
        )
        .setFooter({ text: "*aide pour voir toutes les catégories" })
        .setTimestamp();
      await message.reply({ embeds: [embed] });
      return;
    }

    // Menu principal
    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle("📖 Aide — KAW#3350")
      .setDescription("Choisis une catégorie pour voir les commandes disponibles.")
      .addFields(
        { name: "🎮 *aide jeu", value: "Loup-Garou, Undercover, Quiz, Téléphone" },
        { name: "🛡️ *aide mod", value: "Ban, Tempban, Kick, Mute, Warn, Say, Send" },
        { name: "🤖 *aide bot", value: "Ping, Info, Roles, Twerk" },
      )
      .setFooter({ text: "Préfixe : *" })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};