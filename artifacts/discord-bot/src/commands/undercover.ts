import { EmbedBuilder, userMention } from "discord.js";
import type { User } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const MOT_PAIRS = [
  ["Chat", "Chien"],
  ["Pizza", "Burger"],
  ["Plage", "Piscine"],
  ["Voiture", "Moto"],
  ["Café", "Thé"],
  ["Football", "Rugby"],
  ["Avion", "Train"],
  ["Chocolat", "Bonbon"],
  ["Cinéma", "Théâtre"],
  ["Soleil", "Lune"],
  ["Montagne", "Forêt"],
  ["Paris", "Lyon"],
  ["Roi", "Président"],
  ["Épée", "Arc"],
  ["Dragon", "Licorne"],
];

export const undercoverCommand: Command = {
  name: "undercover",
  description: "Lance une partie d'Undercover",
  usage: "*undercover @j1 @j2 @j3 ...",
  execute: async (message) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Seuls les modérateurs peuvent lancer une partie d'Undercover.");
      return;
    }

    const players: User[] = message.mentions.users.filter((u) => !u.bot).map((u) => u);

    if (players.length < 3) {
      await message.reply("❌ Il faut au moins **3 joueurs** !\nEx : `*undercover @j1 @j2 @j3`");
      return;
    }

    if (players.length > 12) {
      await message.reply("❌ Maximum **12 joueurs** par partie.");
      return;
    }

    const pair = MOT_PAIRS[Math.floor(Math.random() * MOT_PAIRS.length)];
    const undercoverIndex = Math.floor(Math.random() * players.length);

    const results: string[] = [];

    for (let i = 0; i < players.length; i++) {
      const user = players[i];
      const mot = i === undercoverIndex ? pair[1] : pair[0];
      const estUndercover = i === undercoverIndex;

      try {
        await user.send(
          `🕵️ **Undercover** — Serveur : **${message.guild?.name}**\n\nTon mot secret est : **${mot}**\n\n` +
          (estUndercover
            ? "⚠️ Tu es l'**Undercover** ! Ne te fais pas démasquer."
            : "✅ Tu es un **Civil**. Trouve l'Undercover !")
        );
        results.push(`✅ ${userMention(user.id)} — mot envoyé`);
      } catch {
        results.push(`⚠️ ${userMention(user.id)} — MP fermés, n'a pas reçu son mot`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setTitle("🕵️ Partie d'Undercover lancée !")
      .setDescription(
        `**${players.length} joueurs** participent.\n` +
        `Chaque joueur a reçu son mot en MP.\n\n` +
        `Il y a **1 Undercover** parmi vous… Trouvez-le !`
      )
      .addFields({ name: "📬 Envois", value: results.join("\n") })
      .setFooter({ text: "Décrivez votre mot sans le dire directement !" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};