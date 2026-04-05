import type { Command } from "../types.js";

export const unbanCommand: Command = {
  name: "unban",
  description: "Débannir un membre par son ID",
  usage: "*unban [ID]",
  execute: async (message, args) => {
    const member = message.member;
    if (!member?.permissions.has("BanMembers") && !member?.permissions.has("Administrator")) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const userId = args[0];
    if (!userId) {
      await message.reply("❌ Donne l'ID du membre. Ex: `*unban 123456789`");
      return;
    }

    await message.guild?.bans.remove(userId, `Unban par ${message.author.tag}`).catch(() => null);
    await message.reply(`✅ L'utilisateur **${userId}** a été débanni.`);
  },
};