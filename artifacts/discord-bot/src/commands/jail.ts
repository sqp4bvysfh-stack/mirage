import {
  ChannelType,
  EmbedBuilder,
  type GuildMember,
  type Role,
} from "discord.js";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { join } from "node:path";

import type { Command } from "../types.js";
import { sendServerLog } from "../utils/logs.js";

import {
  canActOn,
  isModerator,
  JAIL_ROLE_ID,
} from "../utils/modCheck.js";

const PRISON_TEXT_CHANNEL_ID =
  "1528120878368559208";

const PRISON_VOICE_CHANNEL_ID =
  "1528120807396474930";

interface JailRecord {
  roles: string[];
  moderatorId: string;
  reason: string;
  jailedAt: number;
}

type JailStore =
  Record<string, JailRecord>;

const JAIL_FILE = (() => {
  try {
    if (!existsSync("/data")) {
      mkdirSync("/data", {
        recursive: true,
      });
    }

    return "/data/jail-records.json";
  } catch {
    return join(
      process.cwd(),
      "jail-records.json",
    );
  }
})();

let jailRecords: JailStore = {};

const jailLocks =
  new Set<string>();

const unjailLocks =
  new Set<string>();

const permissionsReadyGuilds =
  new Set<string>();

const permissionsPromises =
  new Map<string, Promise<void>>();

function loadJailRecords(): void {
  try {
    if (!existsSync(JAIL_FILE)) {
      return;
    }

    const parsed = JSON.parse(
      readFileSync(
        JAIL_FILE,
        "utf-8",
      ),
    ) as JailStore;

    jailRecords =
      parsed &&
      typeof parsed === "object"
        ? parsed
        : {};
  } catch (error) {
    console.error(
      "❌ Impossible de charger jail-records.json :",
      error,
    );

    jailRecords = {};
  }
}

function saveJailRecords(): void {
  try {
    writeFileSync(
      JAIL_FILE,
      JSON.stringify(
        jailRecords,
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    console.error(
      "❌ Impossible de sauvegarder jail-records.json :",
      error,
    );
  }
}

loadJailRecords();

async function getTarget(
  message: any,
  rawId?: string,
): Promise<GuildMember | null> {
  const mentioned =
    message.mentions.members?.first();

  if (mentioned) {
    return mentioned;
  }

  if (message.reference?.messageId) {
    const referenced =
      await message.channel.messages
        .fetch(
          message.reference.messageId,
        )
        .catch(() => null);

    if (referenced) {
      return message.guild.members
        .fetch(
          referenced.author.id,
        )
        .catch(() => null);
    }
  }

  const userId =
    rawId?.replace(
      /[<@!>]/g,
      "",
    );

  if (!userId) {
    return null;
  }

  return message.guild.members
    .fetch(userId)
    .catch(() => null);
}

function getRestorableRoles(
  member: GuildMember,
): Role[] {
  const botMember =
    member.guild.members.me;

  if (!botMember) {
    return [];
  }

  return member.roles.cache
    .filter(
      (role) =>
        role.id !==
          member.guild.id &&
        role.id !==
          JAIL_ROLE_ID &&
        !role.managed &&
        role.position <
          botMember.roles.highest
            .position,
    )
    .sort(
      (a, b) =>
        b.position -
        a.position,
    )
    .map(
      (role) => role,
    );
}

function findPrisonTextChannel(
  guild: GuildMember["guild"],
) {
  const configured =
    guild.channels.cache.get(
      PRISON_TEXT_CHANNEL_ID,
    );

  if (
    configured?.type ===
    ChannelType.GuildText
  ) {
    return configured;
  }

  return guild.channels.cache.find(
    (channel) =>
      channel.type ===
        ChannelType.GuildText &&
      channel.name
        .toLowerCase()
        .includes("prison"),
  );
}

function findPrisonVoiceChannel(
  guild: GuildMember["guild"],
) {
  const configured =
    guild.channels.cache.get(
      PRISON_VOICE_CHANNEL_ID,
    );

  if (
    configured?.type ===
    ChannelType.GuildVoice
  ) {
    return configured;
  }

  return guild.channels.cache.find(
    (channel) =>
      channel.type ===
        ChannelType.GuildVoice &&
      channel.name
        .toLowerCase()
        .includes("prison"),
  );
}

async function configureJailPermissions(
  guild: GuildMember["guild"],
): Promise<void> {
  if (
    permissionsReadyGuilds.has(
      guild.id,
    )
  ) {
    return;
  }

  const existingPromise =
    permissionsPromises.get(
      guild.id,
    );

  if (existingPromise) {
    await existingPromise;
    return;
  }

  const setupPromise = (async () => {
    const prisonText =
      findPrisonTextChannel(
        guild,
      );

    const prisonVoice =
      findPrisonVoiceChannel(
        guild,
      );

    const editableChannels = [
      ...guild.channels.cache.values(),
    ].filter(
      (channel) =>
        "permissionOverwrites"
          in channel,
    );

    await Promise.allSettled(
      editableChannels.map(
        async (channel) => {
          if (
            !(
              "permissionOverwrites"
              in channel
            )
          ) {
            return;
          }

          const isPrisonText =
            channel.id ===
            prisonText?.id;

          const isPrisonVoice =
            channel.id ===
            prisonVoice?.id;

          const isPrisonChannel =
            isPrisonText ||
            isPrisonVoice;

          await channel
            .permissionOverwrites
            .edit(
              JAIL_ROLE_ID,
              isPrisonChannel
                ? {
                    ViewChannel:
                      true,

                    SendMessages:
                      isPrisonText
                        ? true
                        : null,

                    Connect:
                      isPrisonVoice
                        ? true
                        : null,

                    Speak:
                      isPrisonVoice
                        ? true
                        : null,
                  }
                : {
                    ViewChannel:
                      false,
                  },
              {
                reason:
                  "Configuration des permissions Jail",
              },
            );
        },
      ),
    );

    permissionsReadyGuilds.add(
      guild.id,
    );
  })();

  permissionsPromises.set(
    guild.id,
    setupPromise,
  );

  try {
    await setupPromise;
  } finally {
    permissionsPromises.delete(
      guild.id,
    );
  }
}

export const jailCommand: Command = {
  name: "jail",
  description:
    "Met un membre en prison et sauvegarde ses rôles",
  usage:
    "*jail @membre [raison]",

  execute: async (
    message,
    args,
  ) => {
    if (
      !message.guild ||
      !message.member
    ) {
      return;
    }

    if (
      !isModerator(
        message.member,
      )
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    const member =
      await getTarget(
        message,
        args[0],
      );

    if (!member) {
      await message.reply(
        "❌ Membre introuvable.",
      );
      return;
    }

    if (
      jailLocks.has(
        member.id,
      )
    ) {
      await message.reply(
        "⚠️ La mise en prison de ce membre est déjà en cours.",
      );
      return;
    }

    const refreshedMember =
      await message.guild.members
        .fetch(
          member.id,
          {
            force: true,
          },
        )
        .catch(() => member);

    if (
      refreshedMember.roles.cache
        .has(JAIL_ROLE_ID)
    ) {
      await message.reply(
        "⚠️ Ce membre est déjà en prison.",
      );
      return;
    }

    if (
      !canActOn(
        message.member,
        refreshedMember,
      )
    ) {
      await message.reply(
        "❌ Tu ne peux pas emprisonner ce membre à cause de la hiérarchie.",
      );
      return;
    }

    const jailRole =
      message.guild.roles.cache.get(
        JAIL_ROLE_ID,
      );

    if (!jailRole) {
      await message.reply(
        "❌ Le rôle Jail est introuvable.",
      );
      return;
    }

    jailLocks.add(
      refreshedMember.id,
    );

    try {
      const rolesToRemove =
        getRestorableRoles(
          refreshedMember,
        );

      const reason =
        args
          .slice(1)
          .join(" ")
          .trim() ||
        "Aucune raison précisée";

      jailRecords[
        refreshedMember.id
      ] = {
        roles:
          rolesToRemove.map(
            (role) =>
              role.id,
          ),

        moderatorId:
          message.author.id,

        reason,

        jailedAt:
          Date.now(),
      };

      saveJailRecords();

      // On ajoute Jail immédiatement afin
      // d’éviter les doubles commandes.
      await refreshedMember.roles.add(
        jailRole,
        `Jail par ${message.author.tag} : ${reason}`,
      );

      // Les autres opérations se font ensuite.
      if (
        rolesToRemove.length > 0
      ) {
        await refreshedMember.roles.remove(
          rolesToRemove,
          `Jail par ${message.author.tag} : ${reason}`,
        );
      }

      const prisonVoice =
        findPrisonVoiceChannel(
          message.guild,
        );

      if (
        refreshedMember.voice
          .channel &&
        prisonVoice
      ) {
        await refreshedMember.voice
          .setChannel(
            prisonVoice,
          )
          .catch(() => {});
      }

      const embed =
        new EmbedBuilder()
          .setColor(0x6d28d9)
          .setTitle(
            "🔒 Membre emprisonné",
          )
          .addFields(
            {
              name: "Membre",
              value:
                `${refreshedMember}`,
              inline: true,
            },
            {
              name:
                "Modérateur",
              value:
                `${message.author}`,
              inline: true,
            },
            {
              name: "Raison",
              value: reason,
            },
            {
              name:
                "Rôles sauvegardés",
              value:
                String(
                  rolesToRemove.length,
                ),
              inline: true,
            },
          )
          .setTimestamp();

      await message.reply({
        embeds: [embed],
      });

      await sendServerLog(
        message.guild,
        {
          embeds: [embed],
        },
      );

      // Configuration en arrière-plan :
      // elle ne bloque plus la commande.
      void configureJailPermissions(
        message.guild,
      ).catch(
        (error) => {
          console.error(
            "❌ Erreur configuration permissions Jail :",
            error,
          );
        },
      );
    } catch (error) {
      console.error(
        "❌ Erreur Jail :",
        error,
      );

      delete jailRecords[
        refreshedMember.id
      ];

      saveJailRecords();

      await message.reply(
        "❌ Impossible de mettre ce membre en prison. Vérifie la hiérarchie et les permissions du bot.",
      );
    } finally {
      jailLocks.delete(
        refreshedMember.id,
      );
    }
  },
};

export const unjailCommand: Command = {
  name: "unjail",
  description:
    "Libère un membre et restaure ses rôles",
  usage:
    "*unjail @membre",

  execute: async (
    message,
    args,
  ) => {
    if (
      !message.guild ||
      !message.member
    ) {
      return;
    }

    if (
      !isModerator(
        message.member,
      )
    ) {
      await message.reply(
        "❌ Tu n’as pas la permission d’utiliser cette commande.",
      );
      return;
    }

    const member =
      await getTarget(
        message,
        args[0],
      );

    if (!member) {
      await message.reply(
        "❌ Membre introuvable.",
      );
      return;
    }

    if (
      unjailLocks.has(
        member.id,
      )
    ) {
      await message.reply(
        "⚠️ La libération de ce membre est déjà en cours.",
      );
      return;
    }

    const refreshedMember =
      await message.guild.members
        .fetch(
          member.id,
          {
            force: true,
          },
        )
        .catch(() => member);

    if (
      !refreshedMember.roles.cache
        .has(JAIL_ROLE_ID)
    ) {
      await message.reply(
        "⚠️ Ce membre n’est pas en prison.",
      );
      return;
    }

    unjailLocks.add(
      refreshedMember.id,
    );

    try {
      const record =
        jailRecords[
          refreshedMember.id
        ];

      await refreshedMember.roles.remove(
        JAIL_ROLE_ID,
        `Libération par ${message.author.tag}`,
      );

      let restored = 0;
      let failed = 0;

      if (record) {
        const botMember =
          message.guild.members.me;

        const restorableRoleIds =
          record.roles.filter(
            (roleId) => {
              const role =
                message.guild!.roles.cache.get(
                  roleId,
                );

              if (
                !role ||
                role.managed ||
                !botMember ||
                role.position >=
                  botMember.roles.highest
                    .position
              ) {
                failed += 1;
                return false;
              }

              return true;
            },
          );

        if (
          restorableRoleIds.length >
          0
        ) {
          try {
            await refreshedMember.roles.add(
              restorableRoleIds,
              `Restauration après unjail par ${message.author.tag}`,
            );

            restored =
              restorableRoleIds.length;
          } catch {
            failed +=
              restorableRoleIds.length;
          }
        }

        delete jailRecords[
          refreshedMember.id
        ];

        saveJailRecords();
      }

      const embed =
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(
            "🔓 Membre libéré",
          )
          .addFields(
            {
              name: "Membre",
              value:
                `${refreshedMember}`,
              inline: true,
            },
            {
              name:
                "Modérateur",
              value:
                `${message.author}`,
              inline: true,
            },
            {
              name:
                "Rôles restaurés",
              value:
                String(restored),
              inline: true,
            },
            {
              name: "Échecs",
              value:
                String(failed),
              inline: true,
            },
          )
          .setTimestamp();

      await message.reply({
        embeds: [embed],
      });

      await sendServerLog(
        message.guild,
        {
          embeds: [embed],
        },
      );
    } catch (error) {
      console.error(
        "❌ Erreur Unjail :",
        error,
      );

      await message.reply(
        "❌ Impossible de libérer ce membre. Vérifie la hiérarchie et les permissions du bot.",
      );
    } finally {
      unjailLocks.delete(
        refreshedMember.id,
      );
    }
  },
};
