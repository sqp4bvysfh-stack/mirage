import {
  EmbedBuilder,
  type GuildMember,
  type Message,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const PERM_IMG_ROLE_ID = "1528251444086444082";
const PERM_VOC_ROLE_ID = "1528251644113059922";

type PermConfig = {
  name: string;
  roleId: string;
  label: string;
};

async function getRepliedMember(
  message: Message,
): Promise<GuildMember | null> {
  const referenceId =
    message.reference?.messageId;

  if (!referenceId || !message.guild) {
    return null;
  }

  const repliedMessage =
    await message.channel.messages
      .fetch(referenceId)
      .catch(() => null);

  if (!repliedMessage) {
    return null;
  }

  return message.guild.members
    .fetch(repliedMessage.author.id)
    .catch(() => null);
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

      const target =
        await getRepliedMember(message);

      if (!target) {
        const error =
          await message.reply(
            `❌ Réponds au message de la personne avec \`*${config.name}\`.`,
          );

        setTimeout(() => {
          message.delete().catch(() => {});
          error.delete().catch(() => {});
        }, 4000);

        return;
      }

      if (target.user.bot) {
        const error =
          await message.reply(
            "❌ Tu ne peux pas donner cette permission à un bot.",
          );

        setTimeout(() => {
          message.delete().catch(() => {});
          error.delete().catch(() => {});
        }, 4000);

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

        setTimeout(() => {
          message.delete().catch(() => {});
          error.delete().catch(() => {});
        }, 4000);

        return;
      }

      const repliedMessage =
        message.reference?.messageId
          ? await message.channel.messages
              .fetch(
                message.reference.messageId,
              )
              .catch(() => null)
          : null;

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
        await repliedMessage?.delete().catch(() => {});

        setTimeout(() => {
          already.delete().catch(() => {});
        }, 4000);

        return;
      }

      try {
        await target.roles.add(
          role,
          `Permission ${config.label} ajoutée par ${message.author.tag}`,
        );
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

        setTimeout(() => {
          failed.delete().catch(() => {});
        }, 5000);

        return;
      }

      await message.delete().catch(() => {});
      await repliedMessage?.delete().catch(() => {});

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

      setTimeout(() => {
        confirmation.delete().catch(() => {});
      }, 4000);
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
