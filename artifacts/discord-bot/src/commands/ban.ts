import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator, canActOn } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

export const banCommand: Command = {
  name: "ban",
  description: "Bannir un membre du serveur",
  usage: "*ban @membre [raison]",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }
    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Mentionne un membre. Ex: `*ban @membre raison`");
      return;
    }
    if (!canActOn(message.member!, target)) {
      await message.reply("❌ Tu ne peux pas sanctionner quelqu'un de ton niveau ou au-dessus de toi dans la hiérarchie.");
      return;
    }
    if (!target.bannable) {
      await message.reply(
        "❌ Je ne peux pas bannir ce membre. Vérifie que :\n" +
        "• Le rôle du bot est **au-dessus** de ce membre dans la hiérarchie Discord\n" +
        "• Le bot a la permission **Bannir des membres**"
      );
      return;
    }
    const raison = args.slice(1).join(" ") || "Aucune raison fournie";
    try {
      await target.ban({ reason: raison });
    } catch {
      await message.reply("❌ Erreur lors du ban — vérifie les permissions du bot.");
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🔨 Membre banni")
      .addFields(
        { name: "Membre", value: target.user.tag, inline: true },
        { name: "Modérateur", value: message.author.tag, inline: true },
        { name: "Raison", value: raison }
      )
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    if (message.guild) await sendServerLog(message.guild, { embeds: [embed] });
  },
};
