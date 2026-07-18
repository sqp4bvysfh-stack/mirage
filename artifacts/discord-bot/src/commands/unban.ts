import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";
import { getBlacklistEntry } from "../utils/blacklist.js";

export const unbanCommand: Command = {
  name: "unban",
  description: "Débannir un membre par son ID",
  usage: "*unban [ID]",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const userId = args[0]?.replace(/[<@!>]/g, "");

    if (!userId || !/^\d{15,25}$/.test(userId)) {
      await message.reply("❌ Donne un ID valide. Exemple : `*unban 123456789012345678`");
      return;
    }

    const blacklistEntry = getBlacklistEntry(userId);
    if (blacklistEntry) {
      await message.reply(
        "❌ Cet utilisateur est encore blacklisté. Utilise d’abord `*unbl ID`.",
      );
      return;
    }

    const ban = await message.guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      await message.reply("⚠️ Cet utilisateur n’est pas banni.");
      return;
    }

    try {
      await message.guild.bans.remove(
        userId,
        `Unban par ${message.author.tag}`,
      );
    } catch (error) {
      console.error("Erreur unban :", error);
      await message.reply("❌ Je n’ai pas réussi à débannir cet utilisateur.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("✅ Utilisateur débanni")
      .addFields(
        { name: "Utilisateur", value: `${ban.user.tag}\n\`${userId}\``, inline: true },
        { name: "Modérateur", value: `${message.author.tag}\n${message.author}`, inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendServerLog(message.guild, { embeds: [embed] });
  },
};
