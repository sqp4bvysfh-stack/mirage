import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

export const rolesCommand: Command = {
  name: "roles",
  description: "Affiche tous les rôles du Loup-Garou.",
  usage: "*roles",

  async execute(message) {
    const villageois = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🟦 Villageois spéciaux")
      .addFields(
        {
          name: "🧑‍🌾 Villageois",
          value: "Aucun pouvoir. Vote chaque jour pour éliminer les suspects.",
          inline: false,
        },
        {
          name: "🔮 La Voyante",
          value: "Chaque nuit, elle peut voir le rôle d'un joueur de son choix.",
          inline: false,
        },
        {
          name: "🏹 Chasseur",
          value: "À sa mort, il entraîne un joueur de son choix dans la tombe.",
          inline: false,
        },
        {
          name: "🧪 La Sorcière",
          value:
            "Possède deux potions (usage unique chacune) : **soigner** la victime des loups, ou **tuer** n'importe quel joueur.",
          inline: false,
        },
        {
          name: "🛡️ Le Garde",
          value:
            "Chaque nuit, protège un joueur des loups. Peut se protéger lui-même, mais pas le même joueur deux nuits d'affilée.",
          inline: false,
        },
        {
          name: "💀 Le Nécromancien",
          value: "La nuit, il communique avec les morts pour obtenir des informations.",
          inline: false,
        },
        {
          name: "💘 Cupidon",
          value:
            "La première nuit, désigne deux **Amoureux** (peut se désigner lui-même). Si l'un meurt, l'autre mourra aussi.",
          inline: false,
        },
        {
          name: "🦊 Le Renard",
          value:
            "Renifle 3 joueurs la première nuit pour détecter un loup. Si aucun loup : perd son pouvoir. Si un loup : peut renifler un nouveau trio la nuit suivante.",
          inline: false,
        },
        {
          name: "🐑 Le Berger",
          value:
            "Possède 3 moutons. Envoie un mouton chez un joueur chaque nuit — s'il est dévoré, c'est un loup. Fonctionne comme le Renard.",
          inline: false,
        },
        {
          name: "🧒 L'Enfant Sauvage",
          value:
            "Choisit un **père** la première nuit. Reste du côté du village tant que son père vit. Si son père meurt → il devient Loup-Garou.",
          inline: false,
        }
      );

    const mechants = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🟥 Les méchants")
      .addFields(
        {
          name: "🐺 Loup-Garou",
          value:
            "Chaque nuit, vote avec ses alliés pour dévorer un villageois. Le jour, évite d'être démasqué.",
          inline: false,
        },
        {
          name: "💬 Loup-Bavard",
          value:
            "Reçoit un **mot secret** chaque jour qu'il doit prononcer avant le coucher du soleil — sinon il meurt.",
          inline: false,
        },
        {
          name: "🖤 Loup-Noir",
          value:
            "Une seule fois dans la partie, peut **infecter** la victime des loups : elle devient Loup-Garou tout en conservant son rôle et ses pouvoirs.",
          inline: false,
        },
        {
          name: "🤍 Loup Blanc — ⬜ Solo",
          value:
            "Se réveille avec les loups mais joue pour lui-même. Son but : être le **seul survivant**. Une nuit sur deux, peut dévorer n'importe quel joueur, y compris un autre loup.",
          inline: false,
        }
      )
      .setFooter({ text: "Les rôles spéciaux apparaissent selon le nombre de joueurs." });

    await message.reply({ embeds: [villageois] });
    await message.channel.send({ embeds: [mechants] });
  },
};
