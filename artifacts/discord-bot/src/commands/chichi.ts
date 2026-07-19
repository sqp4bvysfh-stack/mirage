import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  type Collection,
  type Interaction,
  type Message,
  type PartialMessage,
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

type SnipePanelSession = {
  userId: string;
  channelId: string;
  entries: SnipedMessage[];
  index: number;
  expiresAt: number;
};

const snipePanels = new Map<string, SnipePanelSession>();
const SNIPE_PANEL_DURATION = 5 * 60 * 1000;

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

function makeNavigationRow(
  sessionId: string,
  index: number,
  total: number,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`snipe_prev_${sessionId}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index <= 0),

    new ButtonBuilder()
      .setCustomId(`snipe_page_${sessionId}`)
      .setLabel(`${index + 1}/${total}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`snipe_next_${sessionId}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index >= total - 1),
  );
}

export async function handleSnipeInteraction(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("snipe_")) return;

  const parts = interaction.customId.split("_");
  const action = parts[1];
  const sessionId = parts.slice(2).join("_");

  if (action === "page") {
    await interaction.deferUpdate().catch(() => {});
    return;
  }

  const session = snipePanels.get(sessionId);

  if (!session || session.expiresAt < Date.now()) {
    snipePanels.delete(sessionId);

    await interaction.reply({
      content: "❌ Ce panneau a expiré. Relance `*is`.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (interaction.user.id !== session.userId) {
    await interaction.reply({
      content: "❌ Seule la personne qui a lancé la commande peut utiliser ces boutons.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (action === "prev") {
    session.index = Math.max(0, session.index - 1);
  }

  if (action === "next") {
    session.index = Math.min(
      session.entries.length - 1,
      session.index + 1,
    );
  }

  snipePanels.set(sessionId, session);

  await interaction.update({
    embeds: [
      makeEmbed(
        session.entries[session.index],
        session.index + 1,
      ),
    ],
    components: [
      makeNavigationRow(
        sessionId,
        session.index,
        session.entries.length,
      ),
    ],
    allowedMentions: {
      parse: [],
      repliedUser: false,
    },
  });
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

      const entries = history.slice(
        0,
        MAX_SNIPE_MESSAGES,
      );

      const sessionId = `${message.id}_${Date.now()}`;

      snipePanels.set(sessionId, {
        userId: message.author.id,
        channelId: message.channelId,
        entries,
        index: 0,
        expiresAt: Date.now() + SNIPE_PANEL_DURATION,
      });

      const panel = await message.reply({
        embeds: [
          makeEmbed(entries[0], 1),
        ],
        components: [
          makeNavigationRow(
            sessionId,
            0,
            entries.length,
          ),
        ],
        allowedMentions: {
          parse: [],
          repliedUser: false,
        },
      });

      setTimeout(async () => {
        snipePanels.delete(sessionId);

        await panel.edit({
          components: [],
        }).catch(() => {});
      }, SNIPE_PANEL_DURATION);

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
