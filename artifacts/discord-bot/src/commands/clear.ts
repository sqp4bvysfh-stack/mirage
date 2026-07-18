import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import { sendMessageLog } from "../utils/logs.js";

const clearAllInProgress = new Set<string>();

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const BULK_DELETE_MARGIN_MS = 60 * 60 * 1000;

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds} seconde${totalSeconds > 1 ? "s" : ""}`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} min${seconds > 0 ? ` ${seconds} s` : ""}`;
}

async function clearRecentMessages(
  message: any,
  amount: number,
): Promise<void> {
  if (!("bulkDelete" in message.channel)) {
    await message.reply("❌ Cette commande ne fonctionne pas dans ce salon.");
    return;
  }

  const deleted = await message.channel
    .bulkDelete(amount + 1, true)
    .catch((error: unknown) => {
      console.error("Erreur clear :", error);
      return null;
    });

  if (!deleted) {
    await message.channel
      .send("❌ Je n’ai pas réussi à supprimer les messages.")
      .catch(() => {});
    return;
  }

  const deletedCount = Math.max(0, deleted.size - 1);

  const confirmation = new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle("🧹 Messages supprimés")
    .setDescription(`**${deletedCount}** message(s) supprimé(s).`)
    .setTimestamp();

  const confirmationMessage = await message.channel.send({
    embeds: [confirmation],
  });

  setTimeout(() => {
    confirmationMessage.delete().catch(() => {});
  }, 3000);

  const logEmbed = new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle("🧹 Nettoyage de messages")
    .addFields(
      {
        name: "Salon",
        value: `${message.channel}`,
        inline: true,
      },
      {
        name: "Modérateur",
        value: `${message.author}`,
        inline: true,
      },
      {
        name: "Messages supprimés",
        value: String(deletedCount),
        inline: true,
      },
    )
    .setTimestamp();

  await sendMessageLog(message.guild, { embeds: [logEmbed] });
}

async function clearEntireChannel(message: any): Promise<void> {
  const channel = message.channel;

  if (
    !channel ||
    !channel.isTextBased() ||
    !("messages" in channel) ||
    !("bulkDelete" in channel)
  ) {
    await message.reply("❌ Cette commande ne fonctionne pas dans ce salon.");
    return;
  }

  if (clearAllInProgress.has(channel.id)) {
    await message.reply(
      "⚠️ Un nettoyage complet est déjà en cours dans ce salon.",
    );
    return;
  }

  clearAllInProgress.add(channel.id);

  const startedAt = Date.now();
  let deletedCount = 0;
  let failedCount = 0;
  let before: string | undefined;

  const progressMessage = await message.reply(
    "🧹 **Nettoyage complet du salon en cours…**",
  );

  try {
    while (true) {
      const fetched = await channel.messages
        .fetch({
          limit: 100,
          ...(before ? { before } : {}),
        })
        .catch((error: unknown) => {
          console.error("Erreur récupération messages clear all :", error);
          return null;
        });

      if (!fetched || fetched.size === 0) break;

      const oldestMessage = fetched.last();
      before = oldestMessage?.id;

      const messages = fetched.filter(
        (item: any) => item.id !== progressMessage.id,
      );

      if (messages.size === 0) {
        if (fetched.size < 100) break;
        continue;
      }

      const bulkDeleteLimit =
        Date.now() - FOURTEEN_DAYS_MS + BULK_DELETE_MARGIN_MS;

      const recentMessages = messages.filter(
        (item: any) => item.createdTimestamp > bulkDeleteLimit,
      );

      const oldMessages = messages.filter(
        (item: any) => item.createdTimestamp <= bulkDeleteLimit,
      );

      if (recentMessages.size > 0) {
        const deleted = await channel
          .bulkDelete(recentMessages, true)
          .catch((error: unknown) => {
            console.error("Erreur suppression groupée clear all :", error);
            return null;
          });

        if (deleted) {
          deletedCount += deleted.size;
          failedCount += Math.max(0, recentMessages.size - deleted.size);
        } else {
          failedCount += recentMessages.size;
        }
      }

      for (const oldMessage of oldMessages.values()) {
        const deleted = await oldMessage
          .delete()
          .then(() => true)
          .catch((error: unknown) => {
            console.error(
              `Erreur suppression ancien message ${oldMessage.id}:`,
              error,
            );
            return false;
          });

        if (deleted) deletedCount += 1;
        else failedCount += 1;
      }

      if (fetched.size < 100) break;
    }

    const duration = Date.now() - startedAt;

    const resultEmbed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🧹 Salon entièrement nettoyé")
      .addFields(
        {
          name: "Messages supprimés",
          value: String(deletedCount),
          inline: true,
        },
        {
          name: "Échecs",
          value: String(failedCount),
          inline: true,
        },
        {
          name: "Durée",
          value: formatDuration(duration),
          inline: true,
        },
      )
      .setFooter({
        text: "Ce message disparaîtra automatiquement.",
      })
      .setTimestamp();

    await progressMessage.edit({
      content: "",
      embeds: [resultEmbed],
    });

    const logEmbed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🧹 Clear All")
      .addFields(
        {
          name: "Salon",
          value: `${channel}`,
          inline: true,
        },
        {
          name: "Modérateur",
          value: `${message.author}`,
          inline: true,
        },
        {
          name: "Messages supprimés",
          value: String(deletedCount),
          inline: true,
        },
        {
          name: "Échecs",
          value: String(failedCount),
          inline: true,
        },
        {
          name: "Durée",
          value: formatDuration(duration),
          inline: true,
        },
      )
      .setTimestamp();

    await sendMessageLog(message.guild, { embeds: [logEmbed] });

    setTimeout(() => {
      progressMessage.delete().catch(() => {});
    }, 5000);
  } catch (error) {
    console.error("Erreur clear all :", error);

    await progressMessage
      .edit({
        content:
          "❌ Une erreur est survenue pendant le nettoyage complet du salon.",
        embeds: [],
      })
      .catch(() => {});
  } finally {
    clearAllInProgress.delete(channel.id);
  }
}

export const clearCommand: Command = {
  name: "clear",
  description: "Supprime des messages ou vide entièrement le salon",
  usage: "*clear <nombre|all>",

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

    const argument = args[0]?.toLowerCase();

    if (argument === "all") {
      await clearEntireChannel(message);
      return;
    }

    const amount = Number.parseInt(argument ?? "", 10);

    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      await message.reply(
        "❌ Utilisation : `*clear 1-100` ou `*clear all`.",
      );
      return;
    }

    await clearRecentMessages(message, amount);
  },
};
