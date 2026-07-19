import {
  EmbedBuilder,
  type Message,
  type PartialMessage,
  type Collection,
  type Snowflake,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

type SnipedMessage = {
  messageId: string;
  authorId: string;
  authorTag: string;
  content: string;
  attachments: string[];
  deletedAt: number;
};

type CachedMessage = {
  messageId: string;
  channelId: string;
  authorId: string;
  authorTag: string;
  content: string;
  attachments: string[];
};

const MAX_SNIPE_MESSAGES = 10;
const MAX_CACHED_MESSAGES = 1000;

const deletedMessages = new Map<string, SnipedMessage[]>();
const messageCache = new Map<string, CachedMessage>();

export function cacheMessageForSnipe(message: Message): void {
  if (!message.guild) return;
  if (message.author.bot) return;

  const attachments = [...message.attachments.values()]
    .map((attachment) => attachment.url);

  messageCache.set(message.id, {
    messageId: message.id,
    channelId: message.channelId,
    authorId: message.author.id,
    authorTag: message.author.tag,
    content: message.content?.trim() || "*Aucun texte*",
    attachments,
  });

  if (messageCache.size > MAX_CACHED_MESSAGES) {
    const oldestKey = messageCache.keys().next().value;

    if (oldestKey) {
      messageCache.delete(oldestKey);
    }
  }
}

function registerDeletedMessage(
  message: Message | PartialMessage,
): void {
  if (!message.guild) return;

  const cached = messageCache.get(message.id);

  const authorId =
    cached?.authorId ??
    message.author?.id;

  const authorTag =
    cached?.authorTag ??
    message.author?.tag;

  if (!authorId || !authorTag) return;
  if (message.author?.bot) return;

  const content =
    cached?.content ??
    message.content?.trim() ??
    "*Aucun texte*";

  const attachments =
    cached?.attachments ??
    [...message.attachments.values()]
      .map((attachment) => attachment.url);

  if (
    content === "*Aucun texte*" &&
    attachments.length === 0
  ) {
    return;
  }

  const channelId =
    cached?.channelId ??
    message.channelId;

  const history =
    deletedMessages.get(channelId) ?? [];

  history.unshift({
    messageId: message.id,
    authorId,
    authorTag,
    content,
    attachments,
    deletedAt: Date.now(),
  });

  if (history.length > MAX_SNIPE_MESSAGES) {
    history.splice(MAX_SNIPE_MESSAGES);
  }

  deletedMessages.set(channelId, history);
  messageCache.delete(message.id);
}

export function handleDeletedMessage(
  message: Message | PartialMessage,
): void {
  registerDeletedMessage(message);
}

export function handleBulkDeletedMessages(
  messages: Collection<Snowflake, Message | PartialMessage>,
): void {
  const ordered = [...messages.values()]
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

  for (const message of ordered) {
    registerDeletedMessage(message);
  }
}

function makeEmbed(
  entry: SnipedMessage,
  index?: number,
): EmbedBuilder {
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
        .map((url, index) => `[Fichier ${index + 1}](${url})`)
        .join("\n")
        .slice(0, 1024),
    });

    const image = entry.attachments.find((url) =>
      /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url),
    );

    if (image) {
      embed.setImage(image);
    }
  }

  return embed;
}

export const chichiCommand: Command = {
  name: "chichi",
  description: "Affiche les derniers messages supprimés",
  usage:
    "*chichi snipe | *chichi isnipe | *chichi clearsnipe",

  execute: async (message, args) => {
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

    const action = args
      .join("")
      .toLowerCase()
      .replace(/\s+/g, "");

    const history =
      deletedMessages.get(message.channelId) ?? [];

    if (
      action === "clearsnipe" ||
      action === "sclearsnipe"
    ) {
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

    if (
      action === "snipe" ||
      action === "s"
    ) {
      const latest = history[0];

      if (!latest) {
        await message.reply(
          "❌ Aucun message supprimé enregistré dans ce salon.",
        );
        return;
      }

      await message.reply({
        embeds: [makeEmbed(latest)],
        allowedMentions: {
          parse: [],
          repliedUser: false,
        },
      });

      return;
    }

    if (
      action === "isnipe" ||
      action === "is"
    ) {
      if (history.length === 0) {
        await message.reply(
          "❌ Aucun message supprimé enregistré dans ce salon.",
        );
        return;
      }

      await message.reply({
        embeds: history
          .slice(0, MAX_SNIPE_MESSAGES)
          .map((entry, index) =>
            makeEmbed(entry, index + 1),
          ),
        allowedMentions: {
          parse: [],
          repliedUser: false,
        },
      });

      return;
    }

    await message.reply(
      "❌ Utilisation : `*chichi snipe`, `*chichi isnipe`, `*chichi clearsnipe`, `*chichi clear snipe`, `*s`, `*is` ou `*sclearsnipe`.",
    );
  },
};

export const sCommand: Command = {
  name: "s",
  description: "Affiche le dernier message supprimé",
  usage: "*s",

  execute: async (message) => {
    await chichiCommand.execute(message, ["snipe"]);
  },
};

export const isCommand: Command = {
  name: "is",
  description: "Affiche les 10 derniers messages supprimés",
  usage: "*is",

  execute: async (message) => {
    await chichiCommand.execute(message, ["isnipe"]);
  },
};

export const sclearsnipeCommand: Command = {
  name: "sclearsnipe",
  description: "Efface l’historique des messages supprimés",
  usage: "*sclearsnipe",

  execute: async (message) => {
    await chichiCommand.execute(message, ["clearsnipe"]);
  },
};
