import type { Message } from "discord.js";
import type { Command } from "../types.js";

const PHOTO_CHANNEL_ID = "1528083290848891072";
const PHOTO_REACTIONS = ["✅", "❌"];

export const photoCommand: Command = {
  name: "photo",
  description: "Affiche la configuration du salon photo",
  usage: "*photo",

  execute: async (message) => {
    if (!message.guild || !message.member) return;

    if (!message.member.permissions.has("ManageChannels")) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    const channel =
      message.guild.channels.cache.get(
        PHOTO_CHANNEL_ID,
      );

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      await message.reply(
        "❌ Le salon photo configuré est introuvable.",
      );
      return;
    }

    await message.reply(
      `✅ Le salon photo est configuré sur ${channel} avec les réactions ${PHOTO_REACTIONS.join(" ")}.`,
    );
  },
};

export async function handlePhotoSystem(
  message: Message,
): Promise<void> {
  if (message.author.bot) return;
  if (
    message.channel.id !==
    PHOTO_CHANNEL_ID
  ) {
    return;
  }

  const hasMedia =
    message.attachments.some(
      (attachment) => {
        const type =
          attachment.contentType ?? "";

        return (
          type.startsWith("image/") ||
          type.startsWith("video/")
        );
      },
    );

  if (!hasMedia) {
    await message.delete().catch(() => {});
    return;
  }

  for (const emoji of PHOTO_REACTIONS) {
    await message
      .react(emoji)
      .catch((error) => {
        console.error(
          `❌ Impossible d’ajouter la réaction ${emoji} :`,
          error,
        );
      });
  }
}

export function getPhotoEmoji(
  channelId: string,
): string[] | undefined {
  return channelId ===
    PHOTO_CHANNEL_ID
    ? PHOTO_REACTIONS
    : undefined;
}
