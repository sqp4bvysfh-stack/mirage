import { EmbedBuilder, userMention } from "discord.js";
import type { User } from "discord.js";
import type { Command } from "../types.js";

const MOT_PAIRS = [
  ["Chat", "Chien"], ["Pizza", "Burger"], ["Plage", "Piscine"],
  ["Voiture", "Moto"], ["Café", "Thé"], ["Football", "Rugby"],
  ["Avion", "Train"], ["Chocolat", "Bonbon"], ["Cinéma", "Théâtre"],
  ["Soleil", "Lune"], ["Montagne", "Forêt"], ["Paris", "Lyon"],
  ["Roi", "Président"], ["Épée", "Arc"], ["Dragon", "Licorne"],
];

export const undercoverCommand: Command = {
  name: "undercover",
  description: "Lance une partie d'Undercover",
  usage: "*undercover @j1 @j2 @j3 ...",
  execute: async (message) => {
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

    // Assignation des rôles
    const indices = [...Array(players.length).keys()];
    const undercoverIndex = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
    const hasMrWhite = players.length >= 4;
    const mrWhiteIndex = hasMrWhite
      ? indices.splice(Math.floor(Math.random() * indices.length), 1)[0]
      : -1;

    const getRoleInfo = (i: number) => {
      if (i === undercoverIndex) return { mot: pair[1], role: "🕵️ **Undercover**", info: "⚠️ Tu es l'**Undercover** ! Ton mot est différent des civils. Ne te fais pas démasquer." };
      if (i === mrWhiteIndex)   return { mot: null,     role: "⬜ **Mr. White**",   info: "🤫 Tu es **Mr. White** ! Tu n'as pas de mot. Écoute les autres et essaie de deviner le mot des civils avant d'être éliminé." };
      return { mot: pair[0], role: "✅ **Civil**", info: "Tu es un **Civil**. Trouve l'Undercover et Mr. White !" };
    };

    // Envoi des DMs en parallèle
    const results = await Promise.all(
      players.map(async (user, i) => {
        const { mot, role, info } = getRoleInfo(i);
        try {
          await user.send(
            `🕵️ **Undercover** — Serveur : **${message.guild?.name}**\n\n` +
            (mot ? `Ton mot secret est : **${mot}**\n\n` : `Tu n'as **pas de mot**.\n\n`) +
            `Tu es ${role}\n${info}`
          );
          return `✅ ${userMention(user.id)} — mot envoyé`;
        } catch {
          return `⚠️ ${userMention(user.id)} — MP fermés`;
        }
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setTitle("🕵️ Partie d'Undercover lancée !")
      .setDescription(
        `**${players.length} joueurs** participent.\n` +
        `Il y a **1 Undercover**${hasMrWhite ? ", **1 Mr. White**" : ""} parmi vous… Trouvez-les !`
      )
      .addFields({ name: "📬 Envois", value: results.join("\n") })
      .setFooter({ text: "Décrivez votre mot sans le dire directement !" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};