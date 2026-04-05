import type { Command } from "../types.js";

export const unmuteCommand: Command = {
  name: "unmute",
  description: "Retire le mute d'un membre",
  usage: "*unmute @membre",
  execute: async (message) => {
    const member = message.member;
    if (!member?.permissions.has("ModerateMembers") && !member?.permissions.has("Administrator")) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const cible = message.mentions.members?.first();
    if (!cible) {
      await message.reply("❌ Mentionne un membre. Ex: `*unmute @membre`");
      return;
    }

    if (!cible.isCommunicationDisabled()) {
      await message.reply("❌ Ce membre n'est pas muté.");
      return;
    }

    await cible.timeout(null, `Unmute par ${message.author.tag}`);
    await message.reply(`✅ **${cible.user.tag}** a été unmute.`);
  },
};