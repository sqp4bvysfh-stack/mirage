import {
  EmbedBuilder,
  type Message,
  type TextBasedChannel,
} from "discord.js";

import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { getConfig } from "../utils/serverConfig.js";
import { sendServerLog } from "../utils/logs.js";

const DEFAULT_GIVEAWAY_CHANNEL =
  "1500134760314572810";

const BOOST_MULTIPLIER = 3;

type ActiveGiveaway = {
  messageId: string;
  channelId: string;
  guildId: string;
  prize: string;
  winnerCount: number;
  conditions: string;
  timeout: NodeJS.Timeout;
  ended: boolean;
};

const activeGiveaways =
  new Map<string, ActiveGiveaway>();

function parseDuration(
  value: string,
): number | null {
  const match =
    value.match(
      /^(\d+)(s|m|h|j)$/i,
    );

  if (!match) return null;

  const amount =
    Number.parseInt(
      match[1],
      10,
    );

  const unit =
    match[2].toLowerCase();

  if (unit === "s") {
    return amount * 1000;
  }

  if (unit === "m") {
    return amount * 60 * 1000;
  }

  if (unit === "h") {
    return amount * 60 * 60 * 1000;
  }

  if (unit === "j") {
    return amount * 24 * 60 * 60 * 1000;
  }

  return null;
}

function formatDuration(
  milliseconds: number,
): string {
  const hours =
    Math.floor(
      milliseconds /
      3_600_000,
    );

  const minutes =
    Math.floor(
      (
        milliseconds %
        3_600_000
      ) /
      60_000,
    );

  const seconds =
    Math.floor(
      (
        milliseconds %
        60_000
      ) /
      1000,
    );

  if (hours > 0) {
    return (
      `${hours}h` +
      (
        minutes > 0
          ? ` ${minutes}m`
          : ""
      )
    );
  }

  if (minutes > 0) {
    return (
      `${minutes}m` +
      (
        seconds > 0
          ? ` ${seconds}s`
          : ""
      )
    );
  }

  return `${seconds}s`;
}

async function askGiveawayConditions(
  message: Message,
): Promise<string | null> {
  const prompt =
    await message.channel.send(
      "📋 **Conditions du giveaway**\n\n" +
      "Écris les conditions que tu veux afficher.\n" +
      "Tu peux faire plusieurs lignes.\n\n" +
      "Tape `aucune` pour ne mettre aucune condition, ou `annuler` pour arrêter.\n" +
      "*Tu as 2 minutes.*",
    );

  try {
    const collected =
      await message.channel.awaitMessages({
        filter:
          (candidate) =>
            candidate.author.id ===
            message.author.id,

        max: 1,
        time: 120_000,
        errors: ["time"],
      });

    const reply =
      collected.first();

    if (!reply) return null;

    const content =
      reply.content.trim();

    await reply
      .delete()
      .catch(() => {});

    await prompt
      .delete()
      .catch(() => {});

    if (
      content.toLowerCase() ===
      "annuler"
    ) {
      return null;
    }

    if (
      content.toLowerCase() ===
        "aucune" ||
      content.toLowerCase() ===
        "non"
    ) {
      return "Aucune condition particulière.";
    }

    return content.slice(
      0,
      1024,
    );
  } catch {
    await prompt
      .delete()
      .catch(() => {});

    await message.channel.send(
      "⏰ Temps écoulé. Giveaway annulé.",
    );

    return null;
  }
}

function pickUniqueWinners(
  userIds: string[],
  count: number,
): string[] {
  const shuffled = [
    ...new Set(userIds),
  ];

  for (
    let index =
      shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        (index + 1),
      );

    [
      shuffled[index],
      shuffled[randomIndex],
    ] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(
    0,
    Math.min(
      count,
      shuffled.length,
    ),
  );
}

async function finishGiveaway(
  client: Message["client"],
  messageId: string,
  manual = false,
): Promise<boolean> {
  const active =
    activeGiveaways.get(
      messageId,
    );

  if (!active || active.ended) {
    return false;
  }

  active.ended = true;
  clearTimeout(active.timeout);

  try {
    const guild =
      await client.guilds
        .fetch(active.guildId)
        .catch(() => null);

    if (!guild) {
      activeGiveaways.delete(
        messageId,
      );
      return false;
    }

    const channel =
      await guild.channels
        .fetch(active.channelId)
        .catch(() => null);

    if (
      !channel ||
      !channel.isTextBased()
    ) {
      activeGiveaways.delete(
        messageId,
      );
      return false;
    }

    const giveawayMessage =
      await channel.messages
        .fetch(messageId)
        .catch(() => null);

    if (!giveawayMessage) {
      activeGiveaways.delete(
        messageId,
      );
      return false;
    }

    const reaction =
      giveawayMessage
        .reactions.cache
        .get("🎉");

    const users =
      reaction
        ? await reaction.users.fetch()
        : null;

    const candidates =
      users
        ? [
            ...users.values(),
          ]
            .filter(
              (user) =>
                !user.bot,
            )
            .map(
              (user) =>
                user.id,
            )
        : [];

    const winners =
      pickUniqueWinners(
        candidates,
        active.winnerCount,
      );

    const endEmbed =
      new EmbedBuilder()
        .setTitle(
          manual
            ? "✦ Giveaway arrêté"
            : "✦ Giveaway terminé",
        )
        .setDescription(
          `**Prix :** ${active.prize}`,
        )
        .addFields({
          name: "📋 Conditions annoncées",
          value:
            active.conditions,
        })
        .setTimestamp();

    if (
      winners.length === 0
    ) {
      endEmbed
        .setColor(0xe74c3c)
        .addFields({
          name: "Résultat",
          value:
            "❌ Aucun participant.",
        });

      await giveawayMessage.edit({
        embeds: [endEmbed],
      });

      await channel.send({
        embeds: [endEmbed],
      });

      activeGiveaways.delete(
        messageId,
      );

      return true;
    }

    const winnerList =
      winners
        .map(
          (winnerId, index) =>
            `**${index + 1}.** <@${winnerId}>`,
        )
        .join("\n");

    endEmbed
      .setColor(0x2ecc71)
      .addFields({
        name:
          winners.length > 1
            ? "🏆 Gagnants"
            : "🏆 Gagnant",

        value:
          winnerList,
      });

    await giveawayMessage.edit({
      embeds: [endEmbed],
    });

    await channel.send({
      content:
        `🎊 ${winners.map((id) => `<@${id}>`).join(" ")}\n` +
        (
          winners.length > 1
            ? `Vous avez gagné **${active.prize}** !`
            : `Tu as gagné **${active.prize}** !`
        ),

      embeds: [endEmbed],
    });

    await sendServerLog(
      guild,
      {
        embeds: [endEmbed],
      },
    );

    activeGiveaways.delete(
      messageId,
    );

    return true;
  } catch (error) {
    console.error(
      "Erreur fin giveaway :",
      error,
    );

    activeGiveaways.delete(
      messageId,
    );

    return false;
  }
}

function findLatestActiveGiveaway(
  channelId: string,
): ActiveGiveaway | null {
  const activeInChannel = [
    ...activeGiveaways.values(),
  ]
    .filter(
      (giveaway) =>
        giveaway.channelId ===
          channelId &&
        !giveaway.ended,
    );

  return (
    activeInChannel.at(-1) ??
    null
  );
}

export const giveawayCommand: Command = {
  name: "giveaway",
  description:
    "Lance ou termine un giveaway",
  usage:
    "*giveaway <durée> [nombre_gagnants] <prix> | *giveaway end [ID]",

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
      args[0]?.toLowerCase() ===
      "end"
    ) {
      const requestedId =
        args[1];

      const active =
        requestedId
          ? activeGiveaways.get(
              requestedId,
            )
          : findLatestActiveGiveaway(
              message.channel.id,
            );

      if (!active) {
        await message.reply(
          requestedId
            ? "❌ Aucun giveaway actif trouvé avec cet ID."
            : "❌ Aucun giveaway actif trouvé dans ce salon.",
        );
        return;
      }

      const ended =
        await finishGiveaway(
          message.client,
          active.messageId,
          true,
        );

      await message.reply(
        ended
          ? "✅ Giveaway terminé manuellement."
          : "❌ Impossible de terminer ce giveaway.",
      );

      return;
    }

    const giveawayChannelId =
      getConfig(
        message.guild.id,
      ).giveawayChannel ??
      DEFAULT_GIVEAWAY_CHANNEL;

    if (
      message.channel.id !==
      giveawayChannelId
    ) {
      await message.reply(
        `❌ Utilise cette commande dans <#${giveawayChannelId}>.`,
      );
      return;
    }

    const duration =
      args[0]
        ? parseDuration(
            args[0],
          )
        : null;

    if (!duration) {
      await message.reply(
        "❌ Durée invalide. Utilise `10m`, `1h` ou `1j`.",
      );
      return;
    }

    const possibleWinnerCount =
      Number.parseInt(
        args[1] ?? "",
        10,
      );

    const hasWinnerCount =
      !Number.isNaN(
        possibleWinnerCount,
      );

    const winnerCount =
      hasWinnerCount
        ? possibleWinnerCount
        : 1;

    if (
      winnerCount < 1 ||
      winnerCount > 20
    ) {
      await message.reply(
        "❌ Le nombre de gagnants doit être compris entre 1 et 20.",
      );
      return;
    }

    const prize =
      args
        .slice(
          hasWinnerCount
            ? 2
            : 1,
        )
        .join(" ")
        .trim();

    if (!prize) {
      await message.reply(
        "❌ Indique un prix. Exemple : `*giveaway 1h 3 Nitro`.",
      );
      return;
    }

    const conditions =
      await askGiveawayConditions(
        message,
      );

    if (!conditions) {
      await message.reply(
        "❌ Giveaway annulé.",
      );
      return;
    }

    const endTime =
      Date.now() +
      duration;

    const embed =
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          "✦ No Chill • Giveaway",
        )
        .setDescription(
          `**Prix :** ${prize}\n\n` +
          "Réagis avec 🎉 pour participer !",
        )
        .addFields(
          {
            name: "⏱️ Durée",
            value:
              formatDuration(
                duration,
              ),
            inline: true,
          },
          {
            name: "🏁 Fin",
            value:
              `<t:${Math.floor(endTime / 1000)}:R>`,
            inline: true,
          },
          {
            name:
              winnerCount > 1
                ? "🏆 Gagnants"
                : "🏆 Gagnant",

            value:
              String(
                winnerCount,
              ),

            inline: true,
          },
          {
            name: "📋 Conditions",
            value: conditions,
          },
        )
        .setFooter({
          text:
            `Organisé par ${message.author.tag}`,
        })
        .setTimestamp();

    const giveawayMessage =
      await message.channel.send({
        embeds: [embed],
      });

    await giveawayMessage.react(
      "🎉",
    );

    const timeout =
      setTimeout(() => {
        void finishGiveaway(
          message.client,
          giveawayMessage.id,
        );
      }, duration);

    activeGiveaways.set(
      giveawayMessage.id,
      {
        messageId:
          giveawayMessage.id,

        channelId:
          giveawayMessage.channel.id,

        guildId:
          message.guild.id,

        prize,
        winnerCount,
        conditions,
        timeout,
        ended: false,
      },
    );

    const startLog =
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          "🎉 Giveaway lancé",
        )
        .addFields(
          {
            name: "Prix",
            value: prize,
            inline: true,
          },
          {
            name: "Durée",
            value:
              formatDuration(
                duration,
              ),
            inline: true,
          },
          {
            name: "Gagnants",
            value:
              String(
                winnerCount,
              ),
            inline: true,
          },
          {
            name: "Conditions",
            value: conditions,
          },
          {
            name: "Message",
            value:
              `[Ouvrir](${giveawayMessage.url})`,
          },
        )
        .setTimestamp();

    await sendServerLog(
      message.guild,
      {
        embeds: [startLog],
      },
    );

    await message
      .delete()
      .catch(() => {});
  },
};

export const topGiveawayCommand: Command = {
  name: "topgiveaway",
  description:
    "Giveaway Top X avec avantage booster",
  usage:
    "*topgiveaway <durée> <nb_gagnants> <prix>",

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

    const duration =
      args[0]
        ? parseDuration(
            args[0],
          )
        : null;

    if (!duration) {
      await message.reply(
        "❌ Durée invalide.",
      );
      return;
    }

    const winnerCount =
      Number.parseInt(
        args[1] ?? "",
        10,
      );

    if (
      Number.isNaN(
        winnerCount,
      ) ||
      winnerCount < 1 ||
      winnerCount > 20
    ) {
      await message.reply(
        "❌ Nombre de gagnants invalide.",
      );
      return;
    }

    const prize =
      args
        .slice(2)
        .join(" ")
        .trim();

    if (!prize) {
      await message.reply(
        "❌ Indique un prix.",
      );
      return;
    }

    const endTime =
      Date.now() +
      duration;

    const embed =
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          "✦ No Chill • Top Giveaway",
        )
        .setDescription(
          `**Prix :** ${prize}\n\n` +
          "Réagis avec 🎉 pour participer !",
        )
        .addFields(
          {
            name: "⏱️ Durée",
            value:
              formatDuration(
                duration,
              ),
            inline: true,
          },
          {
            name: "🏁 Fin",
            value:
              `<t:${Math.floor(endTime / 1000)}:R>`,
            inline: true,
          },
          {
            name: "🏆 Gagnants",
            value:
              String(
                winnerCount,
              ),
            inline: true,
          },
          {
            name: "💎 Avantage boost",
            value:
              `Les boosters ont **${BOOST_MULTIPLIER}x** plus de chances.`,
          },
        )
        .setFooter({
          text:
            `Organisé par ${message.author.tag}`,
        })
        .setTimestamp();

    const giveawayMessage =
      await message.channel.send({
        embeds: [embed],
      });

    await giveawayMessage.react(
      "🎉",
    );

    await message
      .delete()
      .catch(() => {});

    setTimeout(async () => {
      try {
        const fetched =
          await message.channel.messages
            .fetch(
              giveawayMessage.id,
            );

        const reaction =
          fetched.reactions.cache.get(
            "🎉",
          );

        if (!reaction) {
          await message.channel.send(
            "❌ Personne n’a participé.",
          );
          return;
        }

        const users =
          await reaction.users.fetch();

        const humans = [
          ...users.values(),
        ].filter(
          (user) =>
            !user.bot,
        );

        const weightedPool:
          string[] = [];

        for (
          const user
          of humans
        ) {
          const member =
            await message.guild!.members
              .fetch(user.id)
              .catch(() => null);

          const tickets =
            member?.premiumSince
              ? BOOST_MULTIPLIER
              : 1;

          for (
            let index = 0;
            index < tickets;
            index += 1
          ) {
            weightedPool.push(
              user.id,
            );
          }
        }

        const winners =
          pickUniqueWinners(
            weightedPool,
            winnerCount,
          );

        const list =
          winners
            .map(
              (id, index) =>
                `**${index + 1}.** <@${id}>`,
            )
            .join("\n");

        const endEmbed =
          new EmbedBuilder()
            .setColor(0x6d28d9)
            .setTitle(
              "✦ Top Giveaway • Résultats",
            )
            .setDescription(
              `**Prix :** ${prize}`,
            )
            .addFields({
              name:
                `🏆 Gagnants`,

              value:
                list ||
                "❌ Aucun participant.",
            })
            .setTimestamp();

        await fetched.edit({
          embeds: [endEmbed],
        });

        if (
          winners.length > 0
        ) {
          await message.channel.send({
            content:
              `🎊 ${winners.map((id) => `<@${id}>`).join(" ")}\n` +
              `Vous gagnez **${prize}** !`,

            embeds: [endEmbed],
          });
        }
      } catch (error) {
        console.error(
          "Erreur topgiveaway :",
          error,
        );
      }
    }, duration);
  },
};

export const rerollCommand: Command = {
  name: "reroll",
  description:
    "Remplace un ou plusieurs gagnants d’un giveaway",
  usage:
    "*reroll [ID_message] @gagnant1 [@gagnant2...]",

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

    const mentionedUsers = [
      ...message.mentions.users.values(),
    ].filter(
      (user) =>
        !user.bot,
    );

    if (
      mentionedUsers.length === 0
    ) {
      await message.reply(
        "❌ Mentionne le ou les gagnants à remplacer.\n" +
        "Exemple : `*reroll ID @gagnant1 @gagnant2`.",
      );
      return;
    }

    let giveawayMessageId:
      string | null = null;

    const rawId =
      args.find(
        (arg) =>
          /^\d{17,20}$/.test(arg),
      );

    if (rawId) {
      giveawayMessageId =
        rawId;
    }

    if (
      !giveawayMessageId &&
      message.reference?.messageId
    ) {
      giveawayMessageId =
        message.reference.messageId;
    }

    if (
      !giveawayMessageId
    ) {
      await message.reply(
        "❌ Donne l’ID du message du giveaway ou réponds directement à son message.",
      );
      return;
    }

    const giveawayMessage =
      await message.channel.messages
        .fetch(
          giveawayMessageId,
        )
        .catch(() => null);

    if (
      !giveawayMessage
    ) {
      await message.reply(
        "❌ Message du giveaway introuvable dans ce salon.",
      );
      return;
    }

    const reaction =
      giveawayMessage
        .reactions.cache
        .get("🎉");

    if (!reaction) {
      await message.reply(
        "❌ Aucune réaction 🎉 trouvée sur ce giveaway.",
      );
      return;
    }

    const users =
      await reaction.users.fetch();

    const participants = [
      ...users.values(),
    ].filter(
      (user) =>
        !user.bot,
    );

    if (
      participants.length === 0
    ) {
      await message.reply(
        "❌ Aucun participant disponible pour le reroll.",
      );
      return;
    }

    const embed =
      giveawayMessage.embeds[0];

    if (!embed) {
      await message.reply(
        "❌ Impossible de lire les gagnants actuels de ce giveaway.",
      );
      return;
    }

    const winnerField =
      embed.fields.find(
        (field) =>
          field.name
            .toLowerCase()
            .includes("gagnant"),
      );

    if (!winnerField) {
      await message.reply(
        "❌ Aucun gagnant actuel n’a été trouvé dans le message.",
      );
      return;
    }

    const currentWinnerIds = [
      ...winnerField.value.matchAll(
        /<@!?(\d{17,20})>/g,
      ),
    ].map(
      (match) =>
        match[1],
    );

    if (
      currentWinnerIds.length === 0
    ) {
      await message.reply(
        "❌ Aucun gagnant actuel n’a été trouvé dans le message.",
      );
      return;
    }

    const replacementIds =
      mentionedUsers.map(
        (user) =>
          user.id,
      );

    const invalidMentions =
      replacementIds.filter(
        (userId) =>
          !currentWinnerIds.includes(
            userId,
          ),
      );

    if (
      invalidMentions.length > 0
    ) {
      await message.reply(
        "❌ Ces personnes ne font pas partie des gagnants actuels : " +
        invalidMentions
          .map(
            (id) =>
              `<@${id}>`,
          )
          .join(" "),
      );
      return;
    }

    const keptWinnerIds =
      currentWinnerIds.filter(
        (userId) =>
          !replacementIds.includes(
            userId,
          ),
      );

    const excludedIds =
      new Set([
        ...currentWinnerIds,
        ...replacementIds,
      ]);

    const eligibleParticipants =
      participants.filter(
        (user) =>
          !excludedIds.has(
            user.id,
          ),
      );

    if (
      eligibleParticipants.length <
      replacementIds.length
    ) {
      await message.reply(
        `❌ Pas assez de participants disponibles pour remplacer ${replacementIds.length} gagnant(s).`,
      );
      return;
    }

    const shuffled = [
      ...eligibleParticipants,
    ];

    for (
      let index =
        shuffled.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
          (index + 1),
        );

      [
        shuffled[index],
        shuffled[randomIndex],
      ] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }

    const newWinners =
      shuffled.slice(
        0,
        replacementIds.length,
      );

    const finalWinnerIds = [
      ...keptWinnerIds,
      ...newWinners.map(
        (user) =>
          user.id,
      ),
    ];

    const updatedFields =
      embed.fields.map(
        (field) => {
          if (
            field.name !==
            winnerField.name
          ) {
            return {
              name: field.name,
              value: field.value,
              inline:
                field.inline,
            };
          }

          return {
            name:
              finalWinnerIds.length > 1
                ? "🏆 Gagnants"
                : "🏆 Gagnant",

            value:
              finalWinnerIds
                .map(
                  (userId, index) =>
                    `**${index + 1}.** <@${userId}>`,
                )
                .join("\n"),

            inline:
              field.inline,
          };
        },
      );

    const updatedEmbed =
      EmbedBuilder.from(embed)
        .setFields(
          updatedFields,
        )
        .setTimestamp();

    await giveawayMessage.edit({
      embeds: [
        updatedEmbed,
      ],
    });

    const replacedText =
      replacementIds
        .map(
          (id) =>
            `<@${id}>`,
        )
        .join(" ");

    const replacementsText =
      newWinners
        .map(
          (user) =>
            `<@${user.id}>`,
        )
        .join(" ");

    await message.channel.send({
      content:
        `🔄 **Reroll effectué**\n` +
        `Remplacé(s) : ${replacedText}\n` +
        `Nouveau(x) gagnant(s) : ${replacementsText}`,
      allowedMentions: {
        users:
          newWinners.map(
            (user) =>
              user.id,
          ),
      },
    });

    const logEmbed =
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          "🔄 Giveaway reroll",
        )
        .addFields(
          {
            name:
              "Gagnants remplacés",
            value:
              replacedText,
          },
          {
            name:
              "Nouveaux gagnants",
            value:
              replacementsText,
          },
          {
            name: "Par",
            value:
              `${message.author}`,
            inline: true,
          },
          {
            name:
              "Giveaway",
            value:
              `[Ouvrir](${giveawayMessage.url})`,
            inline: true,
          },
        )
        .setTimestamp();

    await sendServerLog(
      message.guild,
      {
        embeds: [
          logEmbed,
        ],
      },
    );
  },
};
