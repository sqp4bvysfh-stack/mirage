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

function extractUserId(value?: string): string | null {
  if (!value) return null;

  const match = value.match(/^<@!?(\d+)>$/);
  const id = match?.[1] ?? value;

  return /^\d{17,20}$/.test(id) ? id : null;
}

export const blCommand: Command = {
  name: "bl",
  description: "Ajoute un utilisateur à la blacklist permanente",
  usage: "*bl @membre [raison] | *bl ID [raison] | *bl list",

  execute: async (message, args) => {
    if (
      !message.guild ||
      !message.member ||
      !canUseBlacklist(message.member)
    ) {
      await message.reply(
        "❌ Seuls le propriétaire, Owner et Co Owner peuvent utiliser cette commande.",
      );
      return;
    }

    if (args[0]?.toLowerCase() === "list") {
      const entries = getBlacklistEntries();

      if (entries.length === 0) {
        await message.reply("✅ La blacklist est vide.");
        return;
      }

      const shown = entries.slice(0, 20);

      const description = shown
        .map((entry, index) => {
          const date = Math.floor(
            Date.parse(entry.createdAt) / 1000,
          );

          return (
            `**${index + 1}.** <@${entry.userId}> — \`${entry.userId}\`\n` +
            `> **Raison :** ${entry.reason}\n` +
            `> **Par :** <@${entry.moderatorId}> • <t:${date}:R>`
          );
        })
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(0x6d28d9)
        .setTitle(
          `⛔ Blacklist — ${entries.length} utilisateur(s)`,
        )
        .setDescription(description)
        .setFooter({
          text:
            entries.length > shown.length
              ? `Affichage des ${shown.length} entrées les plus récentes.`
              : "Blacklist permanente de No Chill",
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    const userId = extractUserId(args[0]);

    if (!userId) {
      await message.reply(
        "❌ Utilisation : `*bl @membre raison` ou `*bl ID raison`.",
      );
      return;
    }

    if (userId === message.author.id) {
      await message.reply(
        "❌ Tu ne peux pas te blacklist toi-même.",
      );
      return;
    }

    if (userId === message.client.user.id) {
      await message.reply(
        "❌ Tu ne peux pas blacklist le bot.",
      );
      return;
    }

    if (userId === message.guild.ownerId) {
      await message.reply(
        "❌ Le propriétaire du serveur ne peut pas être blacklisté.",
      );
      return;
    }

    const existing = getBlacklistEntry(userId);

    if (existing) {
      await message.reply(
        `❌ <@${userId}> est déjà blacklisté pour : **${existing.reason}**`,
      );
      return;
    }

    const targetMember = await message.guild.members
      .fetch(userId)
      .catch(() => null);

    if (targetMember) {
      if (targetMember.permissions.has("Administrator")) {
        await message.reply(
          "❌ Tu ne peux pas blacklist un administrateur.",
        );
        return;
      }

      if (!targetMember.bannable) {
        await message.reply(
          "❌ Je ne peux pas bannir ce membre. Place le rôle du bot au-dessus du sien et vérifie la permission **Bannir des membres**.",
        );
        return;
      }
    }

    const reason =
      args.slice(1).join(" ").trim() ||
      "Aucune raison fournie";

    let userTag = `ID ${userId}`;

    try {
      const user = await message.client.users.fetch(userId);
      userTag = user.tag;
    } catch {
      // L'ID peut rester valide même si Discord ne renvoie pas le profil.
    }

    const entry = {
      userId,
      reason,
      moderatorId: message.author.id,
      moderatorTag: message.author.tag,
      createdAt: new Date().toISOString(),
    };

    addToBlacklist(entry);

    try {
      await message.guild.members.ban(userId, {
        deleteMessageSeconds: 60 * 60 * 24,
        reason: `Blacklist par ${message.author.tag} : ${reason}`,
      });
    } catch (error) {
      removeFromBlacklist(userId);

      console.error("Erreur blacklist/ban :", error);

      await message.reply(
        "❌ Le bannissement a échoué, donc la blacklist n’a pas été enregistrée. Vérifie que l’ID est valide et que le bot possède la permission **Bannir des membres**.",
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("⛔ Utilisateur blacklisté")
      .addFields(
        {
          name: "Utilisateur",
          value: `${userTag}\n<@${userId}>\n\`${userId}\``,
          inline: true,
        },
        {
          name: "Par",
          value: `${message.author.tag}\n<@${message.author.id}>`,
          inline: true,
        },
        {
          name: "Raison",
          value: reason,
        },
        {
          name: "Présent sur le serveur",
          value: targetMember ? "Oui" : "Non",
          inline: true,
        },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendServerLog(message.guild, {
      embeds: [embed],
    });
  },
};

export const unblCommand: Command = {
  name: "unbl",
  description: "Retire un utilisateur de la blacklist",
  usage: "*unbl @membre | *unbl ID",

  execute: async (message, args) => {
    if (
      !message.guild ||
      !message.member ||
      !canUseBlacklist(message.member)
    ) {
      await message.reply(
        "❌ Seuls le propriétaire, Owner et Co Owner peuvent utiliser cette commande.",
      );
      return;
    }

    const userId = extractUserId(args[0]);

    if (!userId) {
      await message.reply(
        "❌ Donne une mention ou un ID valide. Exemple : `*unbl 123456789012345678`",
      );
      return;
    }

    const removed = removeFromBlacklist(userId);

    if (!removed) {
      await message.reply(
        `❌ L’utilisateur \`${userId}\` n’est pas blacklisté.`,
      );
      return;
    }

    let unbanned = false;

    try {
      await message.guild.bans.remove(
        userId,
        `Retrait blacklist par ${message.author.tag}`,
      );

      unbanned = true;
    } catch {
      // La personne pouvait déjà ne plus être bannie.
    }

    await message.reply(
      `✅ <@${userId}> (\`${userId}\`) a été retiré de la blacklist` +
        (unbanned ? " et débanni." : "."),
    );

    const logEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(
        "✅ Utilisateur retiré de la blacklist",
      )
      .addFields(
        {
          name: "Utilisateur",
          value: `<@${userId}>\n\`${userId}\``,
          inline: true,
        },
        {
          name: "Par",
          value: `${message.author}\n${message.author.tag}`,
          inline: true,
        },
        {
          name: "Débanni",
          value: unbanned ? "Oui" : "Déjà débanni",
          inline: true,
        },
      )
      .setTimestamp();

    await sendServerLog(message.guild, {
      embeds: [logEmbed],
    });
  },
};

    await sendServerLog(message.guild, { embeds: [logEmbed] });
  },
};
