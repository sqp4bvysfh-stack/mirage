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
        { name: "🧑‍🌾 Villageois", value: "Aucun pouvoir. Vote chaque jour pour éliminer les suspects.", inline: false },
        { name: "🔮 La Voyante", value: "Chaque nuit, elle peut voir le rôle d'un joueur de son choix.", inline: false },
        { name: "🏹 Chasseur", value: "À sa mort, il entraîne un joueur de son choix dans la tombe.", inline: false },
        { name: "🧪 La Sorcière", value: "Possède deux potions (usage unique chacune) : **soigner** la victime des loups, ou **tuer** n'importe quel joueur.", inline: false },
        { name: "🛡️ Le Garde", value: "Chaque nuit, protège un joueur des loups. Peut se protéger lui-même, mais pas le même joueur deux nuits d'affilée.", inline: false },
        { name: "💀 Le Nécromancien", value: "La nuit, il communique avec les morts pour obtenir des informations.", inline: false },
        { name: "💘 Cupidon", value: "La première nuit, désigne deux **Amoureux**. Si l'un meurt, l'autre mourra aussi.", inline: false },
        { name: "🦊 Le Renard", value: "Renifle 3 joueurs la première nuit pour détecter un loup. Si aucun loup : perd son pouvoir.", inline: false },
        { name: "🐑 Le Berger", value: "Possède 3 moutons. Envoie un mouton chez un joueur chaque nuit — s'il est dévoré, c'est un loup.", inline: false },
        { name: "🧒 L'Enfant Sauvage", value: "Choisit un **père** la première nuit. Si son père meurt → il devient Loup-Garou.", inline: false },
        { name: "⛏️ Le Nain", value: "Chaque nuit, choisit un joueur et tente de deviner son rôle. Si correct → ce joueur meurt ! Si raté → doit choisir quelqu'un d'autre la prochaine nuit. *(Disponible à 22+ joueurs)*", inline: false },
      );

    const mechants = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🟥 Les méchants")
      .addFields(
        { name: "🐺 Loup-Garou", value: "Chaque nuit, vote avec ses alliés pour dévorer un villageois.", inline: false },
        { name: "💬 Loup-Bavard", value: "Reçoit un **mot secret** chaque jour qu'il doit prononcer — sinon il meurt.", inline: false },
        { name: "🖤 Loup-Noir", value: "Une seule fois, peut **infecter** la victime des loups : elle devient Loup-Garou.", inline: false },
      );

    const solo = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle("⬜ Joueurs Solo")
      .addFields(
        { name: "🤍 Loup Blanc", value: "Se réveille avec les loups mais joue pour lui-même. But : être le **seul survivant**. Une nuit sur deux, peut dévorer n'importe quel joueur y compris un loup. *(16+ joueurs)*", inline: false },
        { name: "🔪 Serial Killer", value: "Ni loup ni villageois. Tue un joueur chaque nuit pour son propre plaisir. But : être le dernier survivant. *(25+ joueurs)*", inline: false },
      )
      .setFooter({ text: "Les rôles spéciaux apparaissent selon le nombre de joueurs." });

    await message.reply({ embeds: [villageois] });
    await message.channel.send({ embeds: [mechants] });
    await message.channel.send({ embeds: [solo] });
  },
};
