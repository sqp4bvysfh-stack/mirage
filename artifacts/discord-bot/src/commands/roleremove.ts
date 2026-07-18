import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { canActOn, isModerator } from "../utils/modCheck.js";
import { sendRoleLog } from "../utils/logs.js";

export const roleremoveCommand: Command = {
  name: "roleremove",
  description: "Retirer un rôle à un membre",
  usage: "*roleremove @membre Nom du rôle",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const target = message.mentions.members?.first();
    const roleName = args.slice(1).join(" ").trim();

    if (!target || !roleName) {
      await message.reply("❌ Utilisation : `*roleremove @membre Nom du rôle`");
      return;
    }

    if (!canActOn(message.member, target)) {
      await message.reply(
        "❌ Tu ne peux pas modifier les rôles de quelqu’un de ton niveau ou au-dessus.",
      );
      return;
    }

    const role =
      message.mentions.roles.first() ??
      message.guild.roles.cache.find(
        (item) => item.name.toLowerCase() === roleName.toLowerCase(),
      );

    if (!role) {
      await message.reply("❌ Rôle introuvable.");
      return;
    }

    if (!target.roles.cache.has(role.id)) {
      await message.reply("⚠️ Ce membre ne possède pas ce rôle.");
      return;
    }

    const botMember = message.guild.members.me;
    if (
      role.managed ||
      !botMember ||
      role.position >= botMember.roles.highest.position
    ) {
      await message.reply("❌ Je ne peux pas attribuer ce rôle à cause de la hiérarchie.");
      return;
    }

    try {
      await target.roles.remove(role, `Retrait par ${message.author.tag}`);
    } catch (error) {
      console.error("Erreur roleremove :", error);
      await message.reply("❌ Je n’ai pas réussi à retirer ce rôle.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("➖ Rôle retiré")
      .addFields(
        { name: "Membre", value: `${target}`, inline: true },
        { name: "Rôle", value: `${role}`, inline: true },
        { name: "Modérateur", value: `${message.author}`, inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendRoleLog(message.guild, { embeds: [embed] });
  },
};
