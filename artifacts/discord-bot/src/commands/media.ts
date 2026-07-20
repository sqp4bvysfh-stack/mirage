import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  type GuildMember,
  type Interaction,
  type Message,
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

type MediaConfig = {
  blockedGuilds: string[];
};

type MediaPage = {
  title: string;
  imageUrl: string;
};

type MediaSession = {
  userId: string;
  pages: MediaPage[];
  index: number;
  expiresAt: number;
};

const MEDIA_PANEL_DURATION =
  5 * 60 * 1000;

const mediaSessions =
  new Map<string, MediaSession>();

const MEDIA_FILE = (() => {
  try {
    if (!existsSync("/data")) {
      mkdirSync("/data", {
        recursive: true,
      });
    }

    return "/data/chichi-media.json";
  } catch {
    return join(
      process.cwd(),
      "chichi-media.json",
    );
  }
})();

let mediaConfig: MediaConfig = {
  blockedGuilds: [],
};

function loadMediaConfig(): void {
  try {
    if (!existsSync(MEDIA_FILE)) {
      return;
    }

    const parsed = JSON.parse(
      readFileSync(
        MEDIA_FILE,
        "utf-8",
      ),
    ) as MediaConfig;

    if (
      Array.isArray(
        parsed.blockedGuilds,
      )
    ) {
      mediaConfig = parsed;
    }
  } catch (error) {
    console.error(
      "❌ Impossible de charger chichi-media.json :",
      error,
    );
  }
}

function saveMediaConfig(): void {
  try {
    writeFileSync(
      MEDIA_FILE,
      JSON.stringify(
        mediaConfig,
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    console.error(
      "❌ Impossible de sauvegarder chichi-media.json :",
      error,
    );
  }
}

loadMediaConfig();

function isMediaBlocked(
  guildId: string,
): boolean {
  return mediaConfig
    .blockedGuilds
    .includes(guildId);
}

async function fetchFullUser(
  message: Message,
  member: GuildMember,
): Promise<User> {
  return message.client.users
    .fetch(
      member.id,
      {
        force: true,
      },
    )
    .catch(
      () => member.user,
    );
}

async function resolveTarget(
  message: Message,
): Promise<{
  member: GuildMember;
  user: User;
} | null> {
  if (!message.guild) {
    return null;
  }

  const mentioned =
    message.mentions.members?.first();

  if (mentioned) {
    return {
      member: mentioned,
      user: await fetchFullUser(
        message,
        mentioned,
      ),
    };
  }

  const referenceId =
    message.reference?.messageId;

  if (referenceId) {
    const referencedMessage =
      await message.channel.messages
        .fetch(referenceId)
        .catch(() => null);

    if (referencedMessage) {
      const member =
        await message.guild.members
          .fetch(
            referencedMessage.author.id,
          )
          .catch(() => null);

      if (member) {
        return {
          member,
          user: await fetchFullUser(
            message,
            member,
          ),
        };
      }
    }
  }

  // Sans mention ni réponse :
  // affiche le profil de l’auteur de la commande.
  const authorMember =
    await message.guild.members
      .fetch(
        message.author.id,
      )
      .catch(() => null);

  if (!authorMember) {
    return null;
  }

  return {
    member: authorMember,
    user: await fetchFullUser(
      message,
      authorMember,
    ),
  };
}

function buildMediaEmbed(
  page: MediaPage,
  index: number,
  total: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle(page.title)
    .setImage(page.imageUrl)
    .setFooter({
      text:
        `${index + 1}/${total}`,
    });
}

function buildMediaRow(
  sessionId: string,
  index: number,
  total: number,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          `media_prev_${sessionId}`,
        )
        .setEmoji("⬅️")
        .setStyle(
          ButtonStyle.Secondary,
        )
        .setDisabled(
          index <= 0,
        ),

      new ButtonBuilder()
        .setCustomId(
          `media_page_${sessionId}`,
        )
        .setLabel(
          `${index + 1}/${total}`,
        )
        .setStyle(
          ButtonStyle.Secondary,
        )
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId(
          `media_next_${sessionId}`,
        )
        .setEmoji("➡️")
        .setStyle(
          ButtonStyle.Secondary,
        )
        .setDisabled(
          index >= total - 1,
        ),
    );
}

async function sendMediaPanel(
  message: Message,
  pages: MediaPage[],
): Promise<void> {
  if (pages.length === 0) {
    return;
  }

  const sessionId =
    `${message.id}_${Date.now()}`;

  mediaSessions.set(
    sessionId,
    {
      userId:
        message.author.id,

      pages,

      index: 0,

      expiresAt:
        Date.now() +
        MEDIA_PANEL_DURATION,
    },
  );

  const panel =
    await message.reply({
      embeds: [
        buildMediaEmbed(
          pages[0],
          0,
          pages.length,
        ),
      ],

      components:
        pages.length > 1
          ? [
              buildMediaRow(
                sessionId,
                0,
                pages.length,
              ),
            ]
          : [],

      allowedMentions: {
        parse: [],
        repliedUser: false,
      },
    });

  setTimeout(async () => {
    mediaSessions.delete(
      sessionId,
    );

    await panel.edit({
      components: [],
    }).catch(() => {});
  }, MEDIA_PANEL_DURATION);
}

async function sendProfilePictures(
  message: Message,
  member: GuildMember,
  user: User,
): Promise<void> {
  const serverAvatar =
    member.displayAvatarURL({
      size: 4096,
      extension: "png",
    });

  const globalAvatar =
    user.displayAvatarURL({
      size: 4096,
      extension: "png",
    });

  await sendMediaPanel(
    message,
    [
      {
        title:
          `✦ Photo de profil serveur • ${user.username}`,
        imageUrl:
          serverAvatar,
      },
      {
        title:
          `✦ Photo de profil générale • ${user.username}`,
        imageUrl:
          globalAvatar,
      },
    ],
  );
}

async function sendBanners(
  message: Message,
  member: GuildMember,
  user: User,
): Promise<void> {
  const pages: MediaPage[] = [];

  const serverBanner =
    member.bannerURL({
      size: 4096,
      extension: "png",
    });

  const globalBanner =
    user.bannerURL({
      size: 4096,
      extension: "png",
    });

  if (serverBanner) {
    pages.push({
      title:
        `✦ Bannière serveur • ${user.username}`,
      imageUrl:
        serverBanner,
    });
  }

  if (globalBanner) {
    pages.push({
      title:
        `✦ Bannière générale • ${user.username}`,
      imageUrl:
        globalBanner,
    });
  }

  if (pages.length === 0) {
    await message.reply(
      `❌ ${user.username} ne possède aucune bannière.`,
    );
    return;
  }

  await sendMediaPanel(
    message,
    pages,
  );
}

export async function handleChichiMediaMessage(
  message: Message,
): Promise<boolean> {
  if (!message.guild) {
    return false;
  }

  if (message.author.bot) {
    return false;
  }

  const normalized =
    message.content
      .trim()
      .toLowerCase()
      .replace(/^\*/, "");

  const match =
    normalized.match(
      /^chichi\s+(pp|banner|banniere)\b/,
    );

  if (!match) {
    return false;
  }

  if (
    isMediaBlocked(
      message.guild.id,
    )
  ) {
    await message.reply(
      "❌ `chichi pp` et `chichi banner` sont désactivés sur ce serveur.",
    );

    return true;
  }

  const target =
    await resolveTarget(message);

  if (!target) {
    await message.reply(
      "❌ Impossible de retrouver ce membre.",
    );

    return true;
  }

  if (match[1] === "pp") {
    await sendProfilePictures(
      message,
      target.member,
      target.user,
    );

    return true;
  }

  await sendBanners(
    message,
    target.member,
    target.user,
  );

  return true;
}

export async function handleMediaInteraction(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isButton()) {
    return;
  }

  if (
    !interaction.customId
      .startsWith("media_")
  ) {
    return;
  }

  const parts =
    interaction.customId.split("_");

  const action =
    parts[1];

  const sessionId =
    parts.slice(2).join("_");

  if (action === "page") {
    await interaction
      .deferUpdate()
      .catch(() => {});

    return;
  }

  const session =
    mediaSessions.get(
      sessionId,
    );

  if (
    !session ||
    session.expiresAt <
      Date.now()
  ) {
    mediaSessions.delete(
      sessionId,
    );

    await interaction.reply({
      content:
        "❌ Ce panneau a expiré. Relance la commande.",

      flags:
        MessageFlags.Ephemeral,
    });

    return;
  }

  if (
    interaction.user.id !==
    session.userId
  ) {
    await interaction.reply({
      content:
        "❌ Seule la personne qui a lancé la commande peut utiliser ces boutons.",

      flags:
        MessageFlags.Ephemeral,
    });

    return;
  }

  if (action === "prev") {
    session.index =
      Math.max(
        0,
        session.index - 1,
      );
  }

  if (action === "next") {
    session.index =
      Math.min(
        session.pages.length - 1,
        session.index + 1,
      );
  }

  mediaSessions.set(
    sessionId,
    session,
  );

  await interaction.update({
    embeds: [
      buildMediaEmbed(
        session.pages[
          session.index
        ],
        session.index,
        session.pages.length,
      ),
    ],

    components: [
      buildMediaRow(
        sessionId,
        session.index,
        session.pages.length,
      ),
    ],

    allowedMentions: {
      parse: [],
      repliedUser: false,
    },
  });
}

export const ppCommand: Command = {
  name: "pp",
  description:
    "Active ou désactive Chichi PP et Chichi Banner",
  usage:
    "*pp block | *pp unblock",

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

    const action =
      (args[0] ?? "")
        .toLowerCase()
        .trim();

    if (action === "block") {
      if (
        isMediaBlocked(
          message.guild.id,
        )
      ) {
        await message.reply(
          "⚠️ Chichi PP et Chichi Banner sont déjà désactivés.",
        );
        return;
      }

      mediaConfig
        .blockedGuilds
        .push(
          message.guild.id,
        );

      saveMediaConfig();

      await message.reply(
        "✅ `chichi pp` et `chichi banner` sont désactivés.",
      );

      return;
    }

    if (action === "unblock") {
      if (
        !isMediaBlocked(
          message.guild.id,
        )
      ) {
        await message.reply(
          "⚠️ Chichi PP et Chichi Banner sont déjà activés.",
        );
        return;
      }

      mediaConfig.blockedGuilds =
        mediaConfig
          .blockedGuilds
          .filter(
            (guildId) =>
              guildId !==
              message.guild!.id,
          );

      saveMediaConfig();

      await message.reply(
        "✅ `chichi pp` et `chichi banner` sont réactivés.",
      );

      return;
    }

    await message.reply(
      "❌ Utilisation : `*pp block` ou `*pp unblock`.",
    );
  },
};
