import {
  EmbedBuilder,
  type GuildMember,
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
    if (!existsSync(MEDIA_FILE)) return;

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
  if (!message.guild) return null;

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

  return null;
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

  const embeds = [
    new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle(
        `✦ Photo de profil serveur • ${user.username}`,
      )
      .setImage(serverAvatar),

    new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle(
        `✦ Photo de profil générale • ${user.username}`,
      )
      .setImage(globalAvatar),
  ];

  await message.reply({
    embeds,
    allowedMentions: {
      parse: [],
      repliedUser: false,
    },
  });
}

async function sendBanners(
  message: Message,
  member: GuildMember,
  user: User,
): Promise<void> {
  const embeds: EmbedBuilder[] = [];

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
    embeds.push(
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          `✦ Bannière serveur • ${user.username}`,
        )
        .setImage(serverBanner),
    );
  }

  if (globalBanner) {
    embeds.push(
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          `✦ Bannière générale • ${user.username}`,
        )
        .setImage(globalBanner),
    );
  }

  if (embeds.length === 0) {
    await message.reply(
      `❌ ${user.username} ne possède aucune bannière.`,
    );
    return;
  }

  await message.reply({
    embeds,
    allowedMentions: {
      parse: [],
      repliedUser: false,
    },
  });
}

/**
 * Détecte automatiquement :
 * - chichi pp @membre
 * - chichi banner @membre
 * - chichi pp en réponse à un message
 * - chichi banner en réponse à un message
 *
 * Le préfixe * est accepté mais n’est pas obligatoire.
 */
export async function handleChichiMediaMessage(
  message: Message,
): Promise<boolean> {
  if (!message.guild) return false;
  if (message.author.bot) return false;

  const normalized =
    message.content
      .trim()
      .toLowerCase()
      .replace(/^\*/, "");

  const match =
    normalized.match(
      /^chichi\s+(pp|banner|banniere)\b/,
    );

  if (!match) return false;

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
      "❌ Mentionne un membre ou réponds à son message.",
    );

    return true;
  }

  const action =
    match[1];

  if (action === "pp") {
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
