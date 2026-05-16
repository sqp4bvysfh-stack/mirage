import {
  ChannelType,
  PermissionsBitField,
  Role,
} from "discord.js";

import type { Command } from "../types.js";

const jailRoleConfig = new Map<string, string>();

const waitingRole = new Set<string>();

export const jailCommand: Command = {
  name: "jail",
  description: "Met un membre en prison",
  usage: "*jail @user",

  execute: async (message, args) => {

    if (!message.guild) return;

    const isAdmin =
      message.member?.permissions.has("Administrator");

    if (!isAdmin) {
      await message.reply("❌ admin uniquement");
      return;
    }

    // ─────────────────────────────
    // SETUP ROLE
    // ─────────────────────────────
    const existingRoleId = jailRoleConfig.get(message.guild.id);

    if (!existingRoleId) {

      if (waitingRole.has(message.guild.id)) return;

      waitingRole.add(message.guild.id);

      await message.reply(
        "🔒 Envoie l'ID du rôle jail à utiliser."
      );

      const collected = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 60_000,
      }).catch(() => null);

      waitingRole.delete(message.guild.id);

      const response = collected?.first();
      if (!response) {
        await message.reply("❌ temps écoulé");
        return;
      }

      const roleId = response.content.trim();

      const role = message.guild.roles.cache.get(roleId);

      if (!role) {
        await message.reply("❌ rôle introuvable");
        return;
      }

      jailRoleConfig.set(message.guild.id, roleId);

      // ─────────────────────────────
      // CONFIG CHANNELS
      // ─────────────────────────────
      const prisonChannel = message.guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase().includes("prison")
      );

      for (const [, channel] of message.guild.channels.cache) {

        if (!channel.isTextBased()) continue;

        // prison
        if (prisonChannel && channel.id === prisonChannel.id) {

          await channel.permissionOverwrites.edit(roleId, {
            ViewChannel: true,
            SendMessages: true,
          }).catch(() => {});

        } else {

          await channel.permissionOverwrites.edit(roleId, {
            SendMessages: false,
          }).catch(() => {});
        }
      }

      await message.reply(
        `✅ rôle jail configuré : ${role.name}`
      );

      return;
    }

    // ─────────────────────────────
    // JAIL USER
    // ─────────────────────────────
    const member =
      message.mentions.members?.first() ||
      await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) {
      await message.reply("❌ membre introuvable");
      return;
    }

    const role = message.guild.roles.cache.get(existingRoleId);

    if (!role) {
      await message.reply("❌ rôle jail supprimé");
      jailRoleConfig.delete(message.guild.id);
      return;
    }

    await member.roles.add(role).catch(() => {});

    await message.reply(
      `🔒 ${member.user.tag} a été envoyé en prison`
    );
  },
};

// ─────────────────────────────
// UNJAIL
// ─────────────────────────────
export const unjailCommand: Command = {
  name: "unjail",
  description: "Retire la prison",
  usage: "*unjail @user",

  execute: async (message, args) => {

    if (!message.guild) return;

    const roleId = jailRoleConfig.get(message.guild.id);

    if (!roleId) {
      await message.reply("❌ aucun rôle jail configuré");
      return;
    }

    const member =
      message.mentions.members?.first() ||
      await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) {
      await message.reply("❌ membre introuvable");
      return;
    }

    await member.roles.remove(roleId).catch(() => {});

    await message.reply(
      `🔓 ${member.user.tag} est sorti de prison`
    );
  },
};