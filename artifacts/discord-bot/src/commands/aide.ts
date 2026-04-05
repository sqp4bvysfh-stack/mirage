import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const aideCommand: Command = {
  name: "aide",
  description: "Affiche la liste des commandes disponibles.",
  usage: "*aide",

  async execute(message) {
    const utilitaires = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Commandes — Utilitaires")
      .addFields(
        { name: "`*ping`", value: "Latence du bot.", inline: true },
        { name: "`*info`", value: "Infos du serveur.", inline: true },
        { name: "`*aide`", value: "Ce message.", inline: true },
        { name: "`*say [texte]`", value: "Le bot envoie un message (modo).", inline: false },
        { name: "`*send [texte/fichier]`", value: "Envoie un média dans le salon (modo).", inline: false },
        { name: "`*ia [message]`", value: "Parle avec Mirage (IA). Fonctionne aussi en @mentionnant le bot.", inline: false },
      );

    const moderation = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🛡️ Commandes — Modération")
      .addFields(
        { name: "`*ban @membre [raison]`", value: "Bannir un membre.", inline: false },
        { name: "`*unban [ID]`", value: "Débannir par son ID.", inline: false },
        { name: "`*tempban @membre 1h [raison]`", value: "Ban temporaire. Durées : `30m`, `1h`, `2j`.", inline: false },
        { name: "`*kick @membre [raison]`", value: "Expulser un membre.", inline: false },
        { name: "`*mute @membre 10m [raison]`", value: "Rendre muet temporairement.", inline: false },
        { name: "`*unmute @membre`", value: "Retirer le mute.", inline: false },
        { name: "`*warn @membre [raison]`", value: "Avertir un membre.", inline: false },
        { name: "`*warn list @membre`", value: "Voir les avertissements d'un membre.", inline: false },
      );

    const jeux = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🎮 Commandes — Jeux")
      .addFields(
        { name: "`*loupgarou @j1 @j2 ...`", value: "Lance une partie de Loup-Garou. Rôles envoyés en MP (3–20 joueurs).", inline: false },
        { name: "`*roles`", value: "Affiche tous les rôles du Loup-Garou.", inline: false },
        { name: "`*undercover @j1 @j2 ...`", value: "Lance une partie d'Undercover. Mots envoyés en MP (3–12 joueurs).", inline: false },
        { name: "`*quiz drapeaux`", value: "Quiz de drapeaux — 30 secondes pour répondre.", inline: false },
        { name: "`*quiz cultureg`", value: "Quiz de culture générale.", inline: false },
        { name: "`*quiz capital`", value: "Quiz de capitales du monde.", inline: false },
        { name: "`*telephone`", value: "Accès au téléphone secret (Murder Mystery) — code requis en MP.", inline: false },
        { name: "`*twerk`", value: "👀", inline: false },
      )
      .setFooter({ text: "Toutes les commandes commencent par * • Anti-Raid activé" });

    await message.reply({ embeds: [utilitaires] });
    await message.channel.send({ embeds: [moderation] });
    await message.channel.send({ embeds: [jeux] });
  },
};
