import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|j)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  if (match[2] === "s") return val * 1000;
  if (match[2] === "m") return val * 60 * 1000;
  if (match[2] === "h") return val * 60 * 60 * 1000;
  if (match[2] === "j") return val * 24 * 60 * 60 * 1000;
  return null;
}

export const muteCommand: Command = {
  name: "mute",
  description: "Rendre un membre muet temporairement",
  usage: "*mute @membre 10m/1h [raison]",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Ex: `*mute @membre 10m raison`");
      return;
    }

    // On cherche la durée dans tous les args au cas où la mention décale
    const durStr = args.find(a => /^\d+(s|m|h|j)$/.test(a));
    const duration = durStr ? parseDuration(durStr) : null;

    if (!duration) {
      await message.reply("❌ Durée invalide. Utilise `10s`, `10m`, `1h`, `1j`.");
      return;
    }

    if (duration < 5000) {
      await message.reply("❌ Durée minimum : 5 secondes.");
      return;
    }

    if (duration > 28 * 24 * 60 * 60 * 1000) {
      await message.reply("❌ Durée maximum : 28 jours.");
      return;
    }

    const raison = args.filter(a => !/^\d+(s|m|h|j)$/.test(a) && !a.startsWith("<@")).join(" ") || "Aucune raison fournie";

    await target.timeout(duration, raison);

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle("🔇 Membre mute")
      .addFields(
        { name: "Membre", value: target.user.tag, inline: true },
        { name: "Durée", value: durStr, inline: true },
        { name: "Modérateur", value: message.author.tag, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};