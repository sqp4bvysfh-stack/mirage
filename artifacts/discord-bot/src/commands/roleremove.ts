import { PermissionFlagsBits } from "discord.js";

export const roleremoveCommand = {
  name: "roleremove",
  description: "Retirer un rôle",

  async execute(message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply("❌ t'as pas les perms");
    }

    const user = message.mentions.members.first();
    const roleName = args.slice(1).join(" ");

    if (!user || !roleName) {
      return message.reply("❌ usage: *roleremove @user role");
    }

    const role = message.guild.roles.cache.find(
      r => r.name.toLowerCase() === roleName.toLowerCase()
    );

    if (!role) return message.reply("❌ rôle introuvable");

    try {
      await user.roles.remove(role);
      message.reply(`✅ rôle retiré à ${user.user.tag}`);
    } catch (err) {
      console.error(err);
      message.reply("❌ erreur");
    }
  }
};