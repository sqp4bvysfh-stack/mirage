import {
  EmbedBuilder,
  type Message,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

type SnipedMessage = {
  authorId: string;
  authorTag: string;
  content: string;
  attachments: string[];
  deletedAt: number;
};

const MAX_SNIPE_MESSAGES = 10;
const deletedMessages = new Map<string, SnipedMessage[]>();

export function handleDeletedMessage(message: Message): void {
  if (!message.guild) return;
  if (message.author?.bot) return;

  const content = message.content?.trim() || "*Aucun texte*";
  const attachments = [...message.attachments.values()].map((a) => a.url);

  if (content === "*Aucun texte*" && attachments.length === 0) return;

  const history = deletedMessages.get(message.channelId) ?? [];

  history.unshift({
    authorId: message.author?.id ?? "inconnu",
    authorTag: message.author?.tag ?? "Utilisateur inconnu",
    content,
    attachments,
    deletedAt: Date.now(),
  });

  if (history.length > MAX_SNIPE_MESSAGES) {
    history.splice(MAX_SNIPE_MESSAGES);
  }

  deletedMessages.set(message.channelId, history);
}

function makeEmbed(entry: SnipedMessage, index?: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle(
      index
        ? `✦ Chichi • Message supprimé #${index}`
        : "✦ Chichi • Dernier message supprimé",
    )
    .setDescription(entry.content.slice(0, 4000))
    .addFields(
      {
        name: "Auteur",
        value: `<@${entry.authorId}>\n\`${entry.authorTag}\``,
        inline: true,
      },
      {
        name: "Supprimé",
        value: `<t:${Math.floor(entry.deletedAt / 1000)}:R>`,
        inline: true,
      },
    )
    .setTimestamp(entry.deletedAt);

  if (entry.attachments.length > 0) {
    embed.addFields({
      name: "Pièces jointes",
      value: entry.attachments
        .map((url, i) => `[Fichier ${i + 1}](${url})`)
        .join("\n")
        .slice(0, 1024),
    });

    const firstImage = entry.attachments.find((url) =>
      /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url),
    );

    if (firstImage) embed.setImage(firstImage);
  }

  return embed;
}

export const chichiCommand: Command = {
  name: "chichi",
  description: "Affiche les derniers messages supprimés",
  usage: "*chichi snipe | *chichi isnipe | *chichi clearsnipe",

  execute: async (message, args) => {
    if (!message.guild || !message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const action = args.join("").toLowerCase().replace(/\s+/g, "");
    const history = deletedMessages.get(message.channelId) ?? [];

    if (action === "clearsnipe") {
      deletedMessages.delete(message.channelId);

      const confirmation = await message.reply(
        "✅ Historique des messages supprimés effacé pour ce salon.",
      );

      setTimeout(() => {
        message.delete().catch(() => {});
        confirmation.delete().catch(() => {});
      }, 4000);

      return;
    }

    if (action === "snipe") {
      const latest = history[0];

      if (!latest) {
        await message.reply("❌ Aucun message supprimé enregistré dans ce salon.");
        return;
      }

      await message.reply({
        embeds: [makeEmbed(latest)],
        allowedMentions: { parse: [], repliedUser: false },
      });

      return;
    }

    if (action === "isnipe") {
      if (history.length === 0) {
        await message.reply("❌ Aucun message supprimé enregistré dans ce salon.");
        return;
      }

      await message.reply({
        embeds: history.slice(0, MAX_SNIPE_MESSAGES).map((entry, i) =>
          makeEmbed(entry, i + 1),
        ),
        allowedMentions: { parse: [], repliedUser: false },
      });

      return;
    }

    await message.reply(
      "❌ Utilisation : `*chichi snipe`, `*chichi isnipe`, `*chichi clearsnipe` ou `*chichi clear snipe`.",
    );
  },
};
