import { Message } from "discord.js";
import type { Command } from "../types.js";

const photoChannels = new Map<string, string>();
const photoSetup = new Map<string, { step: "channel" | "emoji"; channelId?: string }>();

export const photoCommand: Command = {
  name: "photo",

  async execute(message: Message) {

    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply("❌ Tu n'as pas la permission.");
    }

    photoSetup.set(message.author.id, { step: "channel" });

    await message.reply(
      "📸 Mentionne le salon à mettre en mode photo :\n" +
      "Exemple : #salon ou envoie l’ID du salon"
    );
  }
};

// ─── HANDLER (À GARDER DANS TON INDEX MessageCreate) ───
export function handlePhotoSystem(message: Message) {

  if (message.author.bot) return;

  const setup = photoSetup.get(message.author.id);
  if (!setup) return;

  // ── STEP 1 : salon ───────────────────────
  if (setup.step === "channel") {

    const channelId =
      message.mentions.channels.first()?.id ||
      message.content.match(/\d{15,25}/)?.[0];

    const channel =
      message.guild?.channels.cache.get(channelId ?? "");

    if (!channel || !channel.isTextBased()) {
      return message.reply("❌ Mentionne un salon valide.");
    }

    photoSetup.set(message.author.id, {
      step: "emoji",
      channelId: channel.id,
    });

    return message.reply("😀 Quel emoji veux-tu pour les réactions ?");
  }

  // ── STEP 2 : emoji ───────────────────────
  if (setup.step === "emoji") {

    const emoji = message.content.trim();

    if (!setup.channelId) return;

    photoChannels.set(setup.channelId, emoji);
    photoSetup.delete(message.author.id);

    return message.reply(
      `✅ Salon configuré en mode photo avec la réaction ${emoji}`
    );
  }
}

// ─── EXPORT DU MODE PHOTO ───────────────────────────────
export function getPhotoEmoji(channelId: string) {
  return photoChannels.get(channelId);
}