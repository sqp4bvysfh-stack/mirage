import {
  EmbedBuilder,
  type GuildMember,
  type Message,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const MEMBER_ROLE_ID = "1362527149378240814";
const PERM_IMG_ROLE_ID = "1528251444086444082";
const PERM_VOC_ROLE_ID = "1528251644113059922";

type PermConfig = {
  name: string;
  roleId: string;
  label: string;
};

async function getRepliedMessage(
  message: Message,
): Promise<Message | null> {
  const referenceId = message.reference?.messageId;

  if (!referenceId) return null;

  return message.channel.messages
    .fetch(referenceId)
    .catch(() => null);
}

async function getRepliedMember(
  message: Message,
): Promise<GuildMember | null> {
  if (!message.guild) return null;

  const repliedMessage =
    await getRepliedMessage(message);

  if (!repliedMessage) return null;

  return message.guild.members
    .fetch(repliedMessage.author.id)
    .catch(() => null);
}

async function deleteLater(
  message: Message,
  delay = 4000,
): Promise<void> {
  setTimeout(() => {
    message.delete().catch(() => {});
  }, delay);
}

function createPermCommand(
  config: PermConfig,
): Command {
  return {
    name: config.name,
    description:
      `Ajoute la permission ${config.label}`,
    usage:
      `Réponds à un message avec *${config.name}`,

    execute: async (message) => {
      if (
        !message.guild ||
        !message.member ||
        !isModerator(message.member)
      ) {
        await message.reply(
          "❌ Tu n’as pas la permission d’utiliser cette commande.",
        );
        return;
      }

      const repliedMessage =
        await getRepliedMessage(message);

      const target =
        await getRepliedMember(message);

      if (!target || !repliedMessage) {
        const error =
          await message.reply(
            `❌ Réponds au message de la personne avec \`*${config.name}\`.`,
          );

        await deleteLater(message);
        await deleteLater(error);
        return;
      }

      if (target.user.bot) {
        const error =
          await message.reply(
            "❌ Tu ne peux pas donner cette permission à un bot.",
          );

        await deleteLater(message);
        await deleteLater(error);
        return;
      }

      const role =
        message.guild.roles.cache.get(
          config.roleId,
        );

      if (!role) {
        const error =
          await message.reply(
            `❌ Le rôle ${config.label} est introuvable.`,
          );

        await deleteLater(message);
        await deleteLater(error);
        return;
      }

      if (
        target.roles.cache.has(
          config.roleId,
        )
      ) {
        const already =
          await message.channel.send(
            `⚠️ ${target} possède déjà la permission **${config.label}**.`,
          );

        await message.delete().catch(() => {});
        await repliedMessage.delete().catch(() => {});
        await deleteLater(already);
        return;
      }

      const hadMemberRole =
        target.roles.cache.has(MEMBER_ROLE_ID);

      try {
        await target.roles.add(
          role,
          `Permission ${config.label} ajoutée par ${message.author.tag}`,
        );

        const refreshedTarget =
          await message.guild.members
            .fetch(target.id)
            .catch(() => null);

        if (
          hadMemberRole &&
          refreshedTarget &&
          !refreshedTarget.roles.cache.has(MEMBER_ROLE_ID)
        ) {
          await refreshedTarget.roles.add(
            MEMBER_ROLE_ID,
            "Protection du rôle Membres après ajout d’une permission",
          );
        }
      } catch (error) {
        console.error(
          `❌ Erreur ajout permission ${config.label}:`,
          error,
        );

        const failed =
          await message.channel.send(
            `❌ Impossible d’ajouter la permission **${config.label}**. Vérifie la hiérarchie des rôles.`,
          );

        await message.delete().catch(() => {});
        await deleteLater(failed, 5000);
        return;
      }

      await message.delete().catch(() => {});
      await repliedMessage.delete().catch(() => {});

      const embed =
        new EmbedBuilder()
          .setColor(0x6d28d9)
          .setDescription(
            `✅ Permission **${config.label}** ajoutée à ${target}.`,
          );

      const confirmation =
        await message.channel.send({
          embeds: [embed],
        });

      await deleteLater(confirmation);
    },
  };
}

export const permimgCommand =
  createPermCommand({
    name: "permimg",
    roleId: PERM_IMG_ROLE_ID,
    label: "images",
  });

export const permvocCommand =
  createPermCommand({
    name: "permvoc",
    roleId: PERM_VOC_ROLE_ID,
    label: "vocal",
  });

export const permremoveCommand: Command = {
  name: "permremove",
  description:
    "Retire les permissions images et vocal",
  usage:
    "Réponds à un message avec *permremove",

  execute: async (message) => {
    if (
      !message.guild ||
      !message.member ||
      !isModerator(message.member)
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    const repliedMessage =
      await getRepliedMessage(message);

    const target =
      await getRepliedMember(message);

    if (!target || !repliedMessage) {
      const error =
        await message.reply(
          "❌ Réponds au message de la personne avec `*permremove`.",
        );

      await deleteLater(message);
      await deleteLater(error);
      return;
    }

    const roleIds = [
      PERM_IMG_ROLE_ID,
      PERM_VOC_ROLE_ID,
    ].filter((roleId) =>
      target.roles.cache.has(roleId),
    );

    if (roleIds.length === 0) {
      const none =
        await message.channel.send(
          `⚠️ ${target} ne possède aucune permission spéciale.`,
        );

      await message.delete().catch(() => {});
      await repliedMessage.delete().catch(() => {});
      await deleteLater(none);
      return;
    }

    try {
      await target.roles.remove(
        roleIds,
        `Permissions retirées par ${message.author.tag}`,
      );
    } catch (error) {
      console.error(
        "❌ Erreur retrait permissions :",
        error,
      );

      const failed =
        await message.channel.send(
          "❌ Impossible de retirer les permissions. Vérifie la hiérarchie des rôles.",
        );

      await message.delete().catch(() => {});
      await deleteLater(failed, 5000);
      return;
    }

    await message.delete().catch(() => {});
    await repliedMessage.delete().catch(() => {});

    const removedLabels: string[] = [];

    if (
      roleIds.includes(
        PERM_IMG_ROLE_ID,
      )
    ) {
      removedLabels.push("images");
    }

    if (
      roleIds.includes(
        PERM_VOC_ROLE_ID,
      )
    ) {
      removedLabels.push("vocal");
    }

    const embed =
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setDescription(
          `✅ Permission${removedLabels.length > 1 ? "s" : ""} **${removedLabels.join(" et ")}** retirée${removedLabels.length > 1 ? "s" : ""} à ${target}.`,
        );

    const confirmation =
      await message.channel.send({
        embeds: [embed],
      });

    await deleteLater(confirmation);
  },
};
