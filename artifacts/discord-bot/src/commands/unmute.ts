import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { canActOn, isModerator } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

export const unmuteCommand: Command = {
  name: "unmute",
  description: "Retire le mute d’un membre",
  usage: "*unmute @membre",

  execute: async (message) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const target = message.mentions.members?.first();

    if (!target) {
      await message.reply("❌ Mentionne un membre. Exemple : `*unmute @membre`");
      return;
    }

    if (!canActOn(message.member, target)) {
      await message.reply(
        "❌ Tu ne peux pas agir sur quelqu’un de ton niveau ou au-dessus de toi.",
      );
      return;
    }

    if (!target.isCommunicationDisabled()) {
      await message.reply("⚠️ Ce membre n’est pas mute.");
      return;
    }

    try {
      await target.timeout(null, `Unmute par ${message.author.tag}`);
    } catch (error) {
      console.error("Erreur unmute :", error);
      await message.reply("❌ Je n’ai pas réussi à retirer le mute.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🔊 Membre unmute")
      .addFields(
        { name: "Membre", value: `${target.user.tag}\n${target}`, inline: true },
        { name: "Modérateur", value: `${message.author.tag}\n${message.author}`, inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendServerLog(message.guild, { embeds: [embed] });
  },
};
