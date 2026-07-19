import { EmbedBuilder } from "discord.js";

import type { Command } from "../types.js";
import { canUseBlacklist } from "../utils/modCheck.js";
import { sendServerLog } from "../utils/logs.js";

import {
  addToBlacklist,
  getBlacklistEntries,
  getBlacklistEntry,
  removeFromBlacklist,
} from "../utils/blacklist.js";

function extractUserId(
  value?: string,
): string | null {
  if (!value) return null;

  const match =
    value.match(/^<@!?(\d+)>$/);

  const id =
    match?.[1] ?? value;

  return /^\d{17,20}$/.test(id)
    ? id
    : null;
}

export const blCommand: Command = {
  name: "bl",
  description:
    "Ajoute un utilisateur à la blacklist permanente",
  usage:
    "*bl @membre [raison] | *bl ID [raison] | *bl list",

  execute: async (
    message,
    args,
  ) => {
    if (
      !message.guild ||
      !message.member ||
      !canUseBlacklist(
        message.member,
      )
    ) {
      await message.reply(
        "❌ Seuls le propriétaire, Owner et Co Owner peuvent utiliser cette commande.",
      );
      return;
    }

    if (
      args[0]?.toLowerCase() ===
      "list"
    ) {
      const storedEntries =
        getBlacklistEntries();

      const storedById =
        new Map(
          storedEntries.map(
            (entry) => [
              entry.userId,
              entry,
            ],
          ),
        );

      const bans =
        await message.guild.bans
          .fetch()
          .catch(() => null);

      if (!bans) {
        await message.reply(
          "❌ Impossible de récupérer la liste des bannissements Discord.",
        );
        return;
      }

      const merged = [
        ...bans.values(),
      ].map((ban) => {
        const stored =
          storedById.get(
            ban.user.id,
          );

        return {
          userId: ban.user.id,
          userTag: ban.user.tag,
          reason:
            stored?.reason ??
            ban.reason ??
            "Raison inconnue",
          moderatorId:
            stored?.moderatorId ??
            null,
          createdAt:
            stored?.createdAt ??
            null,
          stored:
            Boolean(stored),
        };
      });

      if (
        merged.length === 0
      ) {
        await message.reply(
          "✅ Aucun utilisateur n’est actuellement banni.",
        );
        return;
      }

      const shown =
        merged.slice(0, 20);

      const description =
        shown
          .map(
            (
              entry,
              index,
            ) => {
              const date =
                entry.createdAt
                  ? Math.floor(
                      Date.parse(
                        entry.createdAt,
                      ) / 1000,
                    )
                  : null;

              const moderator =
                entry.moderatorId
                  ? `<@${entry.moderatorId}>`
                  : "Inconnu";

              const when =
                date
                  ? `<t:${date}:R>`
                  : "Date inconnue";

              return (
                `**${index + 1}.** ${entry.userTag} — <@${entry.userId}> — \`${entry.userId}\`\n` +
                `> **Raison :** ${entry.reason}\n` +
                `> **Par :** ${moderator} • ${when}\n` +
                `> **Source :** ${entry.stored ? "Blacklist enregistrée" : "Bannissement Discord"}`
              );
            },
          )
          .join("\n\n");

      const embed =
        new EmbedBuilder()
          .setColor(0x6d28d9)
          .setTitle(
            `⛔ Blacklist — ${merged.length} utilisateur(s)`,
          )
          .setDescription(
            description,
          )
          .setFooter({
            text:
              merged.length >
              shown.length
                ? `Affichage des ${shown.length} premiers bannissements.`
                : "Liste reconstruite depuis les bannissements Discord.",
          })
          .setTimestamp();

      await message.reply({
        embeds: [embed],
      });

      return;
    }

    const userId =
      extractUserId(args[0]);

    if (!userId) {
      await message.reply(
        "❌ Utilisation : `*bl @membre raison` ou `*bl ID raison`.",
      );
      return;
    }

    if (
      userId ===
      message.author.id
    ) {
      await message.reply(
        "❌ Tu ne peux pas te blacklist toi-même.",
      );
      return;
    }

    if (
      userId ===
      message.client.user.id
    ) {
      await message.reply(
        "❌ Tu ne peux pas blacklist le bot.",
      );
      return;
    }

    if (
      userId ===
      message.guild.ownerId
    ) {
      await message.reply(
        "❌ Le propriétaire du serveur ne peut pas être blacklisté.",
      );
      return;
    }

    const existing =
      getBlacklistEntry(
        userId,
      );

    if (existing) {
      await message.reply(
        `❌ <@${userId}> est déjà blacklisté pour : **${existing.reason}**`,
      );
      return;
    }

    const existingBan =
      await message.guild.bans
        .fetch(userId)
        .catch(() => null);

    if (existingBan) {
      await message.reply(
        `❌ <@${userId}> est déjà banni du serveur.`,
      );
      return;
    }

    const targetMember =
      await message.guild.members
        .fetch(userId)
        .catch(() => null);

    if (targetMember) {
      if (
        targetMember.permissions.has(
          "Administrator",
        )
      ) {
        await message.reply(
          "❌ Tu ne peux pas blacklist un administrateur.",
        );
        return;
      }

      if (
        !targetMember.bannable
      ) {
        await message.reply(
          "❌ Je ne peux pas bannir ce membre. Place le rôle du bot au-dessus du sien et vérifie la permission **Bannir des membres**.",
        );
        return;
      }
    }

    const reason =
      args
        .slice(1)
        .join(" ")
        .trim() ||
      "Aucune raison fournie";

    let userTag =
      `ID ${userId}`;

    try {
      const user =
        await message.client.users
          .fetch(userId);

      userTag = user.tag;
    } catch {
      // L'ID peut rester valide même si Discord ne renvoie pas le profil.
    }

    const entry = {
      userId,
      reason,
      moderatorId:
        message.author.id,
      moderatorTag:
        message.author.tag,
      createdAt:
        new Date().toISOString(),
    };

    addToBlacklist(entry);

    try {
      await message.guild.members
        .ban(userId, {
          deleteMessageSeconds:
            60 * 60 * 24,
          reason:
            `Blacklist par ${message.author.tag} : ${reason}`,
        });
    } catch (error) {
      removeFromBlacklist(
        userId,
      );

      console.error(
        "Erreur blacklist/ban :",
        error,
      );

      await message.reply(
        "❌ Le bannissement a échoué, donc la blacklist n’a pas été enregistrée. Vérifie que l’ID est valide et que le bot possède la permission **Bannir des membres**.",
      );
      return;
    }

    const embed =
      new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          "⛔ Utilisateur blacklisté",
        )
        .addFields(
          {
            name: "Utilisateur",
            value:
              `${userTag}\n<@${userId}>\n\`${userId}\``,
            inline: true,
          },
          {
            name: "Par",
            value:
              `${message.author.tag}\n<@${message.author.id}>`,
            inline: true,
          },
          {
            name: "Raison",
            value: reason,
          },
          {
            name:
              "Présent sur le serveur",
            value:
              targetMember
                ? "Oui"
                : "Non",
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
  },
};

export const unblCommand: Command = {
  name: "unbl",
  description:
    "Retire un utilisateur de la blacklist",
  usage:
    "*unbl @membre | *unbl ID",

  execute: async (
    message,
    args,
  ) => {
    if (
      !message.guild ||
      !message.member ||
      !canUseBlacklist(
        message.member,
      )
    ) {
      await message.reply(
        "❌ Seuls le propriétaire, Owner et Co Owner peuvent utiliser cette commande.",
      );
      return;
    }

    const userId =
      extractUserId(args[0]);

    if (!userId) {
      await message.reply(
        "❌ Donne une mention ou un ID valide. Exemple : `*unbl 123456789012345678`",
      );
      return;
    }

    const removed =
      removeFromBlacklist(
        userId,
      );

    const banExists =
      await message.guild.bans
        .fetch(userId)
        .catch(() => null);

    if (
      !removed &&
      !banExists
    ) {
      await message.reply(
        `❌ L’utilisateur \`${userId}\` n’est ni blacklisté ni banni.`,
      );
      return;
    }

    let unbanned = false;

    if (banExists) {
      try {
        await message.guild.bans
          .remove(
            userId,
            `Retrait blacklist par ${message.author.tag}`,
          );

        unbanned = true;
      } catch {
        // Le retrait du JSON reste valide même si le déban échoue.
      }
    }

    await message.reply(
      `✅ <@${userId}> (\`${userId}\`) a été retiré de la blacklist` +
        (
          unbanned
            ? " et débanni."
            : "."
        ),
    );

    const logEmbed =
      new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(
          "✅ Utilisateur retiré de la blacklist",
        )
        .addFields(
          {
            name: "Utilisateur",
            value:
              `<@${userId}>\n\`${userId}\``,
            inline: true,
          },
          {
            name: "Par",
            value:
              `${message.author}\n${message.author.tag}`,
            inline: true,
          },
          {
            name: "Débanni",
            value:
              unbanned
                ? "Oui"
                : "Non",
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
