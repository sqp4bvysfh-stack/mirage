import { Events, Message } from "discord.js";
import type { Command } from "../types.js";

const photoChannels = new Map<string, string>();

const photoSetup = new Map<
  string,
  {
    step: "channel" | "emoji";
    channelId?: string;
  }
>();

export const photoCommand: Command = {
  name: "photo",

  async execute(message) {

    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply("❌ Tu n'as pas la permission.");
    }

    photoSetup.set(message.author.id, {
      step: "channel"
    });

    await message.reply(
      "📸 Quel salon veux-tu mettre en mode photo ?\n" +
      "Mentionne le salon (#salon)"
    );
  }
};

export function registerPhotoSystem(client: any) {

  client.on(Events.MessageCreate, async (message: Message) => {

    if (message.author.bot) return;

    // ── CONFIG PHOTO ─────────────────────
    const setup = photoSetup.get(message.author.id);

    if (setup) {

      // Salon
      if (setup.step === "channel") {

        const channel = message.mentions.channels.first();

        if (!channel) {
          return message.reply("❌ Mentionne un salon valide.");
        }

        photoSetup.set(message.author.id, {
          step: "emoji",
          channelId: channel.id
        });

        return message.reply(
          "😀 Quel emoji veux-tu mettre automatiquement ?"
        );
      }

      // Emoji
      if (setup.step === "emoji") {

        const emoji = message.content.trim();

        if (!setup.channelId) return;

        photoChannels.set(setup.channelId, emoji);

        photoSetup.delete(message.author.id);

        return message.reply(
          `✅ Salon configuré avec la réaction ${emoji}`
        );
      }
    }

    // ── MODE PHOTO ──────────────────────
    const emoji = photoChannels.get(message.channel.id);

    if (!emoji) return;

    if (message.content.startsWith("*photo")) return;

    const hasMedia = message.attachments.some(att => {
      const type = att.contentType || "";

      return (
        type.startsWith("image/") ||
        type.startsWith("video/")
      );
    });

    // Supprime tout sauf image/vidéo
    if (!hasMedia) {
      return message.delete().catch(() => {});
    }

    // Réaction auto
    await message.react(emoji).catch(() => {});
  });
}