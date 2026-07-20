import {
  EmbedBuilder,
  type Message,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
} from "discord.js";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { join } from "node:path";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

type OrigineEntry = {
  emoji: string;
  roleId: string;
};

type OriginesStore =
  Record<string, OrigineEntry[]>;

const ORIGINES_CHANNEL_ID =
  "1528124060083687616";

const PANEL_TITLE =
  "✦ No Chill • Origines";

const ORIGINES_FILE = (() => {
  try {
    if (!existsSync("/data")) {
      mkdirSync("/data", {
        recursive: true,
      });
    }

    return "/data/origines-panels.json";
  } catch {
    return join(
      process.cwd(),
      "origines-panels.json",
    );
  }
})();

// Map : ID du message panel → configuration.
export const originesPanels =
  new Map<string, OrigineEntry[]>();

function loadOriginesPanels(): void {
  try {
    if (!existsSync(ORIGINES_FILE)) {
      return;
    }

    const parsed = JSON.parse(
      readFileSync(
        ORIGINES_FILE,
        "utf-8",
      ),
    ) as OriginesStore;

    for (
      const [panelId, config]
      of Object.entries(parsed)
    ) {
      if (!Array.isArray(config)) {
        continue;
      }

      originesPanels.set(
        panelId,
        config,
      );
    }
  } catch (error) {
    console.error(
      "❌ Impossible de charger les panels d’origines :",
      error,
    );
  }
}

function saveOriginesPanels(): void {
  const data: OriginesStore = {};

  for (
    const [panelId, config]
    of originesPanels
  ) {
    data[panelId] = config;
  }

  try {
    writeFileSync(
      ORIGINES_FILE,
      JSON.stringify(
        data,
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    console.error(
      "❌ Impossible de sauvegarder les panels d’origines :",
      error,
    );
  }
}

loadOriginesPanels();

function buildEmbed(
  config: OrigineEntry[],
): EmbedBuilder {
  const lines = config
    .map(
      (entry) =>
        `${entry.emoji}  →  <@&${entry.roleId}>`,
    )
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle(PANEL_TITLE)
    .setDescription(
      "Réagis avec le drapeau de ton pays pour obtenir le rôle correspondant.\n" +
      "Retire ta réaction pour enlever le rôle.\n\n" +
      lines,
    )
    .setFooter({
      text:
        "Un seul rôle à la fois recommandé.",
    });
}

/**
 * Reconstruit la configuration à partir de l’embed.
 * Format attendu : emoji → <@&ROLE_ID>
 */
function recoverConfigFromMessage(
  reaction:
    | MessageReaction
    | PartialMessageReaction,
): OrigineEntry[] | null {
  const message =
    reaction.message;

  const embed =
    message.embeds[0];

  if (
    !embed ||
    embed.title !== PANEL_TITLE ||
    !embed.description
  ) {
    return null;
  }

  const recovered: OrigineEntry[] = [];

  for (
    const line
    of embed.description.split("\n")
  ) {
    const match = line.match(
      /^(.+?)\s*→\s*<@&(\d{17,20})>$/,
    );

    if (!match) continue;

    const emoji =
      match[1].trim();

    const roleId =
      match[2];

    if (
      !emoji ||
      !roleId
    ) {
      continue;
    }

    recovered.push({
      emoji,
      roleId,
    });
  }

  if (
    recovered.length === 0
  ) {
    return null;
  }

  originesPanels.set(
    message.id,
    recovered,
  );

  saveOriginesPanels();

  return recovered;
}

function getPanelConfig(
  reaction:
    | MessageReaction
    | PartialMessageReaction,
): OrigineEntry[] | null {
  return (
    originesPanels.get(
      reaction.message.id,
    ) ??
    recoverConfigFromMessage(
      reaction,
    )
  );
}

async function resolveReaction(
  reaction:
    | MessageReaction
    | PartialMessageReaction,
): Promise<MessageReaction> {
  if (reaction.partial) {
    await reaction.fetch();
  }

  if (
    reaction.message.partial
  ) {
    await reaction.message.fetch();
  }

  return reaction as MessageReaction;
}

export async function handleOriginesReactionAdd(
  reaction:
    | MessageReaction
    | PartialMessageReaction,
  user: User,
): Promise<void> {
  if (user.bot) return;

  try {
    reaction =
      await resolveReaction(
        reaction,
      );
  } catch {
    return;
  }

  const guild =
    reaction.message.guild;

  if (!guild) return;

  const config =
    getPanelConfig(reaction);

  if (!config) return;

  const emoji =
    reaction.emoji.name;

  if (!emoji) return;

  const selected =
    config.find(
      (entry) =>
        entry.emoji === emoji,
    );

  if (!selected) return;

  const member =
    await guild.members
      .fetch(user.id)
      .catch(() => null);

  if (!member) return;

  if (
    !member.roles.cache.has(
      selected.roleId,
    )
  ) {
    await member.roles
      .add(
        selected.roleId,
        `Origine sélectionnée : ${emoji}`,
      )
      .catch((error) => {
        console.error(
          `❌ Impossible d’ajouter le rôle origine ${selected.roleId}:`,
          error,
        );
      });
  }
}

export async function handleOriginesReactionRemove(
  reaction:
    | MessageReaction
    | PartialMessageReaction,
  user: User,
): Promise<void> {
  if (user.bot) return;

  try {
    reaction =
      await resolveReaction(
        reaction,
      );
  } catch {
    return;
  }

  const guild =
    reaction.message.guild;

  if (!guild) return;

  const config =
    getPanelConfig(reaction);

  if (!config) return;

  const emoji =
    reaction.emoji.name;

  if (!emoji) return;

  const selected =
    config.find(
      (entry) =>
        entry.emoji === emoji,
    );

  if (!selected) return;

  const member =
    await guild.members
      .fetch(user.id)
      .catch(() => null);

  if (!member) return;

  if (
    member.roles.cache.has(
      selected.roleId,
    )
  ) {
    await member.roles
      .remove(
        selected.roleId,
        `Origine retirée : ${emoji}`,
      )
      .catch((error) => {
        console.error(
          `❌ Impossible de retirer le rôle origine ${selected.roleId}:`,
          error,
        );
      });
  }
}

async function awaitReply(
  message: Message,
  prompt: Message,
): Promise<Message | null> {
  try {
    const collected =
      await message.channel.awaitMessages({
        filter:
          (candidate) =>
            candidate.author.id ===
            message.author.id,
        max: 1,
        time: 60_000,
        errors: ["time"],
      });

    return (
      collected.first() ??
      null
    );
  } catch {
    await prompt
      .delete()
      .catch(() => {});

    await message.reply(
      "⏰ Temps écoulé.",
    );

    return null;
  }
}

async function findPanelConfigById(
  message: Message,
  panelId: string,
): Promise<OrigineEntry[] | null> {
  const known =
    originesPanels.get(
      panelId,
    );

  if (known) return known;

  const targetChannel =
    message.guild?.channels.cache.get(
      ORIGINES_CHANNEL_ID,
    );

  if (
    !targetChannel ||
    !targetChannel.isTextBased()
  ) {
    return null;
  }

  const panelMessage =
    await targetChannel.messages
      .fetch(panelId)
      .catch(() => null);

  if (!panelMessage) {
    return null;
  }

  const fakeReaction = {
    message: panelMessage,
  } as MessageReaction;

  return recoverConfigFromMessage(
    fakeReaction,
  );
}

export const originesCommand: Command = {
  name: "setup",
  description:
    "Gère les panneaux d’origines",
  usage:
    "*setup origines | *setup origines edit <ID>",

  execute: async (
    message,
    args,
  ) => {
    if (
      !message.guild ||
      !message.member ||
      !isModerator(
        message.member,
      )
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    if (
      args[0]?.toLowerCase() !==
      "origines"
    ) {
      await message.reply(
        "❌ Utilise `*setup origines` ou `*setup origines edit <ID>`.",
      );
      return;
    }

    if (
      args[1]?.toLowerCase() ===
      "edit"
    ) {
      const panelId =
        args[2];

      if (!panelId) {
        await message.reply(
          "❌ Donne l’ID du message panel.",
        );
        return;
      }

      const existing =
        await findPanelConfigById(
          message,
          panelId,
        );

      if (!existing) {
        await message.reply(
          "❌ Panel introuvable. Vérifie l’ID du message.",
        );
        return;
      }

      const slots =
        20 -
        existing.length;

      if (slots <= 0) {
        await message.reply(
          "❌ Ce panel contient déjà 20 origines.",
        );
        return;
      }

      const targetChannel =
        message.guild.channels.cache.get(
          ORIGINES_CHANNEL_ID,
        );

      if (
        !targetChannel ||
        !targetChannel.isTextBased()
      ) {
        await message.reply(
          "❌ Le salon Origines configuré est introuvable.",
        );
        return;
      }

      const panelMessage =
        await targetChannel.messages
          .fetch(panelId)
          .catch(() => null);

      if (!panelMessage) {
        await message.reply(
          "❌ Impossible de récupérer le panneau.",
        );
        return;
      }

      const prompt =
        await message.channel.send(
          "✏️ **Modifier le panel**\n\n" +
          `Il contient déjà **${existing.length}/20** origines. ` +
          `Tu peux en ajouter **${slots}**.\n\n` +
          "Mentionne les nouveaux rôles.\n" +
          "*Tape `annuler` pour quitter.*",
        );

      const reply =
        await awaitReply(
          message,
          prompt,
        );

      if (!reply) return;

      await reply
        .delete()
        .catch(() => {});

      await prompt
        .delete()
        .catch(() => {});

      if (
        reply.content
          .toLowerCase()
          .trim() ===
        "annuler"
      ) {
        await message.reply(
          "❌ Modification annulée.",
        );
        return;
      }

      const newRoles = [
        ...reply.mentions.roles.values(),
      ].slice(0, slots);

      if (
        newRoles.length === 0
      ) {
        await message.reply(
          "❌ Aucun rôle détecté.",
        );
        return;
      }

      const existingIds =
        new Set(
          existing.map(
            (entry) =>
              entry.roleId,
          ),
        );

      const toAdd =
        newRoles
          .filter(
            (role) =>
              !existingIds.has(
                role.id,
              ),
          )
          .map(
            (role) => ({
              emoji: role.name,
              roleId: role.id,
            }),
          );

      if (
        toAdd.length === 0
      ) {
        await message.reply(
          "❌ Ces origines sont déjà présentes.",
        );
        return;
      }

      const updated = [
        ...existing,
        ...toAdd,
      ];

      originesPanels.set(
        panelId,
        updated,
      );

      saveOriginesPanels();

      await panelMessage.edit({
        embeds: [
          buildEmbed(updated),
        ],
      });

      for (
        const { emoji }
        of toAdd
      ) {
        await panelMessage
          .react(emoji)
          .catch(() => {});
      }

      await message.reply(
        `✅ ${toAdd.length} origine(s) ajoutée(s). (${updated.length}/20)`,
      );

      return;
    }

    const prompt =
      await message.channel.send(
        "🌍 **Setup Origines**\n\n" +
        "Mentionne les rôles d’origine à inclure dans ce panel, maximum 20.\n" +
        "Exemple : `@🇫🇷 @🇲🇦 @🇩🇿`\n\n" +
        "*Tape `annuler` pour quitter.*",
      );

    const reply =
      await awaitReply(
        message,
        prompt,
      );

    if (!reply) return;

    await reply
      .delete()
      .catch(() => {});

    await prompt
      .delete()
      .catch(() => {});

    if (
      reply.content
        .toLowerCase()
        .trim() ===
      "annuler"
    ) {
      await message.reply(
        "❌ Setup annulé.",
      );
      return;
    }

    const roles = [
      ...reply.mentions.roles.values(),
    ].slice(0, 20);

    if (
      roles.length === 0
    ) {
      await message.reply(
        "❌ Aucun rôle détecté.",
      );
      return;
    }

    const config =
      roles.map(
        (role) => ({
          emoji: role.name,
          roleId: role.id,
        }),
      );

    const targetChannel =
      message.guild.channels.cache.get(
        ORIGINES_CHANNEL_ID,
      );

    if (
      !targetChannel ||
      !targetChannel.isTextBased()
    ) {
      await message.reply(
        "❌ Le salon Origines configuré est introuvable.",
      );
      return;
    }

    const panel =
      await targetChannel.send({
        embeds: [
          buildEmbed(config),
        ],
      });

    originesPanels.set(
      panel.id,
      config,
    );

    saveOriginesPanels();

    for (
      const { emoji }
      of config
    ) {
      await panel
        .react(emoji)
        .catch(() => {});
    }

    await message.reply(
      `✅ Panel créé avec **${roles.length} origines**.\n` +
      `Pour le modifier : \`*setup origines edit ${panel.id}\``,
    );
  },
};
