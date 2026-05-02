

import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

export const clearCommand: Command = {
  name: "clear",
  description: "Supprimer des messages",
  usage: "*clear [nombre]",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const amount = parseInt(args[0]) || 10;
    if (amount < 1 || amount > 100) {
      await message.reply("❌ Indique un nombre entre 1 et 100.");
      return;
    }

    await message.channel.bulkDelete(amount + 1, true).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🧹 Messages supprimés")
      .setDescription(`**${amount}** messages supprimés par ${message.author.tag}`)
      .setTimestamp();

    const msg = await message.channel.send({ embeds: [embed] });
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  },
};
