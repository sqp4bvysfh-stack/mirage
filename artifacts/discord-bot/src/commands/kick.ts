import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

export const kickCommand: Command = {
  name: "kick",
  description: "Expulser un membre du serveur",
  usage: "*kick @membre [raison]",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }
    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Ex: `*kick @membre raison`");
      return;
    }
    if (!target.kickable) {
      await message.reply("❌ Je ne peux pas expulser ce membre.");
      return;
    }
    const raison = args.slice(1).join(" ") || "Aucune raison fournie";
    await target.kick(raison);
    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("👢 Membre expulsé")
      .addFields(
        { name: "Membre", value: target.user.tag, inline: true },
        { name: "Modérateur", value: message.author.tag, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};